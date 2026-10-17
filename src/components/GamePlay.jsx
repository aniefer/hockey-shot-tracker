import { useState, useCallback, useEffect } from 'react';
import HockeyRink from './HockeyRink';
import ShotPopup from './ShotPopup';
import ShotOverlay from './ShotOverlay';
import PeriodControls from './PeriodControls';
import PeriodReport from './PeriodReport';
import { exportToPdf } from '../utils/pdfExport';
import { getDefaultShotTeam } from '../utils/defaultShotTeam';
import { isRinkFlipped } from '../utils/rinkOrientation';

function getDeviceOrientation() {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

function getDeviceOrientationAngle() {
  return window.screen?.orientation?.angle ?? (window.innerWidth >= window.innerHeight ? 90 : 0);
}

export default function GamePlay({ gameState, onEndGame, onExportGameData, config }) {
  const {
    game,
    currentPeriod,
    allShots,
    currentPeriodShots,
    shotCounts,
    startPeriod,
    endPeriod,
    addShot,
    undoLastShot,
  } = gameState;

  const [pendingShot, setPendingShot] = useState(null);
  const [fadeShot, setFadeShot] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [exportingGameData, setExportingGameData] = useState(false);
  const [exportGameDataError, setExportGameDataError] = useState('');
  const [rinkOrientation, setRinkOrientation] = useState('landscape');
  const [maximized, setMaximized] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState('landscape');
  const [deviceOrientationAngle, setDeviceOrientationAngle] = useState(0);
  const isPortrait = rinkOrientation === 'portrait';

  const handleMaximize = () => {
    setRinkOrientation(getDeviceOrientation());
    setMaximized(true);
  };

  useEffect(() => {
    const updateOrientation = () => {
      setDeviceOrientation(getDeviceOrientation());
      setDeviceOrientationAngle(getDeviceOrientationAngle());
      if (maximized) setRinkOrientation(getDeviceOrientation());
    };

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    updateOrientation();
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, [maximized]);

  const textRotationClass = deviceOrientationAngle === 90 ? 'rotate-90' : '-rotate-90';

  // Rink flips for period 2
  const flipped = isRinkFlipped(currentPeriod);

  // Most recently completed period (for intermission report export)
  const lastCompletedPeriod = (() => {
    const completed = game.periods.filter((p) => p.endTime);
    return completed.length > 0 ? completed[completed.length - 1] : null;
  })();

  const handleExportPeriodReport = async () => {
    if (!lastCompletedPeriod) return;
    setExportingReport(true);
    try {
      const pNum = lastCompletedPeriod.number;
      const label = pNum === 'OT' ? 'OT' : `P${pNum}`;
      const filename = `${game.homeTeam}-vs-${game.awayTeam}-${label}-${game.date.slice(0, 10)}.pdf`;
      await exportToPdf('period-report', filename);
    } catch (err) {
      console.error('Period report export failed:', err);
    }
    setExportingReport(false);
  };

  const handleExportGameData = async () => {
    setExportingGameData(true);
    setExportGameDataError('');
    try {
      await onExportGameData(game);
    } catch (error) {
      setExportGameDataError(error instanceof Error ? error.message : 'Could not export game data.');
    } finally {
      setExportingGameData(false);
    }
  };

  const exportButtonLabel = (n) => {
    if (n === 'OT') return 'Export Overtime Report';
    return `Export Period ${n} Report`;
  };

  const handleTapRink = useCallback(
    (x, y) => {
      if (currentPeriod === null) return;
      setPendingShot({ x, y, initialTeam: getDefaultShotTeam(x, flipped) });
    },
    [currentPeriod, flipped]
  );

  const handleConfirmShot = useCallback(
    ({ team, result, playerNumber }) => {
      if (!pendingShot) return;
      const shot = addShot(pendingShot.x, pendingShot.y, team, result, playerNumber);
      setPendingShot(null);

      // Show brief fade animation
      setFadeShot({ ...shot, x: pendingShot.x, y: pendingShot.y });
    },
    [pendingShot, addShot]
  );

  // Clear fade shot after animation
  useEffect(() => {
    if (!fadeShot) return;
    const timer = setTimeout(() => setFadeShot(null), 1800);
    return () => clearTimeout(timer);
  }, [fadeShot]);

  const handleCancelShot = () => setPendingShot(null);

  const periodLabel = (n) => {
    if (n === 'OT') return 'OT';
    if (n === 1) return 'P1';
    if (n === 2) return 'P2';
    if (n === 3) return 'P3';
    return '';
  };

  return (
    <div className={maximized
      ? 'fixed inset-0 z-40 flex flex-col overflow-hidden bg-slate-900 p-2'
      : 'max-w-2xl mx-auto px-3 py-4 flex flex-col min-h-screen'}
    >
      {/* Header */}
      <div className={maximized ? 'hidden' : 'mb-3'}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold text-slate-800 truncate">
            {game.homeTeam} vs {game.awayTeam}
          </h1>
          {currentPeriod !== null && (
            <span className="text-sm font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full whitespace-nowrap ml-2">
              {periodLabel(currentPeriod)}
            </span>
          )}
        </div>

        {/* Shot counter */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-blue-600 font-semibold">
            {game.homeTeam}: {shotCounts.home}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-red-500 font-semibold">
            {game.awayTeam}: {shotCounts.away}
          </span>
          {shotCounts.total > shotCounts.home + shotCounts.away && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                Untagged: {shotCounts.total - shotCounts.home - shotCounts.away}
              </span>
            </>
          )}
        </div>
        {config.trackScoringChances && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 text-xs mt-1">
            <span className="text-blue-600 font-semibold">
              {game.homeTeam}: {shotCounts.homeScoringChances} scoring chances
            </span>
            <span className="text-red-500 font-semibold">
              {game.awayTeam}: {shotCounts.awayScoringChances} scoring chances
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={handleExportGameData}
            disabled={exportingGameData}
            className="text-sm font-medium text-blue-600 active:text-blue-800 disabled:opacity-50"
          >
            {exportingGameData ? 'Exporting game data...' : 'Export game data'}
          </button>
          <button
            type="button"
            onClick={() => setRinkOrientation(isPortrait ? 'landscape' : 'portrait')}
            aria-pressed={isPortrait}
            aria-label={`Switch rink to ${isPortrait ? 'landscape' : 'portrait'} orientation`}
            title={`Switch rink to ${isPortrait ? 'landscape' : 'portrait'} orientation`}
            className="p-2 bg-slate-100 text-slate-600 rounded-lg active:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.8 8.3a7.4 7.4 0 0 1 12.6-3.1M16 4.5l2.5.7-.1 2.6M18.2 15.7a7.4 7.4 0 0 1-12.6 3.1M8 19.5l-2.5-.7.1-2.6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleMaximize}
            aria-label="Maximize rink"
            title="Maximize rink"
            className="p-2 bg-slate-100 text-slate-600 rounded-lg active:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H3v5M3 3l6 6M16 3h5v5M21 3l-6 6M8 21H3v-5M3 21l6-6M16 21h5v-5M21 21l-6-6" />
            </svg>
          </button>
        </div>
        {exportGameDataError && (
          <p className="mt-1 text-right text-xs text-red-600" role="alert">{exportGameDataError}</p>
        )}
      </div>

      {/* Rink */}
      <div className={maximized
        ? 'min-h-0 flex-1 flex items-center justify-center pl-10'
        : 'flex-1 flex items-center justify-center mb-3'}
      >
        <div className={`${isPortrait ? 'w-fit' : 'w-full'} ${maximized ? 'h-full max-w-full' : ''} relative`}>
          <HockeyRink
            orientation={rinkOrientation}
            maximized={maximized}
            onTapRink={currentPeriod !== null ? handleTapRink : null}
          >
            {/* Prompt when no period is active */}
            {currentPeriod === null && (
              <text
                x="100"
                y="42.5"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#64748b"
                fontSize="5"
                fontWeight="600"
                opacity="0.7"
              >
                Tap Start Period to begin tracking
              </text>
            )}
            {/* Fade-out shot confirmation */}
            {fadeShot && (
              <g>
                <circle
                  cx={fadeShot.x * 200}
                  cy={fadeShot.y * 85}
                  r="4"
                  fill={fadeShot.team === 'away' ? '#ef4444' : '#3b82f6'}
                  className="shot-fade-dot"
                />
                <circle
                  cx={fadeShot.x * 200}
                  cy={fadeShot.y * 85}
                  r="6"
                  fill="none"
                  stroke={fadeShot.team === 'away' ? '#ef4444' : '#3b82f6'}
                  strokeWidth="0.6"
                  className="shot-fade-ring"
                />
              </g>
            )}
          </HockeyRink>

          {/* Team goal labels overlaid on rink */}
          {currentPeriod !== null && (
            <>
              {isPortrait ? (
                <>
                  <div
                    className="absolute top-1 left-1 right-1 px-1.5 py-0.5 rounded bg-white/70 text-[10px] font-bold leading-tight text-center"
                    style={{ color: flipped ? '#ef4444' : '#3b82f6' }}
                  >
                    {flipped ? game.awayTeam : game.homeTeam} Goal
                  </div>
                  <div
                    className="absolute bottom-1 left-1 right-1 px-1.5 py-0.5 rounded bg-white/70 text-[10px] font-bold leading-tight text-center"
                    style={{ color: flipped ? '#3b82f6' : '#ef4444' }}
                  >
                    {flipped ? game.homeTeam : game.awayTeam} Goal
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="absolute left-1 bottom-1 px-1.5 py-0.5 rounded bg-white/70 text-[10px] font-bold leading-tight"
                    style={{ color: flipped ? '#ef4444' : '#3b82f6' }}
                  >
                    {flipped ? game.awayTeam : game.homeTeam} Goal
                  </div>
                  <div
                    className="absolute right-1 bottom-1 px-1.5 py-0.5 rounded bg-white/70 text-[10px] font-bold leading-tight text-right"
                    style={{ color: flipped ? '#3b82f6' : '#ef4444' }}
                  >
                    {flipped ? game.homeTeam : game.awayTeam} Goal
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className={maximized
        ? 'absolute left-0 top-0 bottom-0 z-10 flex w-10 flex-col items-center justify-center gap-1 bg-white/95 py-2'
        : 'space-y-3 pb-4'}
      >
        {maximized && (
          <button
            type="button"
            onClick={() => setMaximized(false)}
            aria-label="Restore normal rink view"
            title="Restore normal rink view"
            className="mb-2 p-1.5 rounded-lg bg-white text-slate-700 shadow-sm active:bg-slate-100"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v5H3M3 8l6-6M16 3v5h5M21 8l-6-6M8 21v-5H3M3 16l6 6M16 21v-5h5M21 16l-6 6" />
            </svg>
          </button>
        )}
        {currentPeriod !== null && (
          <div className={maximized ? 'flex flex-col' : 'flex gap-3'}>
            <div className={maximized ? 'w-10 h-20 flex items-center justify-center' : 'contents'}>
              <button
                onClick={undoLastShot}
                disabled={currentPeriodShots.length === 0}
                className={maximized
                  ? `w-20 py-1.5 text-[10px] bg-slate-100 text-slate-600 font-semibold rounded-lg active:bg-slate-200 transition-colors disabled:opacity-30 disabled:active:bg-slate-100 ${textRotationClass}`
                  : 'flex-1 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl active:bg-slate-200 transition-colors disabled:opacity-30 disabled:active:bg-slate-100'}
              >
                Undo
              </button>
            </div>
            <div className={maximized ? 'w-10 h-20 flex items-center justify-center' : 'contents'}>
              <button
                onClick={() => setShowOverlay(true)}
                disabled={allShots.length === 0}
                className={maximized
                  ? `w-20 py-1.5 text-[10px] bg-slate-100 text-slate-600 font-semibold rounded-lg active:bg-slate-200 transition-colors disabled:opacity-30 disabled:active:bg-slate-100 ${textRotationClass}`
                  : 'flex-1 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl active:bg-slate-200 transition-colors disabled:opacity-30 disabled:active:bg-slate-100'}
              >
                View Shots
              </button>
            </div>
          </div>
        )}

        {/* Period summaries */}
        {!maximized && game.periods.filter((p) => p.endTime).length > 0 && currentPeriod === null && (
          <div className="flex flex-wrap gap-2 justify-center text-xs text-slate-500">
            {game.periods
              .filter((p) => p.endTime)
              .map((p) => (
                <span key={p.number} className="bg-slate-100 px-2.5 py-1 rounded-full">
                  {periodLabel(p.number)}: {p.shots.length} shot{p.shots.length !== 1 ? 's' : ''}
                </span>
              ))}
          </div>
        )}

        {/* Export period report */}
        {!maximized && currentPeriod === null && lastCompletedPeriod && (
          <button
            onClick={handleExportPeriodReport}
            disabled={exportingReport}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-semibold rounded-xl active:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {exportingReport ? 'Exporting...' : exportButtonLabel(lastCompletedPeriod.number)}
          </button>
        )}

        <PeriodControls
          game={game}
          currentPeriod={currentPeriod}
          onStartPeriod={startPeriod}
          onEndPeriod={endPeriod}
          onEndGame={onEndGame}
          maximized={maximized}
          textRotationClass={textRotationClass}
        />
      </div>

      {/* Shot detail popup */}
      {pendingShot && (
        <ShotPopup
          x={pendingShot.x}
          y={pendingShot.y}
          initialTeam={pendingShot.initialTeam}
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          trackBlockedShots={config.trackBlockedShots}
          trackScoringChances={config.trackScoringChances}
          onConfirm={handleConfirmShot}
          onCancel={handleCancelShot}
          deviceOrientation={deviceOrientation}
        />
      )}

      {/* Shot overlay */}
      {showOverlay && (
        <ShotOverlay
          periods={game.periods}
          currentPeriod={currentPeriod}
          orientation={rinkOrientation}
          trackBlockedShots={config.trackBlockedShots}
          trackScoringChances={config.trackScoringChances}
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          onClose={() => setShowOverlay(false)}
        />
      )}

      {/* Off-screen period report for PDF export */}
      {currentPeriod === null && lastCompletedPeriod && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }} aria-hidden="true">
          <PeriodReport
            id="period-report"
            game={game}
            periodNumber={lastCompletedPeriod.number}
            config={config}
          />
        </div>
      )}
    </div>
  );
}
