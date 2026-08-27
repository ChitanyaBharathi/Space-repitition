import pytest
from app.core.sm2 import calculate_sm2

def test_sm2_again_rating():
    ef, interval, reps, state, due_dt = calculate_sm2(rating=1, current_ease_factor=2.5, current_interval=10, current_reps=3)
    assert ef == 2.18
    assert reps == 0
    assert interval == 1
    assert state == "relearning"

def test_sm2_good_rating_first_rep():
    ef, interval, reps, state, due_dt = calculate_sm2(rating=3, current_ease_factor=2.5, current_interval=0, current_reps=0)
    assert reps == 1
    assert interval == 1
    assert state == "review"

def test_sm2_easy_rating_scaling():
    ef, interval, reps, state, due_dt = calculate_sm2(rating=4, current_ease_factor=2.5, current_interval=6, current_reps=2)
    assert ef == 2.6  # 2.5 + 0.1
    assert reps == 3
    assert interval == 16  # ceil(6 * 2.6) = 16
    assert state == "review"
