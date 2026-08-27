from typing import Dict, Any
from datetime import datetime, timedelta, timezone, date
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.db.supabase import SupabaseService
from app.schemas.schemas import AnalyticsResponse

router = APIRouter()

@router.get("", response_model=AnalyticsResponse)
async def get_analytics(user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    user_id = user["user_id"]

    cards = await db.get("cards")
    logs = await db.get("review_logs", params={"order": "reviewed_at.desc"})
    profiles = await db.get("player_profiles", params={"user_id": f"eq.{user_id}"})

    streak_count = profiles[0].get("streak_count", 0) if profiles else 0

    # Card statistics
    mastered = [c for c in cards if c.get("interval_days", 0) > 21]
    learning = [c for c in cards if 0 < c.get("interval_days", 0) <= 21 or c.get("state") in ("learning", "relearning")]
    new_cards = [c for c in cards if c.get("state") == "new" or c.get("interval_days", 0) == 0]

    # Retention rate (percentage of non-1 ratings over last 30 days)
    now_utc = datetime.now(timezone.utc)
    thirty_days_ago = now_utc - timedelta(days=30)
    recent_logs = []
    for log in logs:
        rev_str = log.get("reviewed_at")
        if rev_str:
            if rev_str.endswith("Z"):
                rev_str = rev_str[:-1] + "+00:00"
            try:
                dt = datetime.fromisoformat(rev_str)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                if dt >= thirty_days_ago:
                    recent_logs.append(log)
            except Exception:
                pass

    if recent_logs:
        successful_recalls = sum(1 for l in recent_logs if l.get("rating", 1) >= 2)
        retention_rate = round((successful_recalls / len(recent_logs)) * 100, 1)
    else:
        retention_rate = 100.0

    # Forecast curve over next 7 days
    forecast = []
    today = date.today()
    for i in range(7):
        target_day = today + timedelta(days=i)
        day_start = datetime(target_day.year, target_day.month, target_day.day, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        count = 0
        for c in cards:
            due_str = c.get("due_date")
            if due_str:
                if due_str.endswith("Z"):
                    due_str = due_str[:-1] + "+00:00"
                try:
                    dt = datetime.fromisoformat(due_str)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    if day_start <= dt < day_end:
                        count += 1
                except Exception:
                    pass
        forecast.append({
            "date": target_day.strftime("%Y-%m-%d"),
            "day": target_day.strftime("%a"),
            "due_count": count
        })

    return {
        "retention_rate_pct": retention_rate,
        "streak_count": streak_count,
        "total_cards_mastered": len(mastered),
        "total_cards_learning": len(learning),
        "total_cards_new": len(new_cards),
        "forecast_next_7_days": forecast,
    }
