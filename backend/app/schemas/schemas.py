from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# Deck Schemas
class DeckCreate(BaseModel):
    title: str = Field(..., max_length=128, min_length=1)
    description: Optional[str] = None

class DeckUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=128, min_length=1)
    description: Optional[str] = None

class DeckResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    created_at: str
    updated_at: str
    due_card_count: Optional[int] = 0
    total_card_count: Optional[int] = 0

# Card Schemas
class CardCreate(BaseModel):
    deck_id: Optional[str] = None
    front_content: str = Field(..., min_length=1)
    back_content: str = Field(..., min_length=1)
    tags: Optional[List[str]] = []

class CardUpdate(BaseModel):
    front_content: Optional[str] = None
    back_content: Optional[str] = None
    tags: Optional[List[str]] = None

class CardResponse(BaseModel):
    id: str
    deck_id: str
    user_id: str
    front_content: str
    back_content: str
    ease_factor: float
    interval_days: int
    repetition_count: int
    due_date: str
    state: str
    tags: List[str] = []
    created_at: str

class BulkImportRequest(BaseModel):
    deck_id: str
    cards: List[CardCreate]


# Review Schemas
class SingleReviewSubmission(BaseModel):
    card_id: str
    rating: int = Field(..., ge=1, le=4)  # 1: Again, 2: Hard, 3: Good, 4: Easy
    review_duration_ms: int = Field(0, ge=0)

class BatchReviewRequest(BaseModel):
    reviews: List[SingleReviewSubmission]

class ReviewLogResponse(BaseModel):
    id: str
    card_id: str
    user_id: str
    rating: int
    review_duration_ms: int
    scheduled_interval: int
    reviewed_at: str

# Profile & Inventory Schemas
class InventoryItem(BaseModel):
    id: str
    name: str
    type: str  # 'shield', 'potion', 'relic'
    description: str
    quantity: int = 1

class ProfileUpdate(BaseModel):
    level: Optional[int] = None
    experience: Optional[int] = None
    max_hp: Optional[int] = None
    current_hp: Optional[int] = None
    gold: Optional[int] = None
    inventory: Optional[List[Dict[str, Any]]] = None
    streak_count: Optional[int] = None

class ProfileResponse(BaseModel):
    user_id: str
    level: int
    experience: int
    max_hp: int
    current_hp: int
    gold: int
    inventory: List[Dict[str, Any]]
    streak_count: int
    last_active_date: Optional[str] = None
    updated_at: str

# Analytics Schemas
class AnalyticsResponse(BaseModel):
    retention_rate_pct: float
    streak_count: int
    total_cards_mastered: int
    total_cards_learning: int
    total_cards_new: int
    forecast_next_7_days: List[Dict[str, Any]]
