import pytest
from app.services.ai_service import recursive_split_text, build_semantic_sections

def test_recursive_split_text():
    short_text = "This is a brief concept about heart valves and aortic regurgitation."
    chunks = recursive_split_text(short_text, chunk_size=200)
    assert len(chunks) == 1
    assert chunks[0] == short_text

def test_recursive_split_multiline():
    paragraphs = "\n\n".join([f"Paragraph {i}: " + ("Important notes. " * 10) for i in range(5)])
    chunks = recursive_split_text(paragraphs, chunk_size=300)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c) > 0

def test_build_semantic_sections():
    pages_data = [
        {"page": 1, "text": "Page 1: Heart anatomy and cardiac cycle overview.\n\nLeft ventricle dynamics."},
        {"page": 2, "text": "Page 2: Electrical conduction system. SA node and AV node action potentials."}
    ]
    sections = build_semantic_sections(pages_data, chunk_size=300)
    assert len(sections) >= 2
    assert sections[0]["page_number"] == 1
    assert "page_number" in sections[-1]
    assert sections[-1]["page_number"] == 2
