from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.db.supabase import SupabaseService
from app.schemas.schemas import CardCreate, CardUpdate, CardResponse, BulkImportRequest

router = APIRouter()

@router.get("/deck/{deck_id}", response_model=List[CardResponse])
async def list_cards_in_deck(deck_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    cards = await db.get("cards", params={"deck_id": f"eq.{deck_id}", "order": "created_at.desc"})
    return cards

@router.post("", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
async def create_card(card_in: CardCreate, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    # Verify deck ownership
    decks = await db.get("decks", params={"id": f"eq.{card_in.deck_id}"})
    if not decks:
        raise HTTPException(status_code=404, detail="Deck not found")

    data = {
        "deck_id": card_in.deck_id,
        "user_id": user["user_id"],
        "front_content": card_in.front_content,
        "back_content": card_in.back_content,
        "tags": card_in.tags or [],
        "ease_factor": 2.5,
        "interval_days": 0,
        "repetition_count": 0,
        "state": "new"
    }
    created = await db.post("cards", data)
    if not created:
        raise HTTPException(status_code=500, detail="Failed to create card")
    return created[0]

@router.put("/{card_id}", response_model=CardResponse)
async def update_card(card_id: str, card_in: CardUpdate, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    update_data = {k: v for k, v in card_in.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    updated = await db.patch("cards", params={"id": f"eq.{card_id}"}, data=update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Card not found or update failed")
    return updated[0]

@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_card(card_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    await db.delete("cards", params={"id": f"eq.{card_id}"})
    return None

@router.post("/import", response_model=List[CardResponse], status_code=status.HTTP_201_CREATED)
async def bulk_import_cards(payload: BulkImportRequest, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    decks = await db.get("decks", params={"id": f"eq.{payload.deck_id}"})
    if not decks:
        raise HTTPException(status_code=404, detail="Deck not found")

    items = []
    for c in payload.cards:
        items.append({
            "deck_id": payload.deck_id,
            "user_id": user["user_id"],
            "front_content": c.front_content,
            "back_content": c.back_content,
            "tags": c.tags or [],
            "ease_factor": 2.5,
            "interval_days": 0,
            "repetition_count": 0,
            "state": "new"
        })

    if not items:
        return []

    created = await db.post("cards", items)
    return created
