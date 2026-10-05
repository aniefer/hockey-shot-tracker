import { describe, expect, it } from 'vitest';
import { getShotCounts, getShotOutcomeCounts } from '../src/utils/shotStats';

describe('getShotCounts', () => {
  it('counts scoring chances by team without excluding them from total shots', () => {
    const shots = [
      { team: 'home', result: 'scoring_chance' },
      { team: 'home', result: 'goal' },
      { team: 'away', result: 'scoring_chance' },
      { team: 'away', result: 'blocked' },
      { team: null, result: 'scoring_chance' },
    ];

    expect(getShotCounts(shots)).toEqual({
      home: 2,
      away: 2,
      total: 5,
      homeScoringChances: 1,
      awayScoringChances: 1,
    });
  });

  describe('getShotOutcomeCounts', () => {
    it('returns zero counts when a team has no shots', () => {
      expect(getShotOutcomeCounts([])).toEqual({
        goals: 0,
        blocked: 0,
        scoringChances: 0,
        regularShots: 0,
      });
    });

    it('splits shots into goals, blocked shots, scoring chances, and regular shots', () => {
      const shots = [
        { result: 'goal' },
        { result: 'blocked' },
        { result: 'scoring_chance' },
        { result: null },
      ];

      const outcomeCounts = getShotOutcomeCounts(shots);

      expect(outcomeCounts).toEqual({
        goals: 1,
        blocked: 1,
        scoringChances: 1,
        regularShots: 1,
      });
      expect(Object.values(outcomeCounts).reduce((total, count) => total + count, 0)).toBe(shots.length);
    });

    it('reclassifies disabled outcome tracking as regular shots', () => {
      const shots = [
        { result: 'blocked' },
        { result: 'scoring_chance' },
        { result: null },
      ];

      expect(getShotOutcomeCounts(shots, {
        trackBlockedShots: false,
        trackScoringChances: false,
      })).toEqual({
        goals: 0,
        blocked: 0,
        scoringChances: 0,
        regularShots: 3,
      });
    });
  });
});
