import io
import json
import logging
import re
from typing import List, Dict, Any, Optional
from pypdf import PdfReader
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

def extract_text_and_pages_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Extracts text per page from uploaded PDF bytes.
    Returns: [{"page": 1, "text": "..."}]
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages_data = []
    
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        # Remove PostgreSQL-incompatible null characters (\x00 / \u0000)
        text = text.replace('\x00', '').replace('\u0000', '')
        text = text.strip()
        if text:
            pages_data.append({
                "page": i + 1,
                "text": text
            })
    return pages_data



def recursive_split_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    """
    Splits text recursively by paragraphs, sentences, and words to avoid slicing sentences mid-thought.
    """
    if len(text) <= chunk_size:
        return [text.strip()] if text.strip() else []

    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    current_chunk = ""

    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if len(current_chunk) + len(p) + 2 <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{p}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            if len(p) > chunk_size:
                # Split paragraph by sentences
                sentences = re.split(r'(?<=[.!?])\s+', p)
                sub_chunk = ""
                for s in sentences:
                    if len(sub_chunk) + len(s) + 1 <= chunk_size:
                        sub_chunk = f"{sub_chunk} {s}".strip()
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk)
                        sub_chunk = s
                if sub_chunk:
                    current_chunk = sub_chunk
                else:
                    current_chunk = ""
            else:
                current_chunk = p

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def build_semantic_sections(pages_data: List[Dict[str, Any]], chunk_size: int = 700) -> List[Dict[str, Any]]:
    """
    Builds fine-grained chunks preserving exact source page metadata.
    """
    sections = []
    chunk_idx = 0
    for page_item in pages_data:
        page_num = page_item["page"]
        raw_text = page_item["text"]
        sub_chunks = recursive_split_text(raw_text, chunk_size=chunk_size)
        for chunk_text in sub_chunks:
            sections.append({
                "page_number": page_num,
                "chunk_index": chunk_idx,
                "content": chunk_text
            })
            chunk_idx += 1
    return sections


async def generate_dense_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Calls OpenAI / compatible embedding API to generate dense vector representations (1536 dims).
    """
    api_key = settings.AI_API_KEY
    if not api_key:
        raise ValueError("AI_API_KEY is not set in configuration.")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=settings.AI_BASE_URL
    )

    embeddings = []
    # Batch embeddings in groups of 30
    batch_size = 30
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        # Clean text
        clean_batch = [t.replace("\n", " ").strip() for t in batch]
        response = await client.embeddings.create(
            model=settings.AI_EMBEDDING_MODEL,
            input=clean_batch
        )
        for item in response.data:
            embeddings.append(item.embedding)

    return embeddings


async def generate_query_embedding(query: str) -> List[float]:
    """
    Embeds a search query for vector similarity retrieval.
    """
    results = await generate_dense_embeddings([query])
    return results[0]


async def generate_flashcards_from_vector_contexts(
    retrieved_sections: List[Dict[str, Any]],
    card_count: int = 10,
    focus_mode: str = "high_yield",
    deck_title_hint: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates structured flashcards grounded strictly in retrieved vector document sections.
    """
    api_key = settings.AI_API_KEY
    if not api_key:
        raise ValueError("AI_API_KEY is not set in configuration.")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=settings.AI_BASE_URL
    )

    # Format vector context items with citation metadata
    formatted_context_blocks = []
    for sec in retrieved_sections:
        page = sec.get("page_number", "N/A")
        content = sec.get("content", "")
        formatted_context_blocks.append(f"[Source Page {page}]:\n{content}")

    combined_context = "\n\n---\n\n".join(formatted_context_blocks)

    focus_instructions = {
        "high_yield": "Focus on high-yield exam concepts, fundamental laws/mechanisms, formulas, and critical diagnostic criteria.",
        "definitions": "Focus strictly on definitions, key vocabulary, acronyms, and terminology.",
        "comprehensive": "Provide a well-rounded breakdown covering main concepts, edge cases, formulas, and nuances.",
        "problem_solving": "Focus on scenario-based questions, algorithmic patterns, diagnostic steps, and problem-solving rules."
    }.get(focus_mode, "Focus on high-yield core concepts.")

    system_prompt = f"""You are an elite academic tutor and spaced repetition expert specializing in high-retention active recall flashcards.
Your goal is to parse the grounded context retrieved from the student's study material and extract exactly {card_count} atomic flashcards.

Guidelines:
1. **Grounded in Retrieved Context**: Generate flashcards ONLY based on facts present in the provided study passages.
2. **Atomic Principle**: Each card tests ONE specific concept or fact.
3. **Clear & Unambiguous Prompt (Front)**: Clear question or active recall trigger.
4. **Concise & Punchy Answer (Back)**: Clear, accurate answer.
5. **Exact Source Citation**: In the `page_reference` field, specify the exact page number (e.g. "Page 3") where this fact was found.
6. **Tags**: 1 to 3 relevant concise tags (e.g. ["#cardiology", "#valves"]).

{focus_instructions}

Respond strictly with valid JSON adhering to this schema:
{{
  "suggested_deck_title": "Descriptive Topic Title",
  "summary": "Brief 1-2 sentence overview of the study material",
  "cards": [
    {{
      "front": "Question / Recall Prompt",
      "back": "Accurate Answer",
      "page_reference": "Page X",
      "tags": ["tag1", "tag2"],
      "difficulty": "easy" | "medium" | "hard"
    }}
  ]
}}"""

    user_prompt = f"""Retrieved Knowledge Context:
{combined_context}

Desired Deck Title Hint: {deck_title_hint or "Auto-detect"}
Please generate {card_count} high-yield flashcards in JSON format."""

    try:
        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"Error calling LLM for vector RAG flashcard generation: {str(e)}")
        raise
