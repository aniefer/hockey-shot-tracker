import { useRef, useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { getShotCounts } from '../utils/shotStats';

export default function HomeScreen({
  onNewGame,
  onViewGame,
  onOpenConfig,
  onOpenHelp,
  onCreateReport,
  onExportAll,
  onImportFile,
  onAddTeam,
  config,
}) {
  const { games, deleteGame, refresh } = useStorage();
  const [firstTeamName, setFirstTeamName] = useState('');
  const [teamError, setTeamError] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferMessage, setTransferMessage] = useState('');
  const [conflictDialog, setConflictDialog] = useState(null);
  const fileInputRef = useRef(null);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getShotCount = (game, team) => {
    return game.periods
      .flatMap((p) => p.shots)
      .filter((s) => s.team === team).length;
  };

  const getTotalShots = (game) => {
    return game.periods.flatMap((p) => p.shots).length;
  };

  const getGoals = (game, team) => {
    return game.periods
      .flatMap((p) => p.shots)
      .filter((s) => s.team === team && s.result === 'goal').length;
  };

  const getScoringChances = (game, team) => {
    const counts = getShotCounts(game.periods.flatMap((period) => period.shots));
    return team === 'home' ? counts.homeScoringChances : counts.awayScoringChances;
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this game? This cannot be undone.')) {
      deleteGame(id);
    }
  };

  const handleAddFirstTeam = (event) => {
    event.preventDefault();
    const name = firstTeamName.trim();
    if (!name) {
      setTeamError('Enter a team name.');
      return;
    }
    onAddTeam(name);
    setFirstTeamName('');
    setTeamError('');
  };

  const handleExportAll = async () => {
    setTransferBusy(true);
    setTransferMessage('');
    try {
      await onExportAll();
    } catch (error) {
      setTransferMessage(error instanceof Error ? error.message : 'Could not export game data.');
    } finally {
      setTransferBusy(false);
    }
  };

  const requestConflictChoices = (conflicts) => new Promise((resolve) => {
    setConflictDialog({
      conflicts,
      keepImported: new Set(),
      resolve,
    });
  });

  const toggleConflict = (existingId) => {
    setConflictDialog((dialog) => {
      const keepImported = new Set(dialog.keepImported);
      if (keepImported.has(existingId)) keepImported.delete(existingId);
      else keepImported.add(existingId);
      return { ...dialog, keepImported };
    });
  };

  const setAllConflicts = (keepAll) => {
    setConflictDialog((dialog) => ({
      ...dialog,
      keepImported: new Set(keepAll ? dialog.conflicts.map(({ existing }) => existing.id) : []),
    }));
  };

  const closeConflictDialog = (confirmed) => {
    conflictDialog.resolve(confirmed ? conflictDialog.keepImported : null);
    setConflictDialog(null);
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setTransferBusy(true);
    setTransferMessage('');
    try {
      const result = await onImportFile(file, requestConflictChoices);
      if (!result) {
        setTransferMessage('Import cancelled.');
        return;
      }
      refresh();
      setTransferMessage(
        `Import complete: ${result.added} added, ${result.replaced} replaced, `
        + `${result.unchanged} unchanged, ${result.keptExisting} existing version${result.keptExisting === 1 ? '' : 's'} kept; `
        + `${result.teamsAdded} team${result.teamsAdded === 1 ? '' : 's'} added.`
      );
    } catch (error) {
      setTransferMessage(error instanceof Error ? error.message : 'Could not import this file.');
    } finally {
      event.target.value = '';
      setTransferBusy(false);
    }
  };

  const transferSucceeded = transferMessage.startsWith('Import complete:');
  const formatShotCount = (game) => {
    const shots = game.periods.reduce((total, period) => total + period.shots.length, 0);
    return `${shots} shot${shots === 1 ? '' : 's'}`;
  };

  return (
    <div className="relative min-h-screen max-w-lg mx-auto px-4 py-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".gz,application/gzip"
        onChange={handleImportFile}
        className="hidden"
        aria-label="Import game data"
      />
      {conflictDialog && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 px-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-conflicts-title"
            className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="import-conflicts-title" className="text-xl font-bold text-slate-800">
              Resolve import conflicts
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              These games already exist with different data. Check the ones where you want to
              replace your saved version with the imported one; unchecked games keep your version.
            </p>
            <div className="mt-3 flex gap-4 text-sm font-medium text-blue-600">
              <button type="button" onClick={() => setAllConflicts(true)}>Select all</button>
              <button type="button" onClick={() => setAllConflicts(false)}>Select none</button>
            </div>
            <ul className="mt-3 space-y-2 overflow-y-auto">
              {conflictDialog.conflicts.map(({ existing, incoming }) => (
                <li key={existing.id}>
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                    <input
                      type="checkbox"
                      checked={conflictDialog.keepImported.has(existing.id)}
                      onChange={() => toggleConflict(existing.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="text-sm text-slate-700">
                      <span className="block font-semibold">
                        {existing.homeTeam} vs {existing.awayTeam}
                      </span>
                      <span className="block text-slate-500">{formatDate(existing.date)}</span>
                      <span className="block text-slate-500">
                        Saved: {formatShotCount(existing)} · Imported: {formatShotCount(incoming)}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => closeConflictDialog(false)}
                className="rounded-xl border border-slate-300 py-3 font-semibold text-slate-700"
              >
                Cancel import
              </button>
              <button
                type="button"
                onClick={() => closeConflictDialog(true)}
                className="rounded-xl bg-blue-600 py-3 font-semibold text-white active:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </section>
        </div>
      )}
      {config.teams.length === 0 && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/50 px-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="first-team-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="first-team-title" className="text-xl font-bold text-slate-800">
              Add your first team
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This team will be the default home team for new games.
            </p>
            <form onSubmit={handleAddFirstTeam} className="mt-5">
              <label htmlFor="first-team-name" className="mb-1 block text-sm font-medium text-slate-600">
                Team name
              </label>
              <input
                id="first-team-name"
                type="text"
                value={firstTeamName}
                onChange={(event) => setFirstTeamName(event.target.value)}
                autoFocus
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {teamError && <p className="mt-2 text-sm text-red-600" role="alert">{teamError}</p>}
              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white active:bg-blue-700"
              >
                Add team
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={transferBusy}
                className="mt-3 w-full rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 disabled:opacity-50"
              >
                Import backup
              </button>
              {transferMessage && (
                <p
                  className={`mt-3 text-sm ${transferSucceeded ? 'text-slate-600' : 'text-red-600'}`}
                  role={transferSucceeded ? 'status' : 'alert'}
                >
                  {transferMessage}
                </p>
              )}
            </form>
          </section>
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17h.01" />
            </svg>
            How to use
          </button>
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54A.49.49 0 0 0 13.88 2h-3.84a.49.49 0 0 0-.49.42L9.19 4.96c-.59.23-1.13.54-1.63.94l-2.39-.96a.49.49 0 0 0-.61.22L2.64 8.48a.5.5 0 0 0 .12.64L4.8 10.7c-.04.3-.07.63-.07.95 0 .32.02.64.07.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.12.21.37.29.61.22l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54c.05.24.25.42.49.42h3.84c.24 0 .44-.18.49-.42l.36-2.54c.59-.23 1.13-.54 1.63-.94l2.39.96c.23.09.49-.01.61-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
            </svg>
            Configuration
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Hockey Shot Tracker</h1>
          <p className="text-sm text-slate-500">Track shots on goal during youth hockey games</p>
        </div>
      </div>

      <div className="mb-8 space-y-3">
        <button
          onClick={onNewGame}
          className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-sm active:bg-blue-700 transition-colors"
        >
          New Game
        </button>

        <button
          onClick={onCreateReport}
          disabled={config.teams.length < 2}
          className="w-full py-4 bg-slate-800 text-white text-lg font-semibold rounded-xl shadow-sm active:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Report
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={transferBusy}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-700 active:bg-slate-100 disabled:opacity-50"
          >
            Import backup
          </button>
          <button
            type="button"
            onClick={handleExportAll}
            disabled={transferBusy}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-700 active:bg-slate-100 disabled:opacity-50"
          >
            {transferBusy ? 'Working...' : 'Export all games'}
          </button>
        </div>
        {transferMessage && config.teams.length > 0 && (
          <p
            className={`text-center text-sm ${transferSucceeded ? 'text-slate-600' : 'text-red-600'}`}
            role={transferSucceeded ? 'status' : 'alert'}
          >
            {transferMessage}
          </p>
        )}
        {config.teams.length === 1 && (
          <p className="text-center text-sm text-slate-500">
            Add another team in Configuration to create a report.
          </p>
        )}
      </div>

      {games.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Saved Games
          </h2>
          <div className="space-y-3">
            {games.map((game) => (
              <div
                key={game.id}
                onClick={() => onViewGame(game.id)}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 active:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 truncate">
                        {game.homeTeam} vs {game.awayTeam}
                      </span>
                      {game.status === 'in_progress' && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          In Progress
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">{formatDate(game.date)}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      {game.status === 'completed' ? (
                        <>
                          {game.homeTeam}: {getGoals(game, 'home')}G / {getShotCount(game, 'home')}S
                          {' — '}
                          {game.awayTeam}: {getGoals(game, 'away')}G / {getShotCount(game, 'away')}S
                        </>
                      ) : (
                        <>{getTotalShots(game)} shot{getTotalShots(game) !== 1 ? 's' : ''} recorded</>
                      )}
                    </div>
                    {config.trackScoringChances && (
                      <div className="text-xs text-violet-600 mt-1">
                        Scoring chances: {game.homeTeam} {getScoringChances(game, 'home')} / {game.awayTeam} {getScoringChances(game, 'away')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, game.id)}
                    className="ml-3 p-2 text-slate-400 hover:text-red-500 transition-colors"
                    aria-label="Delete game"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {games.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p>No saved games yet.</p>
          <p className="text-sm mt-1">Tap "New Game" to start tracking.</p>
        </div>
      )}
    </div>
  );
}
