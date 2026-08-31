from fastapi import APIRouter
from app.api.v1.endpoints import decks, cards, queue, reviews, profile, analytics, ai

api_router = APIRouter()
api_router.include_router(decks.router, prefix="/decks", tags=["decks"])
api_router.include_router(cards.router, prefix="/cards", tags=["cards"])
api_router.include_router(queue.router, prefix="/queue", tags=["queue"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])

