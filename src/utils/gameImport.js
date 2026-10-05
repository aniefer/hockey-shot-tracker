import { generateId } from './generateId';

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;

  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      result[key] = canonicalize(value[key]);
      return result;
    }, {});
}

function sameGameData(first, second) {
  const firstData = { ...first };
  const secondData = { ...second };
  delete firstData.id;
  delete secondData.id;
  return JSON.stringify(canonicalize(firstData)) === JSON.stringify(canonicalize(secondData));
}

function getGameIdentity(game) {
  const teams = [game.homeTeam.trim().toLowerCase(), game.awayTeam.trim().toLowerCase()]
    .sort()
    .join('\u0000');
  return `${teams}\u0000${Date.parse(game.date)}`;
}

// Reports match teams by exact name, so imported games adopt the known casing.
export function alignGameTeams(games, knownTeams) {
  const canonicalTeams = new Map();
  knownTeams.forEach((team) => {
    const key = team.trim().toLowerCase();
    if (!canonicalTeams.has(key)) canonicalTeams.set(key, team.trim());
  });
  const canonicalName = (team) => canonicalTeams.get(team.trim().toLowerCase()) || team.trim();

  return games.map((game) => ({
    ...game,
    homeTeam: canonicalName(game.homeTeam),
    awayTeam: canonicalName(game.awayTeam),
  }));
}

export function findImportConflicts(existingGames, incomingGames) {
  const conflicts = [];
  incomingGames.forEach((incoming) => {
    const identity = getGameIdentity(incoming);
    const existing = existingGames.find((game) => getGameIdentity(game) === identity);
    if (existing && !sameGameData(existing, incoming)) {
      conflicts.push({ existing, incoming });
    }
  });
  return conflicts;
}

export function mergeImportedGames(existingGames, incomingGames, chooseIncoming) {
  const games = [...existingGames];
  let added = 0;
  let replaced = 0;
  let unchanged = 0;
  let keptExisting = 0;

  incomingGames.forEach((incoming) => {
    const identity = getGameIdentity(incoming);
    const existingIndex = games.findIndex((game) => getGameIdentity(game) === identity);

    if (existingIndex >= 0) {
      const existing = games[existingIndex];
      if (sameGameData(existing, incoming)) {
        unchanged += 1;
      } else if (chooseIncoming(existing, incoming)) {
        games[existingIndex] = { ...incoming, id: existing.id };
        replaced += 1;
      } else {
        keptExisting += 1;
      }
      return;
    }

    let gameToAdd = incoming;
    if (games.some((game) => game.id === incoming.id)) {
      let id = generateId();
      while (games.some((game) => game.id === id)) {
        id = generateId();
      }
      gameToAdd = { ...incoming, id };
    }
    games.push(gameToAdd);
    added += 1;
  });

  return { games, added, replaced, unchanged, keptExisting };
}
