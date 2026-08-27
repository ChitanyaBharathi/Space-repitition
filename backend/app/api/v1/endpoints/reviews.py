from typing import List, Dict, Any
from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.core.sm2 import calculate_sm2
from app.db.supabase import SupabaseService
from app.schemas.schemas import BatchReviewRequest, ReviewLogResponse

router = APIRouter()

@router.post("", response_model=List[ReviewLogResponse], status_code=status.HTTP_201_CREATED)
async def submit_batch_reviews(
    payload: BatchReviewRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    db = SupabaseService(user["token"])
    if not payload.reviews:
        return []

    created_logs = []
    user_id = user["user_id"]

    for item in payload.reviews:
        cards = await db.get("cards", params={"id": f"eq.{item.card_id}"})
        if not cards:
            continue
        card = cards[0]

        # Calculate new SM-2 parameters
        new_ef, new_interval, new_reps, new_state, new_due_dt = calculate_sm2(
            rating=item.rating,
            current_ease_factor=card.get("ease_factor", 2.5),
            current_interval=card.get("interval_days", 0),
            current_reps=card.get("repetition_count", 0)
        )

        # Update card in database
        card_update = {
            "ease_factor": new_ef,
            "interval_days": new_interval,
            "repetition_count": new_reps,
            "state": new_state,
            "due_date": new_due_dt.isoformat(),
        }
        await db.patch("cards", params={"id": f"eq.{item.card_id}"}, data=card_update)

        # Insert review log
        log_data = {
            "card_id": item.card_id,
            "user_id": user_id,
            "rating": item.rating,
            "review_duration_ms": item.review_duration_ms,
            "scheduled_interval": new_interval,
        }
        inserted = await db.post("review_logs", log_data)
        if inserted:
            created_logs.append(inserted[0])

    # Update streak & player profile stats
    profiles = await db.get("player_profiles", params={"user_id": f"eq.{user_id}"})
    today_str = date.today().isoformat()
    if not profiles:
        # Create profile
        await db.post("player_profiles", {
            "user_id": user_id,
            "level": 1,
            "experience": 10 * len(payload.reviews),
            "max_hp": 100,
            "current_hp": 100,
            "gold": 5 * len(payload.reviews),
            "inventory": [],
            "streak_count": 1,
            "last_active_date": today_str
        })
    else:
        prof = profiles[0]
        last_date = prof.get("last_active_date")
        streak = prof.get("streak_count", 1)
        if last_date != today_str:
            # Increment streak
            streak += 1
        xp_gain = 10 * len(payload.reviews)
        gold_gain = 5 * len(payload.reviews)
        new_xp = prof.get("experience", 0) + xp_gain
        new_level = prof.get("level", 1) + (new_xp // 100)
        await db.patch("player_profiles", params={"user_id": f"eq.{user_id}"}, data={
            "experience": new_xp,
            "level": new_level,
            "gold": prof.get("gold", 0) + gold_gain,
            "streak_count": streak,
            "last_active_date": today_str
        })

    return created_logs
