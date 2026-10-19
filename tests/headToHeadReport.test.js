import { describe, expect, it } from 'vitest';
import {
  createHeadToHeadReport,
  getPlayedAgainstTeams,
} from '../src/utils/headToHeadReport';

const makeGame = (id, date, homeTeam, awayTeam, shots, status = 'completed') => ({
  id,
  date,
  homeTeam,
  awayTeam,
  status,
  periods: [{ number: 1, shots }],
});

describe('createHeadToHeadReport', () => {
  it('only offers configured teams with a saved matchup against the selected team', () => {
    const games = [
      makeGame('one', '2026-01-01', 'Hawks', 'Eagles', []),
      makeGame('two', '2026-01-02', 'Wolves', 'Hawks', [], 'in_progress'),
      makeGame('three', '2026-01-03', 'Eagles', 'Tigers', []),
    ];

    expect(getPlayedAgainstTeams(
      ['Hawks', 'Eagles', 'Wolves', 'Tigers', 'Bears'],
      games,
      'Hawks'
    )).toEqual(['Eagles', 'Wolves']);
    expect(getPlayedAgainstTeams(['Hawks', 'Eagles'], games, '')).toEqual([]);
  });

  it('aggregates completed games and normalizes reversed home-away sides', () => {
    const games = [
      makeGame('in-progress', '2026-01-03T12:00:00.000Z', 'Eagles', 'Hawks', [
        { id: 'g', team: 'home', result: 'goal', x: 0.5 },
      ], 'in_progress'),
      makeGame('game-2', '2026-01-02T12:00:00.000Z', 'Hawks', 'Eagles', [
        { id: 'd', team: 'home', result: 'goal', x: 0.25 },
        { id: 'e', team: 'home', result: 'goal', x: 0.3 },
        { id: 'f', team: 'away', result: 'goal', x: 0.8 },
      ]),
      makeGame('game-1', '2026-01-01T12:00:00.000Z', 'Eagles', 'Hawks', [
        { id: 'a', team: 'home', result: 'goal', x: 0.8 },
        { id: 'b', team: 'home', result: 'goal', x: 0.7 },
        { id: 'c', team: 'away', result: 'goal', x: 0.2 },
      ]),
    ];

    const report = createHeadToHeadReport(games, 'Eagles', 'Hawks');

    expect(report.totalGames).toBe(2);
    expect(report.includedGames).toBe(3);
    expect(report.firstDate).toBe('2026-01-01T12:00:00.000Z');
    expect(report.lastDate).toBe('2026-01-03T12:00:00.000Z');
    expect(report.homeWins).toBe(1);
    expect(report.awayWins).toBe(1);
    expect(report.ties).toBe(0);
    expect(report.gameMomentum.map(({ homeWins, awayWins }) => [homeWins, awayWins]))
      .toEqual([[1, 0], [1, 1]]);
    expect(report.game.periods).toHaveLength(1);
    expect(report.game.periods[0].shots).toHaveLength(7);
    expect(report.game.periods[0].shots[3]).toMatchObject({
      team: 'away',
      x: 0.75,
    });
    expect(report.game.periods[0].shots[5].team).toBe('home');
    expect(report.game.periods[0].shots[5].x).toBeCloseTo(0.2);
    expect(report.game.periods[0].shots[6].team).toBe('home');
  });

  it('mirrors right-goal games into the left-goal frame in every period', () => {
    const leftStartGame = {
      id: 'left-start',
      date: '2026-01-01T12:00:00.000Z',
      homeTeam: 'Hawks',
      awayTeam: 'Eagles',
      homeStartSide: 'left',
      status: 'completed',
      periods: [
        { number: 1, shots: [{ id: 'p1', team: 'home', result: null, x: 0.2 }] },
        { number: 2, shots: [{ id: 'p2', team: 'home', result: null, x: 0.2 }] },
      ],
    };
    const rightStartGame = {
      id: 'right-start',
      date: '2026-01-02T12:00:00.000Z',
      homeTeam: 'Hawks',
      awayTeam: 'Eagles',
      homeStartSide: 'right',
      status: 'completed',
      periods: [
        { number: 1, shots: [{ id: 'p1', team: 'home', result: null, x: 0.2 }] },
        { number: 2, shots: [{ id: 'p2', team: 'home', result: null, x: 0.2 }] },
      ],
    };

    const report = createHeadToHeadReport([leftStartGame, rightStartGame], 'Hawks', 'Eagles');
    const [p1, p2] = report.game.periods;

    expect(p1.shots).toHaveLength(2);
    expect(p1.shots[0].x).toBeCloseTo(0.2);
    expect(p1.shots[1].x).toBeCloseTo(0.8);
    expect(p2.shots).toHaveLength(2);
    expect(p2.shots[0].x).toBeCloseTo(0.2);
    expect(p2.shots[1].x).toBeCloseTo(0.8);
    expect(report.game.homeStartSide).toBe('left');
  });
});
