from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.db.supabase import SupabaseService
from app.schemas.schemas import ProfileResponse, ProfileUpdate

router = APIRouter()

@router.get("", response_model=ProfileResponse)
async def get_profile(user: Dict[str, Any] = Depends(get_current_user)):
    db = SupabaseService(user["token"])
    user_id = user["user_id"]
    profiles = await db.get("player_profiles", params={"user_id": f"eq.{user_id}"})
    if not profiles:
        # Create default profile
        new_prof = {
            "user_id": user_id,
            "level": 1,
            "experience": 0,
            "max_hp": 100,
            "current_hp": 100,
            "gold": 0,
            "inventory": [],
            "streak_count": 0,
        }
        created = await db.post("player_profiles", new_prof)
        return created[0]
    return profiles[0]

@router.put("", response_model=ProfileResponse)
async def update_profile(
    profile_in: ProfileUpdate,
    user: Dict[str, Any] = Depends(get_current_user)
):
    db = SupabaseService(user["token"])
    user_id = user["user_id"]
    update_data = {k: v for k, v in profile_in.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated = await db.patch("player_profiles", params={"user_id": f"eq.{user_id}"}, data=update_data)
    if not updated:
        # If profile doesn't exist, create it
        update_data["user_id"] = user_id
        created = await db.post("player_profiles", update_data)
        return created[0]
    return updated[0]
