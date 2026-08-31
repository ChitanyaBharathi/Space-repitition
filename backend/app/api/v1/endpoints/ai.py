from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
from app.services.ai_service import (
    extract_text_and_pages_from_pdf,
    build_semantic_sections,
    generate_dense_embeddings,
    generate_query_embedding,
    generate_flashcards_from_vector_contexts,
    recursive_split_text
)
from app.db.supabase import SupabaseService
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

class GeneratedCard(BaseModel):
    front: str
    back: str
    page_reference: Optional[str] = "N/A"
    tags: List[str] = Field(default_factory=list)
    difficulty: Optional[str] = "medium"

class GenerateDeckResponse(BaseModel):
    document_id: Optional[str] = None
    suggested_deck_title: str
    summary: str
    total_generated: int
    total_embedded_chunks: int
    cards: List[GeneratedCard]

class TextGenerationRequest(BaseModel):
    notes_text: str
    card_count: int = Field(default=10, ge=1, le=50)
    focus_mode: str = "high_yield"
    deck_title: Optional[str] = None

class DocumentSearchRequest(BaseModel):
    query: str
    document_id: Optional[str] = None
    match_count: int = 5

def get_auth_token(authorization: Optional[str] = Header(None)) -> str:
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ")[1]
    # Fallback to anon key if unauthenticated guest
    return settings.SUPABASE_ANON_KEY

@router.post("/generate-from-pdf", response_model=GenerateDeckResponse)
async def generate_from_pdf(
    file: UploadFile = File(...),
    card_count: int = Form(10),
    focus_mode: str = Form("high_yield"),
    deck_title: Optional[str] = Form(None),
    token: str = Depends(get_auth_token)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported for document deck generation."
        )

    try:
        pdf_bytes = await file.read()
        if len(pdf_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF file is empty."
            )

        # 1. Extract text and page numbers
        pages_data = extract_text_and_pages_from_pdf(pdf_bytes)
        if not pages_data:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract text from the PDF. It may be scanned or image-only."
            )

        # 2. Semantic recursive chunking
        sections = build_semantic_sections(pages_data, chunk_size=700)
        if not sections:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Document contains no readable text content."
            )

        # Clean sections of any null characters
        for sec in sections:
            sec["content"] = sec["content"].replace('\x00', '').replace('\u0000', '')

        # 3. Dense Vector Embeddings Generation (1536-dim vectors)
        texts_to_embed = [sec["content"] for sec in sections]
        embeddings = await generate_dense_embeddings(texts_to_embed)

        # 4. Ingest into Supabase Vector Store (documents & document_sections)
        db = SupabaseService(token)
        clean_title = (deck_title or file.filename.replace(".pdf", "")).replace('\x00', '').replace('\u0000', '')
        doc_record = await db.post("documents", {
            "title": clean_title,
            "total_pages": len(pages_data)
        })
        document_id = doc_record[0]["id"] if doc_record else None

        # Insert chunks + embeddings in batches
        insert_payload = []
        for i, sec in enumerate(sections):
            insert_payload.append({
                "document_id": document_id,
                "content": sec["content"],
                "page_number": sec["page_number"],
                "chunk_index": sec["chunk_index"],
                "embedding": embeddings[i]
            })

        if insert_payload:
            # Batch inserts to Supabase
            batch_size = 50
            for b_idx in range(0, len(insert_payload), batch_size):
                await db.post("document_sections", insert_payload[b_idx:b_idx + batch_size])

        # 5. Vector Retrieval / Semantic Sampling across document
        # Multi-query semantic probes to gather representative high-yield chunks
        queries = [
            f"key core concepts, definitions, and principles in {deck_title or file.filename}",
            "fundamental mechanisms, formulas, criteria, and classifications",
            "important rules, edge cases, clinical diagnosis or problem solving"
        ]

        retrieved_sections = []
        seen_chunks = set()

        for q in queries:
            q_emb = await generate_query_embedding(q)
            matches = await db.rpc("match_document_sections", {
                "query_embedding": q_emb,
                "match_threshold": 0.1,
                "match_count": 8,
                "filter_document_id": document_id
            })
            for m in (matches or []):
                if m["id"] not in seen_chunks:
                    seen_chunks.add(m["id"])
                    retrieved_sections.append(m)

        # Fallback if few query matches: include representative sections
        if len(retrieved_sections) < 5:
            retrieved_sections = sections[:15]

        # 6. Generate Flashcards Augmented with Retrieved Vector Chunks
        result = await generate_flashcards_from_vector_contexts(
            retrieved_sections=retrieved_sections,
            card_count=min(max(card_count, 1), 50),
            focus_mode=focus_mode,
            deck_title_hint=deck_title or file.filename.replace(".pdf", "")
        )

        cards = [
            GeneratedCard(
                front=c.get("front", ""),
                back=c.get("back", ""),
                page_reference=c.get("page_reference", "N/A"),
                tags=c.get("tags", []),
                difficulty=c.get("difficulty", "medium")
            )
            for c in result.get("cards", [])
        ]

        return GenerateDeckResponse(
            document_id=document_id,
            suggested_deck_title=result.get("suggested_deck_title") or deck_title or "Generated Study Deck",
            summary=result.get("summary") or "Synthesized from vector-embedded study document.",
            total_generated=len(cards),
            total_embedded_chunks=len(sections),
            cards=cards
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vector RAG generation failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector RAG generation failed: {str(e)}"
        )

