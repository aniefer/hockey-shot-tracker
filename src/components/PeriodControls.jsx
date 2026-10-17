export default function PeriodControls({
  game,
  currentPeriod,
  onStartPeriod,
  onEndPeriod,
  onEndGame,
  maximized = false,
  textRotationClass = '-rotate-90',
}) {
  const completedPeriods = game.periods.filter((p) => p.endTime);
  const periodInProgress = currentPeriod !== null;

  const nextPeriodNumber = () => {
    const nums = game.periods.map((p) => p.number);
    if (!nums.includes(1)) return 1;
    if (!nums.includes(2)) return 2;
    if (!nums.includes(3)) return 3;
    if (!nums.includes('OT')) return 'OT';
    return null;
  };

  const periodLabel = (n) => {
    if (n === 'OT') return 'Overtime';
    if (n === 1) return '1st Period';
    if (n === 2) return '2nd Period';
    if (n === 3) return '3rd Period';
    return `Period ${n}`;
  };

  const allRegulationDone = completedPeriods.some((p) => p.number === 3);
  const overtimeDone = completedPeriods.some((p) => p.number === 'OT');
  const next = nextPeriodNumber();
  const buttonClass = maximized
    ? `w-28 py-1.5 text-[10px] bg-blue-600 text-white font-semibold rounded-lg active:bg-blue-700 transition-colors ${textRotationClass}`
    : 'w-full py-3 bg-blue-600 text-white font-semibold rounded-xl active:bg-blue-700 transition-colors';
  const buttonWrapperClass = maximized
    ? 'w-10 h-28 flex items-center justify-center'
    : 'contents';

  if (periodInProgress) {
    return (
      <div className={buttonWrapperClass}>
        <button
          onClick={onEndPeriod}
          className={maximized
          ? `w-28 py-1.5 text-[10px] bg-amber-500 text-white font-semibold rounded-lg active:bg-amber-600 transition-colors ${textRotationClass}`
            : 'w-full py-3 bg-amber-500 text-white font-semibold rounded-xl active:bg-amber-600 transition-colors'}
        >
          End {periodLabel(currentPeriod)}
        </button>
      </div>
    );
  }

  // After 3rd period ends (or OT ends) — show end game
  if (allRegulationDone && !periodInProgress) {
    return (
      <div className={maximized ? 'flex flex-col' : 'flex gap-3'}>
        {!overtimeDone && next === 'OT' && (
          <div className={buttonWrapperClass}>
            <button
              onClick={() => onStartPeriod('OT')}
              className={maximized
                ? `w-28 py-1.5 text-[10px] bg-slate-200 text-slate-700 font-semibold rounded-lg active:bg-slate-300 transition-colors ${textRotationClass}`
                : 'flex-1 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl active:bg-slate-300 transition-colors'}
            >
              Add Overtime
            </button>
          </div>
        )}
        <div className={buttonWrapperClass}>
          <button
            onClick={onEndGame}
            className={maximized
              ? `w-28 py-1.5 text-[10px] bg-emerald-600 text-white font-semibold rounded-lg active:bg-emerald-700 transition-colors ${textRotationClass}`
              : 'flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl active:bg-emerald-700 transition-colors'}
          >
            End &amp; Save Game
          </button>
        </div>
      </div>
    );
  }

  // Normal: show start next period
  if (next && typeof next === 'number') {
    return (
      <div className={buttonWrapperClass}>
        <button
          onClick={() => onStartPeriod(next)}
          className={buttonClass}
        >
          Start {periodLabel(next)}
        </button>
      </div>
    );
  }

  return null;
}
