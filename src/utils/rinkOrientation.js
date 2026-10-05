export function isRinkFlipped(periodNumber) {
  return periodNumber === 2;
}

export function normalizeFullGameShots(periods) {
  return periods.flatMap((period) => period.shots.map((shot) => ({
    ...shot,
    x: isRinkFlipped(period.number) && typeof shot.x === 'number'
      ? 1 - shot.x
      : shot.x,
  })));
}