@router.post("/generate-from-text", response_model=GenerateDeckResponse)
async def generate_from_text(
    payload: TextGenerationRequest,
    token: str = Depends(get_auth_token)
):
    if not payload.notes_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notes text cannot be empty."
        )

    try:
        # 1. Recursive chunking
        raw_chunks = recursive_split_text(payload.notes_text, chunk_size=700)
        sections = [
            {"page_number": 1, "chunk_index": idx, "content": c}
            for idx, c in enumerate(raw_chunks)
        ]

        # 2. Vector Embedding & DB Storage
        embeddings = await generate_dense_embeddings([s["content"] for s in sections])
        db = SupabaseService(token)
        doc_record = await db.post("documents", {
            "title": payload.deck_title or "Study Notes",
            "total_pages": 1
        })
        document_id = doc_record[0]["id"] if doc_record else None

        insert_payload = [
            {
                "document_id": document_id,
                "content": sec["content"],
                "page_number": 1,
                "chunk_index": sec["chunk_index"],
                "embedding": embeddings[idx]
            }
            for idx, sec in enumerate(sections)
        ]
        if insert_payload:
            await db.post("document_sections", insert_payload)

        # 3. Vector Generation
        result = await generate_flashcards_from_vector_contexts(
            retrieved_sections=sections,
            card_count=payload.card_count,
            focus_mode=payload.focus_mode,
            deck_title_hint=payload.deck_title
        )

        cards = [
            GeneratedCard(
                front=c.get("front", ""),
                back=c.get("back", ""),
                page_reference=c.get("page_reference", "Page 1"),
                tags=c.get("tags", []),
                difficulty=c.get("difficulty", "medium")
            )
            for c in result.get("cards", [])
        ]

        return GenerateDeckResponse(
            document_id=document_id,
            suggested_deck_title=result.get("suggested_deck_title") or payload.deck_title or "Study Notes Deck",
            summary=result.get("summary") or "Synthesized from vector-embedded notes.",
            total_generated=len(cards),
            total_embedded_chunks=len(sections),
            cards=cards
        )
    except Exception as e:
        logger.error(f"Text Vector RAG failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector RAG generation failed: {str(e)}"
        )

@router.post("/search-sections")
async def search_sections(
    payload: DocumentSearchRequest,
    token: str = Depends(get_auth_token)
):
    """
    Direct Semantic Vector Search across stored documents.
    """
    try:
        q_emb = await generate_query_embedding(payload.query)
        db = SupabaseService(token)
        matches = await db.rpc("match_document_sections", {
            "query_embedding": q_emb,
            "match_threshold": 0.2,
            "match_count": payload.match_count,
            "filter_document_id": payload.document_id
        })
        return {"query": payload.query, "results": matches or []}
    except Exception as e:
        logger.error(f"Semantic search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
