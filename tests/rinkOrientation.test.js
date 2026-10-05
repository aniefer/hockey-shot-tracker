import { describe, expect, it } from 'vitest';
import { isRinkFlipped, normalizeFullGameShots } from '../src/utils/rinkOrientation';

describe('full-game rink orientation', () => {
  it('normalizes second-period shots and leaves other periods unchanged', () => {
    const periods = ['P1', 2, 3, 'OT'].map((number) => ({
      number,
      shots: [{ id: String(number), x: 0.2, team: 'home' }],
    }));

    expect(normalizeFullGameShots(periods).map((shot) => shot.x))
      .toEqual([0.2, 0.8, 0.2, 0.2]);
    expect(periods[1].shots[0].x).toBe(0.2);
  });

  it('matches the tracked rink flip for period 2 only', () => {
    expect(isRinkFlipped(2)).toBe(true);
    expect(isRinkFlipped('OT')).toBe(false);
  });
});
