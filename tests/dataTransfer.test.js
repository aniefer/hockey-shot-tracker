import { describe, expect, it } from 'vitest';
import { createBackup, gzipJson, readGzipJsonBackup } from '../src/utils/dataTransfer';

const makeGame = (overrides = {}) => ({
  id: 'game-1',
  date: '2026-10-05T17:00:00.000Z',
  homeTeam: 'Hawks',
  awayTeam: 'Wolves',
  periods: [{ number: 1, shots: [{ x: 0.5, y: 0.5, timestamp: '2026-10-05T17:01:00.000Z' }] }],
  status: 'completed',
  ...overrides,
});

const makeBackup = (overrides = {}) => ({
  format: 'hockey-shot-tracker',
  version: 1,
  teams: ['Hawks', 'Wolves'],
  games: [makeGame()],
  ...overrides,
});

const gzipBlob = (data) => gzipJson(data);

describe('createBackup', () => {
  it('dedupes teams case-insensitively and trims names', () => {
    const backup = createBackup(
      [makeGame({ homeTeam: ' hawks ' })],
      ['Hawks', '  ', 'Wolves', 'wolves']
    );

    expect(backup.teams).toEqual(['Hawks', 'Wolves']);
  });
});

describe('readGzipJsonBackup', () => {
  it('round-trips an exported backup', async () => {
    const backup = createBackup([makeGame()], ['Falcons']);

    const result = await readGzipJsonBackup(await gzipBlob(backup));

    expect(result).toEqual({ games: backup.games, teams: backup.teams });
  });

  it('trims team names on imported games and teams', async () => {
    const backup = makeBackup({
      teams: [' Hawks ', 'Wolves  '],
      games: [makeGame({ homeTeam: ' Hawks', awayTeam: 'Wolves ' })],
    });

    const result = await readGzipJsonBackup(await gzipBlob(backup));

    expect(result.teams).toEqual(['Hawks', 'Wolves']);
    expect(result.games[0]).toMatchObject({ homeTeam: 'Hawks', awayTeam: 'Wolves' });
  });

  it('rejects files that are not gzip', async () => {
    const file = new Blob(['{"not":"gzip"}']);

    await expect(readGzipJsonBackup(file)).rejects.toThrow('Could not decompress');
  });

  it('rejects gzip content that is not JSON', async () => {
    const text = new Blob(['not json']).stream().pipeThrough(new CompressionStream('gzip'));
    const bad = await new Response(text).blob();

    await expect(readGzipJsonBackup(bad)).rejects.toThrow('not valid JSON');
  });

  it.each([
    ['wrong format', { format: 'other' }],
    ['wrong version', { version: 2 }],
    ['missing games', { games: undefined }],
    ['blank team', { teams: ['Hawks', ' '] }],
  ])('rejects a backup with %s', async (_name, overrides) => {
    await expect(readGzipJsonBackup(await gzipBlob(makeBackup(overrides))))
      .rejects.toThrow('not a supported Hockey Shot Tracker export');
  });

  it.each([
    ['missing id', { id: '' }],
    ['same home and away team', { awayTeam: 'hawks' }],
    ['invalid date', { date: 'nope' }],
    ['unknown status', { status: 'paused' }],
    ['non-array periods', { periods: null }],
    ['invalid shot', { periods: [{ number: 1, shots: [{ x: 'a', y: 0, timestamp: '2026-10-05T17:01:00.000Z' }] }] }],
  ])('rejects a game with %s', async (_name, gameOverrides) => {
    const backup = makeBackup({ games: [makeGame(gameOverrides)] });

    await expect(readGzipJsonBackup(await gzipBlob(backup)))
      .rejects.toThrow('invalid game data');
  });
});
