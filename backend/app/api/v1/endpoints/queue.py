from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.db.supabase import SupabaseService
from app.schemas.schemas import CardResponse

router = APIRouter()

STATE_PRIORITY = {
    "relearning": 1,
    "review": 2,
    "learning": 3,
    "new": 4,
}

def sort_queue_cards(cards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    now_utc = datetime.now(timezone.utc)

    def sort_key(card: Dict[str, Any]):
        state = card.get("state", "new")
        priority = STATE_PRIORITY.get(state, 5)
        due_str = card.get("due_date")
        if due_str:
            try:
                # Replace 'Z' with '+00:00' if needed
                if due_str.endswith("Z"):
                    due_str = due_str[:-1] + "+00:00"
                due_dt = datetime.fromisoformat(due_str)
                if due_dt.tzinfo is None:
                    due_dt = due_dt.replace(tzinfo=timezone.utc)
                overdue_seconds = (now_utc - due_dt).total_seconds()
            except Exception:
                overdue_seconds = 0
        else:
            overdue_seconds = 0

        # We want highest overdue seconds first, so -overdue_seconds
        return (priority, -overdue_seconds, card.get("id", ""))

    return sorted(cards, key=sort_key)

@router.get("/deck/{deck_id}", response_model=List[CardResponse])
async def get_deck_queue(deck_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    now_iso = datetime.now(timezone.utc).isoformat()
    # Fetch due cards
    cards = await db.get("cards", params={"deck_id": f"eq.{deck_id}", "due_date": f"lte.{now_iso}"})
    return sort_queue_cards(cards)

@router.get("/all", response_model=List[CardResponse])
async def get_all_queue(user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    now_iso = datetime.now(timezone.utc).isoformat()
    cards = await db.get("cards", params={"due_date": f"lte.{now_iso}"})
    return sort_queue_cards(cards)
