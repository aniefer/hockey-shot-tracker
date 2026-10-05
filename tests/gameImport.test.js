import { describe, expect, it, vi } from 'vitest';
import { createBackup } from '../src/utils/dataTransfer';
import {
  alignGameTeams,
  findImportConflicts,
  mergeImportedGames,
} from '../src/utils/gameImport';

const makeGame = (overrides = {}) => ({
  id: 'game-1',
  date: '2026-10-05T17:00:00.000Z',
  homeTeam: 'Hawks',
  awayTeam: 'Wolves',
  periods: [{ number: 1, shots: [] }],
  status: 'completed',
  ...overrides,
});

describe('game data import/export', () => {
  it('includes game teams in a backup', () => {
    const backup = createBackup([makeGame()], ['Falcons']);

    expect(backup).toMatchObject({
      format: 'hockey-shot-tracker',
      version: 1,
      teams: ['Falcons', 'Hawks', 'Wolves'],
      games: [makeGame()],
    });
  });

  it('ignores matching games with identical data even when IDs differ', () => {
    const result = mergeImportedGames(
      [makeGame()],
      [makeGame({ id: 'imported-id' })],
      vi.fn()
    );

    expect(result.games).toHaveLength(1);
    expect(result).toMatchObject({ added: 0, replaced: 0, unchanged: 1 });
  });

  it('treats another date or time as a separate game', () => {
    const chooseIncoming = vi.fn();
    const result = mergeImportedGames(
      [makeGame()],
      [makeGame({ id: 'another-game', date: '2026-10-05T17:15:00.000Z' })],
      chooseIncoming
    );

    expect(chooseIncoming).not.toHaveBeenCalled();
    expect(result.games).toHaveLength(2);
    expect(result.added).toBe(1);
  });

  it('prompts for a same-time game involving the same teams in either order', () => {
    const existing = makeGame();
    const imported = makeGame({
      id: 'imported-id',
      homeTeam: 'Wolves',
      awayTeam: 'Hawks',
    });
    const chooseIncoming = vi.fn(() => false);

    const result = mergeImportedGames([existing], [imported], chooseIncoming);

    expect(chooseIncoming).toHaveBeenCalledWith(existing, imported);
    expect(result.games).toEqual([existing]);
    expect(result.keptExisting).toBe(1);
  });

  it('replaces a conflicting game while preserving its local ID', () => {
    const existing = makeGame();
    const imported = makeGame({
      id: 'imported-id',
      periods: [{ number: 1, shots: [{ id: 'shot-1' }] }],
    });

    const result = mergeImportedGames([existing], [imported], () => true);

    expect(result.games).toEqual([{ ...imported, id: existing.id }]);
    expect(result).toMatchObject({ added: 0, replaced: 1, unchanged: 0 });
  });
});

describe('import helpers', () => {
  it('lists only same-game conflicts with different data', () => {
    const existing = makeGame();
    const changed = makeGame({ id: 'b', periods: [{ number: 1, shots: [{ id: 's' }] }] });
    const identical = makeGame({ id: 'c' });
    const another = makeGame({ id: 'd', date: '2026-11-01T17:00:00.000Z' });

    expect(findImportConflicts([existing], [identical, another])).toEqual([]);
    expect(findImportConflicts([existing], [changed, another])).toEqual([
      { existing, incoming: changed },
    ]);
  });

  it('resolves each conflict independently', () => {
    const first = makeGame();
    const second = makeGame({ id: 'game-2', date: '2026-11-01T17:00:00.000Z' });
    const changed = (game) => ({ ...game, id: `in-${game.id}`, status: 'in_progress' });

    const result = mergeImportedGames(
      [first, second],
      [changed(first), changed(second)],
      (existing) => existing.id === 'game-2'
    );

    expect(result.games[0]).toEqual(first);
    expect(result.games[1]).toEqual({ ...changed(second), id: 'game-2' });
    expect(result).toMatchObject({ replaced: 1, keptExisting: 1 });
  });

  it('aligns imported team names to known casing and trims them', () => {
    const [game] = alignGameTeams(
      [makeGame({ homeTeam: ' HAWKS ', awayTeam: 'new team ' })],
      ['Hawks', 'Wolves']
    );

    expect(game).toMatchObject({ homeTeam: 'Hawks', awayTeam: 'new team' });
  });

  it('assigns a new ID when an unrelated game has the same ID', () => {
    const result = mergeImportedGames(
      [makeGame()],
      [makeGame({ date: '2026-11-01T17:00:00.000Z' })],
      vi.fn()
    );

    expect(result.games).toHaveLength(2);
    expect(result.games[1].id).not.toBe('game-1');
  });
});
