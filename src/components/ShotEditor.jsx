import { useState } from 'react';
import ShotPopup from './ShotPopup';

const RESULT_LABELS = {
  goal: 'Goal',
  blocked: 'Blocked',
  scoring_chance: 'Scoring chance',
};

function periodLabel(n) {
  if (n === 'OT') return 'OT';
  return `P${n}`;
}

function formatTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

// mode 'last' edits the most recent shot of the current period; 'all' lists every shot to choose from.
export default function ShotEditor({
  mode,
  periods,
  currentPeriod,
  homeTeam,
  awayTeam,
  config,
  onUpdateShot,
  onDeleteShot,
  onClose,
  deviceOrientation,
  rotated = false,
}) {
  const [selectedId, setSelectedId] = useState(null);

  const entries = periods.flatMap((p) => p.shots.map((shot, index) => ({ shot, period: p.number, index })));
  const lastShot = (() => {
    const period = periods.find((p) => p.number === currentPeriod);
    return period?.shots[period.shots.length - 1] ?? null;
  })();

  const editingId = mode === 'last' ? lastShot?.id : selectedId;
  const editing = entries.find((e) => e.shot.id === editingId)?.shot ?? null;

  const closeEditing = () => {
    if (mode === 'last') onClose();
    else setSelectedId(null);
  };

  if (editing) {
    return (
      <ShotPopup
        key={editing.id}
        title="Edit Shot"
        initialTeam={editing.team}
        initialResult={editing.result}
        initialPlayerNumber={editing.playerNumber}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        trackBlockedShots={config.trackBlockedShots}
        trackScoringChances={config.trackScoringChances}
        trackPlayerNumbers={config.trackPlayerNumbers}
        onConfirm={({ team, result, playerNumber }) => {
          onUpdateShot(editing.id, { team, result, playerNumber: playerNumber || null });
          closeEditing();
        }}
        onDelete={() => {
          onDeleteShot(editing.id);
          closeEditing();
        }}
        onCancel={closeEditing}
        deviceOrientation={deviceOrientation}
        rotated={rotated}
      />
    );
  }

  if (mode === 'last') return null;

  const teamName = (team) => (team === 'home' ? homeTeam : team === 'away' ? awayTeam : 'No team');
  const teamColor = (team) =>
    team === 'home' ? 'text-blue-600' : team === 'away' ? 'text-red-500' : 'text-slate-500';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-full flex flex-col p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-3">Review &amp; Edit Shots</h3>
        <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 mb-4">
          {entries.length === 0 && <li className="py-3 text-sm text-slate-500">No shots recorded.</li>}
          {entries.map(({ shot, period, index }) => (
            <li key={shot.id}>
              <button
                type="button"
                onClick={() => setSelectedId(shot.id)}
                className="w-full py-2.5 flex items-center gap-2 text-left text-sm active:bg-slate-50"
              >
                <span className="w-14 shrink-0 text-xs text-slate-500">
                  {periodLabel(period)} #{index + 1}
                </span>
                <span className={`flex-1 truncate font-semibold ${teamColor(shot.team)}`}>
                  {teamName(shot.team)}
                  {shot.playerNumber ? ` · #${shot.playerNumber}` : ''}
                </span>
                <span className="text-xs text-slate-600">{RESULT_LABELS[shot.result] || 'Shot'}</span>
                <span className="text-xs text-slate-400">{formatTime(shot.timestamp)}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl active:bg-slate-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
