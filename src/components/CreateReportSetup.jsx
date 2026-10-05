import { useState } from 'react';
import { getPlayedAgainstTeams } from '../utils/headToHeadReport';

const TEAM_OPTION_PREFIX = 'team:';

export default function CreateReportSetup({
  teams,
  games,
  defaultTeam,
  onCreateReport,
  onBack,
}) {
  const [homeTeam, setHomeTeam] = useState(
    defaultTeam ? `${TEAM_OPTION_PREFIX}${defaultTeam}` : ''
  );
  const [awayTeam, setAwayTeam] = useState('');
  const [error, setError] = useState('');

  const selectedHomeTeam = homeTeam.startsWith(TEAM_OPTION_PREFIX)
    ? homeTeam.slice(TEAM_OPTION_PREFIX.length)
    : '';
  const availableAwayTeams = getPlayedAgainstTeams(teams, games, selectedHomeTeam);

  const handleSubmit = (event) => {
    event.preventDefault();
    const reportHomeTeam = selectedHomeTeam;
    const reportAwayTeam = awayTeam.startsWith(TEAM_OPTION_PREFIX)
      ? awayTeam.slice(TEAM_OPTION_PREFIX.length)
      : '';

    if (!reportHomeTeam || !reportAwayTeam) {
      setError('Choose both teams.');
      return;
    }
    if (reportHomeTeam.toLowerCase() === reportAwayTeam.toLowerCase()) {
      setError('Choose two different teams.');
      return;
    }

    if (!onCreateReport(reportHomeTeam, reportAwayTeam)) {
      setError('No saved games were found between these teams.');
    }
  };

  const teamOptions = (
    <>
      <option value="">Select a team</option>
      {teams.map((team) => (
        <option key={team} value={`${TEAM_OPTION_PREFIX}${team}`}>{team}</option>
      ))}
    </>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-blue-600 font-medium mb-6 active:text-blue-800"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-2xl font-bold text-slate-800 mb-2">Create Report</h1>
      <p className="text-sm text-slate-500 mb-6">
        The report includes all saved games between the teams. Win totals count completed games only.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="report-home-team" className="block text-sm font-medium text-slate-600 mb-1">
            First Team
          </label>
          <select
            id="report-home-team"
            value={homeTeam}
            onChange={(event) => {
              setHomeTeam(event.target.value);
              setAwayTeam('');
              setError('');
            }}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {teamOptions}
          </select>
        </div>

        {selectedHomeTeam && availableAwayTeams.length === 0 && (
          <p className="text-sm text-slate-500">
            No games have been recorded against {selectedHomeTeam}.
          </p>
        )}

        <div>
          <label htmlFor="report-away-team" className="block text-sm font-medium text-slate-600 mb-1">
            Second Team
          </label>
          <select
            id="report-away-team"
            value={awayTeam}
            onChange={(event) => {
              setAwayTeam(event.target.value);
              setError('');
            }}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <>
              <option value="">Select a team</option>
              {availableAwayTeams.map((team) => (
                <option key={team} value={`${TEAM_OPTION_PREFIX}${team}`}>{team}</option>
              ))}
            </>
          </select>
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        <button
          type="submit"
          className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-sm active:bg-blue-700 transition-colors mt-4"
        >
          Create Report
        </button>
      </form>
    </div>
  );
}
