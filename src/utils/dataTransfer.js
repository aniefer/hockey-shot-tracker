const BACKUP_FORMAT = 'hockey-shot-tracker';
const BACKUP_VERSION = 1;

export function createBackup(games, teams) {
  const uniqueTeams = [];
  [...teams, ...games.flatMap((game) => [game.homeTeam, game.awayTeam])].forEach((team) => {
    if (
      typeof team === 'string'
      && team.trim()
      && !uniqueTeams.some((existing) => existing.toLowerCase() === team.trim().toLowerCase())
    ) {
      uniqueTeams.push(team.trim());
    }
  });

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    teams: uniqueTeams,
    games,
  };
}

export async function gzipJson(data) {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('Gzip export is not supported by this browser.');
  }

  const json = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const compressed = json.stream().pipeThrough(new CompressionStream('gzip'));
  return new Response(compressed).blob();
}

export async function downloadGzipJson(data, filename) {
  const blob = await gzipJson(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateBackup(data) {
  if (
    !data
    || typeof data !== 'object'
    || Array.isArray(data)
    || data.format !== BACKUP_FORMAT
    || data.version !== BACKUP_VERSION
    || !Array.isArray(data.games)
    || !Array.isArray(data.teams)
    || !data.teams.every((team) => typeof team === 'string' && team.trim())
  ) {
    throw new Error('This is not a supported Hockey Shot Tracker export.');
  }

  const validGames = data.games.every((game) => (
    game
    && typeof game === 'object'
    && !Array.isArray(game)
    && typeof game.id === 'string'
    && game.id.trim()
    && typeof game.homeTeam === 'string'
    && game.homeTeam.trim()
    && typeof game.awayTeam === 'string'
    && game.awayTeam.trim()
    && game.homeTeam.trim().toLowerCase() !== game.awayTeam.trim().toLowerCase()
    && typeof game.date === 'string'
    && Number.isFinite(Date.parse(game.date))
    && ['in_progress', 'completed'].includes(game.status)
    && Array.isArray(game.periods)
    && game.periods.every((period) => (
      period
      && typeof period === 'object'
      && Array.isArray(period.shots)
      && period.shots.every((shot) => (
        shot
        && typeof shot === 'object'
        && !Array.isArray(shot)
        && Number.isFinite(shot.x)
        && Number.isFinite(shot.y)
        && typeof shot.timestamp === 'string'
        && Number.isFinite(Date.parse(shot.timestamp))
      ))
    ))
  ));
  if (!validGames) {
    throw new Error('The export contains invalid game data.');
  }

  return {
    games: data.games.map((game) => ({
      ...game,
      homeTeam: game.homeTeam.trim(),
      awayTeam: game.awayTeam.trim(),
    })),
    teams: data.teams.map((team) => team.trim()),
  };
}

export async function readGzipJsonBackup(file) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Gzip import is not supported by this browser.');
  }

  const decompressed = file.stream().pipeThrough(new DecompressionStream('gzip'));
  let text;
  try {
    text = await new Response(decompressed).text();
  } catch (error) {
    throw new Error('Could not decompress this file. Select a valid .json.gz export.', { cause: error });
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error('The decompressed file is not valid JSON.', { cause: error });
  }

  return validateBackup(data);
}
