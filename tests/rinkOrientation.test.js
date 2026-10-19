import { describe, expect, it } from 'vitest';
import {
  getHomeStartSide,
  isRinkFlipped,
  normalizeFullGameShots,
} from '../src/utils/rinkOrientation';

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

  it('flips periods 1, 3, and OT when the home goal is on the right', () => {
    expect(isRinkFlipped(1, 'right')).toBe(true);
    expect(isRinkFlipped(2, 'right')).toBe(false);
    expect(isRinkFlipped(3, 'right')).toBe(true);
    expect(isRinkFlipped('OT', 'right')).toBe(true);
    expect(isRinkFlipped(1, 'left')).toBe(false);
    expect(isRinkFlipped(2, 'left')).toBe(true);
  });

  it('normalizes right-goal games so home attacks right in every period', () => {
    const periods = [1, 2].map((number) => ({
      number,
      shots: [{ id: String(number), x: 0.2, team: 'home' }],
    }));

    expect(normalizeFullGameShots(periods, 'right').map((shot) => shot.x))
      .toEqual([0.8, 0.2]);
  });

  it('defaults missing or unknown start sides to the left', () => {
    expect(getHomeStartSide({})).toBe('left');
    expect(getHomeStartSide({ homeStartSide: 'left' })).toBe('left');
    expect(getHomeStartSide({ homeStartSide: 'right' })).toBe('right');
    expect(getHomeStartSide({ homeStartSide: 'middle' })).toBe('left');
  });
});
