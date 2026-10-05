const STORAGE_KEY = 'hockey-shot-tracker-games';
const CONFIG_STORAGE_KEY = 'hockey-shot-tracker-config';

export const DEFAULT_CONFIG = {
  trackBlockedShots: true,
  trackScoringChances: true,
  reportShotsByZone: true,
  reportShotOutcomeBreakdown: true,
  reportShotMapsByPeriod: 'mini',
};

export function normalizeConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { ...DEFAULT_CONFIG };
  }

  return {
    trackBlockedShots: typeof config.trackBlockedShots === 'boolean'
      ? config.trackBlockedShots
      : DEFAULT_CONFIG.trackBlockedShots,
    trackScoringChances: typeof config.trackScoringChances === 'boolean'
      ? config.trackScoringChances
      : DEFAULT_CONFIG.trackScoringChances,
    reportShotsByZone: typeof config.reportShotsByZone === 'boolean'
      ? config.reportShotsByZone
      : DEFAULT_CONFIG.reportShotsByZone,
    reportShotOutcomeBreakdown: typeof config.reportShotOutcomeBreakdown === 'boolean'
      ? config.reportShotOutcomeBreakdown
      : DEFAULT_CONFIG.reportShotOutcomeBreakdown,
    reportShotMapsByPeriod: [false, 'mini', 'full'].includes(config.reportShotMapsByPeriod)
      ? config.reportShotMapsByPeriod
      : DEFAULT_CONFIG.reportShotMapsByPeriod,
  };
}

export function loadConfig() {
  const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (raw === null) return { ...DEFAULT_CONFIG };

  let config;
  try {
    config = JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) return { ...DEFAULT_CONFIG };
    throw error;
  }

  return normalizeConfig(config);
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
}

export function loadGames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGame(game) {
  const games = loadGames();
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) {
    games[idx] = game;
  } else {
    games.unshift(game);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function deleteGame(gameId) {
  const games = loadGames().filter((g) => g.id !== gameId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function getGame(gameId) {
  return loadGames().find((g) => g.id === gameId) || null;
}
