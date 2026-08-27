import { describe, it, expect } from 'vitest';

function calculateClientSM2(rating: number, currentEf = 2.5, currentReps = 0, currentInterval = 0) {
  const q = Math.max(1, Math.min(4, rating));
  const efDelta = 0.1 - (4 - q) * (0.08 + (4 - q) * 0.02);
  const newEf = Math.round(Math.max(1.3, currentEf + efDelta) * 1000) / 1000;

  if (q < 3) {
    return { easeFactor: newEf, interval: 1, reps: 0, state: 'relearning' };
  } else {
    const reps = currentReps + 1;
    let interval = 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.ceil(currentInterval * newEf);
    return { easeFactor: newEf, interval, reps, state: 'review' };
  }
}

describe('Client SM-2 Math Validation', () => {
  it('correctly handles Again rating (1)', () => {
    const res = calculateClientSM2(1, 2.5, 3, 10);
    expect(res.easeFactor).toBe(2.18);
    expect(res.reps).toBe(0);
    expect(res.interval).toBe(1);
    expect(res.state).toBe('relearning');
  });

  it('correctly handles Good rating (3) for first repetition', () => {
    const res = calculateClientSM2(3, 2.5, 0, 0);
    expect(res.reps).toBe(1);
    expect(res.interval).toBe(1);
    expect(res.state).toBe('review');
  });

  it('correctly scales interval for Easy rating (4)', () => {
    const res = calculateClientSM2(4, 2.5, 2, 6);
    expect(res.easeFactor).toBe(2.6);
    expect(res.reps).toBe(3);
    expect(res.interval).toBe(16);
    expect(res.state).toBe('review');
  });
});
