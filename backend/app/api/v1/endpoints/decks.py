from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.db.supabase import SupabaseService
from app.schemas.schemas import DeckCreate, DeckUpdate, DeckResponse
from datetime import datetime, timezone

router = APIRouter()

@router.get("", response_model=List[DeckResponse])
async def list_decks(user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    decks = await db.get("decks", params={"order": "created_at.desc"})
    cards = await db.get("cards", params={"select": "id,deck_id,due_date"})

    now_iso = datetime.now(timezone.utc).isoformat()

    # Map cards to decks
    result = []
    for deck in decks:
        deck_cards = [c for c in cards if c.get("deck_id") == deck["id"]]
        due_cards = [c for c in deck_cards if c.get("due_date") and c["due_date"] <= now_iso]
        result.append({
            **deck,
            "due_card_count": len(due_cards),
            "total_card_count": len(deck_cards)
        })
    return result

@router.post("", response_model=DeckResponse, status_code=status.HTTP_201_CREATED)
async def create_deck(deck_in: DeckCreate, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    data = {
        "user_id": user["user_id"],
        "title": deck_in.title,
        "description": deck_in.description,
    }
    created = await db.post("decks", data)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create deck")
    return {**created[0], "due_card_count": 0, "total_card_count": 0}

@router.get("/{deck_id}", response_model=DeckResponse)
async def get_deck(deck_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    decks = await db.get("decks", params={"id": f"eq.{deck_id}"})
    if not decks:
        raise HTTPException(status_code=404, detail="Deck not found")
    deck = decks[0]

    cards = await db.get("cards", params={"deck_id": f"eq.{deck_id}"})
    now_iso = datetime.now(timezone.utc).isoformat()
    due_cards = [c for c in cards if c.get("due_date") and c["due_date"] <= now_iso]

    return {
        **deck,
        "due_card_count": len(due_cards),
        "total_card_count": len(cards)
    }

@router.put("/{deck_id}", response_model=DeckResponse)
async def update_deck(deck_id: str, deck_in: DeckUpdate, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    update_data = {k: v for k, v in deck_in.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    updated = await db.patch("decks", params={"id": f"eq.{deck_id}"}, data=update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Deck not found or update failed")

    cards = await db.get("cards", params={"deck_id": f"eq.{deck_id}"})
    now_iso = datetime.now(timezone.utc).isoformat()
    due_cards = [c for c in cards if c.get("due_date") and c["due_date"] <= now_iso]

    return {
        **updated[0],
        "due_card_count": len(due_cards),
        "total_card_count": len(cards)
    }

@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deck(deck_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    await db.delete("decks", params={"id": f"eq.{deck_id}"})
    return None
