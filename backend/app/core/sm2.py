import math
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple

def calculate_sm2(
    rating: int,
    current_ease_factor: float = 2.5,
    current_interval: int = 0,
    current_reps: int = 0
) -> Tuple[float, int, int, str, datetime]:
    """
    Computes updated SM-2 parameters based on PRD Section 7.
    Returns: (new_ease_factor, new_interval, new_reps, new_state, new_due_date)
    """
    # Ensure rating is between 1 and 4
    q = max(1, min(4, rating))

    # 1. Calculate new Ease Factor (EF')
    # EF' = max(1.3, EF + (0.1 - (4 - q) * (0.08 + (4 - q) * 0.02)))
    ef_delta = 0.1 - (4 - q) * (0.08 + (4 - q) * 0.02)
    new_ef = round(max(1.3, current_ease_factor + ef_delta), 3)

    if q < 3:
        # Failed recall ("Again" / rating 1) or Hard fumble (rating 2)
        new_reps = 0
        new_interval = 1
        new_state = "relearning"
    else:
        # Successful recall ("Good" / 3, "Easy" / 4)
        new_reps = current_reps + 1
        if new_reps == 1:
            new_interval = 1
        elif new_reps == 2:
            new_interval = 6
        else:
            new_interval = math.ceil(max(1, current_interval) * new_ef)
        new_state = "review"

    # Calculate due date
    new_due_date = datetime.now(timezone.utc) + timedelta(days=new_interval)

    return new_ef, new_interval, new_reps, new_state, new_due_date
