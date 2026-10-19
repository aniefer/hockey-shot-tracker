export const HOME_START_SIDES = ['left', 'right'];

export function normalizeHomeStartSide(value) {
  return value === 'right' ? 'right' : 'left';
}

export function getHomeStartSide(game) {
  return normalizeHomeStartSide(game?.homeStartSide);
}

// homeStartSide is the side of the rink holding the home team's goal. Home shoots
// toward the opposite end in period 1, and the rink flips in period 2. Shots are
// stored in the physical rink frame, so the flip applies when either condition
// is true, but not both.
export function isRinkFlipped(periodNumber, homeStartSide = 'left') {
  return (periodNumber === 2) !== (normalizeHomeStartSide(homeStartSide) === 'right');
}

export function normalizeFullGameShots(periods, homeStartSide = 'left') {
  return periods.flatMap((period) => period.shots.map((shot) => ({
    ...shot,
    x: isRinkFlipped(period.number, homeStartSide) && typeof shot.x === 'number'
      ? 1 - shot.x
      : shot.x,
  })));
}
