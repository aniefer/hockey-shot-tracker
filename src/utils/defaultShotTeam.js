export function normalizeRinkCoordinates(x, y, orientation) {
  if (orientation === 'portrait') return { x: y, y: 1 - x };
  return { x, y };
}

export function getDefaultShotTeam(x, flipped) {
  if (x < 0.375) return flipped ? 'home' : 'away';
  if (x > 0.625) return flipped ? 'away' : 'home';
  return null;
}
