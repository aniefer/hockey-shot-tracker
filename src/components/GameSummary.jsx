import { useState } from 'react';
import ShotMap from './ShotMap';
import MiniShotMap from './MiniShotMap';
import Heatmap from './Heatmap';
import ShotTimeline from './ShotTimeline';
import GameMomentum from './GameMomentum';
import ShotOutcomePie from './ShotOutcomePie';
import ZoneTimeChart from './ZoneTimeChart';
import { exportToPdf } from '../utils/pdfExport';
import { getHomeStartSide, isRinkFlipped, normalizeFullGameShots } from '../utils/rinkOrientation';
import { getShotCounts } from '../utils/shotStats';
import { getGameZoneDurations } from '../utils/zoneTime';

export default function GameSummary({ game, headToHead, onBack, onExportGameData, config }) {
  const [exporting, setExporting] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [exportDataError, setExportDataError] = useState('');

  const homeStartSide = getHomeStartSide(game);
  const allShots = game.periods.flatMap((p) => p.shots);
  const fullGameMapShots = normalizeFullGameShots(game.periods, homeStartSide);
  const homeShots = allShots.filter((s) => s.team === 'home');
  const awayShots = allShots.filter((s) => s.team === 'away');
  const homeGoals = homeShots.filter((s) => s.result === 'goal').length;
  const awayGoals = awayShots.filter((s) => s.result === 'goal').length;
  const homeBlocked = homeShots.filter((s) => s.result === 'blocked').length;
  const awayBlocked = awayShots.filter((s) => s.result === 'blocked').length;
  const shotCounts = getShotCounts(allShots);
  const homeScoringChances = config.trackScoringChances ? shotCounts.homeScoringChances : 0;
  const awayScoringChances = config.trackScoringChances ? shotCounts.awayScoringChances : 0;
  const pct = (num, denom) => {
    if (denom === 0) return '-';
    return ((num / denom) * 100).toFixed(0) + '%';
  };

  const periodLabel = (n) => {
    if (n === 'OT') return 'OT';
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `P${n}`;
  };

  const periodLabelLong = (n) => {
    if (n === 'OT') return 'Overtime';
    if (n === 1) return '1st Period';
    if (n === 2) return '2nd Period';
    if (n === 3) return '3rd Period';
    return `Period ${n}`;
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  // Zone analysis: classify shots as offensive/neutral/defensive relative to each team.
  // Home shoots right in P1 when its goal is on the left; the rink flips in P2 and when the home goal is on the right.
  const classifyZone = (x, team, periodNumber) => {
    const homeAttacksRight = !isRinkFlipped(periodNumber, homeStartSide);
    const isLeft = x < 0.375;
    const isRight = x > 0.625;

    if (team === 'home') {
      if (homeAttacksRight) {
        if (isRight) return 'offensive';
        if (isLeft) return 'defensive';
      } else {
        if (isLeft) return 'offensive';
        if (isRight) return 'defensive';
      }
    } else if (team === 'away') {
      if (homeAttacksRight) {
        if (isLeft) return 'offensive';
        if (isRight) return 'defensive';
      } else {
        if (isRight) return 'offensive';
        if (isLeft) return 'defensive';
      }
    }
    return 'neutral';
  };

  // Tag each shot with its period, then compute zone stats
  const taggedShots = game.periods.flatMap((p) =>
    p.shots.map((s) => ({ ...s, periodNumber: p.number }))
  );
  const taggedHome = taggedShots.filter((s) => s.team === 'home');
  const taggedAway = taggedShots.filter((s) => s.team === 'away');

  const buildZoneStats = (shots, team) => {
    const offensive = shots.filter((s) => classifyZone(s.x, team, s.periodNumber) === 'offensive');
    const neutral = shots.filter((s) => classifyZone(s.x, team, s.periodNumber) === 'neutral');
    const defensive = shots.filter((s) => classifyZone(s.x, team, s.periodNumber) === 'defensive');
    return { offensive, neutral, defensive };
  };

  const homeZones = buildZoneStats(taggedHome, 'home');
  const awayZones = buildZoneStats(taggedAway, 'away');

  // Build player stats
  const playerStats = {};
  allShots.forEach((s) => {
    if (!s.playerNumber) return;
    const key = `${s.team || 'unknown'}-${s.playerNumber}`;
    if (!playerStats[key]) {
      playerStats[key] = {
        team: s.team,
        number: s.playerNumber,
        shots: 0,
        goals: 0,
        blocked: 0,
      };
    }
    playerStats[key].shots++;
    if (s.result === 'goal') playerStats[key].goals++;
    if (s.result === 'blocked') playerStats[key].blocked++;
  });
  const playerList = Object.values(playerStats).sort((a, b) => b.shots - a.shots);

  // Per-period stats helper
  const periodStats = (period) => {
    const shots = period.shots;
    const home = shots.filter((s) => s.team === 'home');
    const away = shots.filter((s) => s.team === 'away');
    return {
      shots,
      homeShots: home,
      awayShots: away,
      homeGoals: home.filter((s) => s.result === 'goal').length,
      awayGoals: away.filter((s) => s.result === 'goal').length,
      homeBlocked: home.filter((s) => s.result === 'blocked').length,
      awayBlocked: away.filter((s) => s.result === 'blocked').length,
      homeScoringChances: config.trackScoringChances
        ? home.filter((s) => s.result === 'scoring_chance').length
        : 0,
      awayScoringChances: config.trackScoringChances
        ? away.filter((s) => s.result === 'scoring_chance').length
        : 0,
    };
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const filename = `${game.homeTeam}-vs-${game.awayTeam}-${game.date.slice(0, 10)}.pdf`;
      await exportToPdf('game-summary-report', filename);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setExporting(false);
  };

  const handleExportGameData = async () => {
    setExportingData(true);
    setExportDataError('');
    try {
      await onExportGameData(game);
    } catch (error) {
      setExportDataError(error instanceof Error ? error.message : 'Could not export game data.');
    } finally {
      setExportingData(false);
    }
  };

  // Bar component for zone charts
  const ZoneBar = ({ label, count, total, color }) => {
    const width = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-14 text-right text-slate-500 shrink-0">{label}</span>
        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${width}%`, backgroundColor: color }}
          />
        </div>
        <span className="w-6 text-slate-600 font-semibold">{count}</span>
      </div>
    );
  };

  const zoneDurations = getGameZoneDurations(game);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-blue-600 font-medium active:text-blue-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </button>
        <div className="flex items-center gap-1.5">
          {!headToHead && (
            <button
              onClick={handleExportGameData}
              disabled={exportingData}
              className="px-2 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl active:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {exportingData ? 'Exporting...' : 'Export data'}
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1 px-2 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl active:bg-slate-900 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>
      {exportDataError && (
        <p className="mb-4 text-right text-sm text-red-600" role="alert">{exportDataError}</p>
      )}

      <div id="game-summary-report" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-slate-800 mb-1">
            {game.homeTeam} vs {game.awayTeam}
          </h1>
          {headToHead ? (
            <p className="text-sm text-slate-500">
              {headToHead.includedGames} {headToHead.includedGames === 1 ? 'game' : 'games'}
              {' included ('}
              {headToHead.totalGames} completed
              {') · '}
              {formatDate(headToHead.firstDate)}
              {headToHead.firstDate !== headToHead.lastDate && ` – ${formatDate(headToHead.lastDate)}`}
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              {formatDate(game.date)} at {formatTime(game.date)}
            </p>
          )}
        </div>

        {headToHead && (
          <section className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Completed Head-to-Head Record
            </h2>
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <div className="text-sm font-semibold text-blue-600">
                {game.homeTeam}: {headToHead.homeWins} {headToHead.homeWins === 1 ? 'win' : 'wins'}
              </div>
              <div className="text-sm font-semibold text-red-500">
                {game.awayTeam}: {headToHead.awayWins} {headToHead.awayWins === 1 ? 'win' : 'wins'}
              </div>
            </div>
            {headToHead.totalGames > 0 ? (
              <>
                <div
                  role="img"
                  aria-label={`${game.homeTeam} won ${headToHead.homeWins} of ${headToHead.totalGames} completed games; ${game.awayTeam} won ${headToHead.awayWins}; ${headToHead.ties} tied`}
                  className="flex h-5 overflow-hidden rounded-full bg-slate-200"
                >
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(headToHead.homeWins / headToHead.totalGames) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(headToHead.awayWins / headToHead.totalGames) * 100}%` }}
                  />
                  <div
                    className="h-full bg-slate-400"
                    style={{ width: `${(headToHead.ties / headToHead.totalGames) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-x-3 text-xs text-slate-500">
                  <span>{game.homeTeam} {((headToHead.homeWins / headToHead.totalGames) * 100).toFixed(0)}%</span>
                  <span>{headToHead.ties} {headToHead.ties === 1 ? 'tie' : 'ties'}</span>
                  <span>{game.awayTeam} {((headToHead.awayWins / headToHead.totalGames) * 100).toFixed(0)}%</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No completed games yet.</p>
            )}
          </section>
        )}

        {/* Score summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{homeGoals}</div>
            <div className="text-sm font-semibold text-slate-600">{game.homeTeam}</div>
            <div className="text-xs text-slate-400">{homeShots.length} shots</div>
            {config.trackScoringChances && (
              <div className="text-xs text-violet-600">{homeScoringChances} scoring chances</div>
            )}
          </div>
          <div className="flex items-center justify-center">
            <span className="text-slate-300 text-lg font-bold">{headToHead ? 'TOTAL' : 'FINAL'}</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{awayGoals}</div>
            <div className="text-sm font-semibold text-slate-600">{game.awayTeam}</div>
            <div className="text-xs text-slate-400">{awayShots.length} shots</div>
            {config.trackScoringChances && (
              <div className="text-xs text-violet-600">{awayScoringChances} scoring chances</div>
            )}
          </div>
        </div>

        {/* Period breakdown table */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Shots by Period
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 font-semibold text-slate-600">Team</th>
                  {game.periods.map((p) => (
                    <th key={p.number} className="text-center py-2 px-2 font-semibold text-slate-600">
                      {periodLabel(p.number)}
                    </th>
                  ))}
                  <th className="text-center py-2 pl-2 font-bold text-slate-800">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-blue-600">{game.homeTeam}</td>
                  {game.periods.map((p) => {
                    const ps = periodStats(p);
                    return (
                      <td key={p.number} className="text-center py-2 px-2">
                        {ps.homeShots.length}
                        {ps.homeGoals > 0 && (
                          <span className="text-emerald-600 text-xs ml-0.5">({ps.homeGoals}G)</span>
                        )}
                        {config.trackScoringChances && ps.homeScoringChances > 0 && (
                          <span className="text-violet-600 text-xs ml-0.5">({ps.homeScoringChances} SC)</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center py-2 pl-2 font-bold">{homeShots.length}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium text-red-500">{game.awayTeam}</td>
                  {game.periods.map((p) => {
                    const ps = periodStats(p);
                    return (
                      <td key={p.number} className="text-center py-2 px-2">
                        {ps.awayShots.length}
                        {ps.awayGoals > 0 && (
                          <span className="text-emerald-600 text-xs ml-0.5">({ps.awayGoals}G)</span>
                        )}
                        {config.trackScoringChances && ps.awayScoringChances > 0 && (
                          <span className="text-violet-600 text-xs ml-0.5">({ps.awayScoringChances} SC)</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center py-2 pl-2 font-bold">{awayShots.length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key stats grid */}
        <div className={`grid grid-cols-2 ${config.trackBlockedShots ? 'sm:grid-cols-4' : 'sm:grid-cols-2'} gap-3 mb-6`}>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{pct(homeGoals, homeShots.length)}</div>
            <div className="text-xs text-slate-500">{game.homeTeam} shooting %</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-red-500">{pct(awayGoals, awayShots.length)}</div>
            <div className="text-xs text-slate-500">{game.awayTeam} shooting %</div>
          </div>
          {config.trackBlockedShots && (
            <>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-blue-600">
                  {pct(awayBlocked, awayShots.length)}
                </div>
                <div className="text-xs text-slate-500">{game.homeTeam} save %</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-red-500">
                  {pct(homeBlocked, homeShots.length)}
                </div>
                <div className="text-xs text-slate-500">{game.awayTeam} save %</div>
              </div>
            </>
          )}
        </div>

        {/* Time in zone (single game only) */}
        {!headToHead && game.trackZoneTime && zoneDurations.total > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Time in Zone
            </h2>
            <ZoneTimeChart periods={game.periods} />
          </div>
        )}

        {/* Shot outcome breakdown */}
        {config.reportShotOutcomeBreakdown && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Shot Outcome Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ShotOutcomePie
                teamName={game.homeTeam}
                shots={homeShots}
                trackBlockedShots={config.trackBlockedShots}
                trackScoringChances={config.trackScoringChances}
              />
              <ShotOutcomePie
                teamName={game.awayTeam}
                shots={awayShots}
                trackBlockedShots={config.trackBlockedShots}
                trackScoringChances={config.trackScoringChances}
              />
            </div>
          </div>
        )}

        {headToHead && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Game Momentum
            </h2>
            {headToHead.gameMomentum.length > 0 ? (
              <GameMomentum
                games={headToHead.gameMomentum}
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
              />
            ) : (
              <p className="text-sm text-slate-500">No completed games to chart yet.</p>
            )}
          </div>
        )}
        {!headToHead && allShots.length > 1 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Shot Momentum
            </h2>
            <ShotTimeline periods={game.periods} homeTeam={game.homeTeam} awayTeam={game.awayTeam} />
          </div>
        )}

        {/* Full-game shot map */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {headToHead ? 'Shot Map (All Games)' : 'Shot Map (Full Game)'}
          </h2>
          <ShotMap
            shots={fullGameMapShots}
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
            trackBlockedShots={config.trackBlockedShots}
            trackScoringChances={config.trackScoringChances}
          />
        </div>

        {/* Per-period shot maps */}
        {game.periods.length > 1 && config.reportShotMapsByPeriod !== false && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              {headToHead ? 'Shot Maps by Period (All Games)' : 'Shot Maps by Period'}
            </h2>
            <div className={`grid gap-3 ${
              config.reportShotMapsByPeriod === 'full'
                ? 'grid-cols-1'
                : game.periods.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              {game.periods.map((p) => {
                const ps = periodStats(p);
                return (
                  <div
                    key={p.number}
                    className={config.reportShotMapsByPeriod === 'full' ? '' : 'bg-slate-50 rounded-xl p-3'}
                  >
                    <div className="text-xs font-semibold text-slate-600 text-center mb-1">
                      {periodLabelLong(p.number)}
                    </div>
                    {config.reportShotMapsByPeriod === 'full' ? (
                      <ShotMap
                        shots={p.shots}
                        homeTeam={game.homeTeam}
                        awayTeam={game.awayTeam}
                        trackBlockedShots={config.trackBlockedShots}
                        trackScoringChances={config.trackScoringChances}
                      />
                    ) : (
                      <MiniShotMap
                        shots={p.shots}
                        homeTeam={game.homeTeam}
                        awayTeam={game.awayTeam}
                        trackScoringChances={config.trackScoringChances}
                      />
                    )}
                    <div className="flex justify-center gap-4 mt-1.5 text-xs text-slate-500">
                      <span className="text-blue-600 font-semibold">
                        {ps.homeShots.length}S {ps.homeGoals > 0 && `/ ${ps.homeGoals}G`}
                      </span>
                      <span className="text-red-500 font-semibold">
                        {ps.awayShots.length}S {ps.awayGoals > 0 && `/ ${ps.awayGoals}G`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Heatmap */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Shot Density
          </h2>
          <Heatmap
            shots={fullGameMapShots}
            homeTeam={game.homeTeam}
            awayTeam={game.awayTeam}
          />
        </div>

        {/* Zone analysis */}
        {config.reportShotsByZone && (homeShots.length > 0 || awayShots.length > 0) && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Shots by Zone
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm font-semibold text-blue-600 mb-2">{game.homeTeam}</div>
                <div className="space-y-1.5">
                  <ZoneBar label="Offensive" count={homeZones.offensive.length} total={homeShots.length} color="#3b82f6" />
                  <ZoneBar label="Neutral" count={homeZones.neutral.length} total={homeShots.length} color="#3b82f6" />
                  <ZoneBar label="Defensive" count={homeZones.defensive.length} total={homeShots.length} color="#3b82f6" />
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {pct(homeZones.offensive.length, homeShots.length)} offensive
                  {' / '}{pct(homeZones.neutral.length, homeShots.length)} neutral
                  {' / '}{pct(homeZones.defensive.length, homeShots.length)} defensive
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm font-semibold text-red-500 mb-2">{game.awayTeam}</div>
                <div className="space-y-1.5">
                  <ZoneBar label="Offensive" count={awayZones.offensive.length} total={awayShots.length} color="#ef4444" />
                  <ZoneBar label="Neutral" count={awayZones.neutral.length} total={awayShots.length} color="#ef4444" />
                  <ZoneBar label="Defensive" count={awayZones.defensive.length} total={awayShots.length} color="#ef4444" />
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  {pct(awayZones.offensive.length, awayShots.length)} offensive
                  {' / '}{pct(awayZones.neutral.length, awayShots.length)} neutral
                  {' / '}{pct(awayZones.defensive.length, awayShots.length)} defensive
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player stats */}
        {playerList.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Player Stats
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-4 font-semibold text-slate-600">#</th>
                    <th className="text-left py-2 pr-4 font-semibold text-slate-600">Team</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-600">Shots</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-600">Goals</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-600">Sh%</th>
                  </tr>
                </thead>
                <tbody>
                  {playerList.map((p) => (
                    <tr key={`${p.team}-${p.number}`} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-bold">{p.number}</td>
                      <td className={`py-2 pr-4 font-medium ${p.team === 'home' ? 'text-blue-600' : p.team === 'away' ? 'text-red-500' : 'text-slate-500'}`}>
                        {p.team === 'home' ? game.homeTeam : p.team === 'away' ? game.awayTeam : '-'}
                      </td>
                      <td className="text-center py-2 px-2">{p.shots}</td>
                      <td className="text-center py-2 px-2">{p.goals}</td>
                      <td className="text-center py-2 px-2">{pct(p.goals, p.shots)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
