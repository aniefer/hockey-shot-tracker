import { useState } from 'react';

const NEW_TEAM = 'new-team-option';
const TEAM_OPTION_PREFIX = 'team:';

export default function NewGameSetup({
  teams,
  defaultTeam,
  onCreateTeam,
  onStart,
  onBack,
}) {
  const now = new Date();
  now.setMinutes(Math.round(now.getMinutes() / 15) * 15, 0, 0);
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [homeTeam, setHomeTeam] = useState(
    defaultTeam ? `${TEAM_OPTION_PREFIX}${defaultTeam}` : ''
  );
  const [awayTeam, setAwayTeam] = useState('');
  const [newHomeTeam, setNewHomeTeam] = useState('');
  const [newAwayTeam, setNewAwayTeam] = useState('');
  const [date, setDate] = useState(dateStr);
  const [time, setTime] = useState(timeStr);
  const [teamError, setTeamError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const proposedHomeTeam = homeTeam === NEW_TEAM
      ? newHomeTeam.trim()
      : homeTeam.startsWith(TEAM_OPTION_PREFIX)
        ? homeTeam.slice(TEAM_OPTION_PREFIX.length)
        : '';
    const proposedAwayTeam = awayTeam === NEW_TEAM
      ? newAwayTeam.trim()
      : awayTeam.startsWith(TEAM_OPTION_PREFIX)
        ? awayTeam.slice(TEAM_OPTION_PREFIX.length)
        : '';
    if (!proposedHomeTeam || !proposedAwayTeam) {
      setTeamError('Choose or enter both teams.');
      return;
    }
    if (proposedHomeTeam.toLowerCase() === proposedAwayTeam.toLowerCase()) {
      setTeamError('Home and away teams must be different.');
      return;
    }

    const resolvedHomeTeam = homeTeam === NEW_TEAM
      ? onCreateTeam(proposedHomeTeam)
      : proposedHomeTeam;
    const resolvedAwayTeam = awayTeam === NEW_TEAM
      ? onCreateTeam(proposedAwayTeam)
      : proposedAwayTeam;
    if (!resolvedHomeTeam || !resolvedAwayTeam) {
      setTeamError('Enter a valid name for both teams.');
      return;
    }

    const dateTime = new Date(`${date}T${time}`).toISOString();
    onStart(resolvedHomeTeam, resolvedAwayTeam, dateTime);
  };

  const flipTeams = () => {
    setHomeTeam(awayTeam);
    setAwayTeam(homeTeam);
    setNewHomeTeam(newAwayTeam);
    setNewAwayTeam(newHomeTeam);
    setTeamError('');
  };

  const renderTeamOptions = () => (
    <>
      <option value="">Select a team</option>
      {teams.map((team) => (
        <option key={team} value={`${TEAM_OPTION_PREFIX}${team}`}>{team}</option>
      ))}
      <option value={NEW_TEAM}>Add a new team...</option>
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

      <h1 className="text-2xl font-bold text-slate-800 mb-6">New Game</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="home-team" className="block text-sm font-medium text-slate-600 mb-1">
            Home Team
          </label>
          <select
            id="home-team"
            value={homeTeam}
            onChange={(e) => {
              setHomeTeam(e.target.value);
              setTeamError('');
            }}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {renderTeamOptions()}
          </select>
          {homeTeam === NEW_TEAM && (
            <input
              aria-label="New home team name"
              type="text"
              value={newHomeTeam}
              onChange={(e) => {
                setNewHomeTeam(e.target.value);
                setTeamError('');
              }}
              placeholder="Enter new home team name"
              required
              className="mt-2 w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          )}
        </div>

        <div>
          <label htmlFor="away-team" className="block text-sm font-medium text-slate-600 mb-1">
            Away Team
          </label>
          <select
            id="away-team"
            value={awayTeam}
            onChange={(e) => {
              setAwayTeam(e.target.value);
              setTeamError('');
            }}
            required
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {renderTeamOptions()}
          </select>
          {awayTeam === NEW_TEAM && (
            <input
              aria-label="New away team name"
              type="text"
              value={newAwayTeam}
              onChange={(e) => {
                setNewAwayTeam(e.target.value);
                setTeamError('');
              }}
              placeholder="Enter new away team name"
              required
              className="mt-2 w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          )}
        </div>

        <button
          type="button"
          onClick={flipTeams}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 active:text-blue-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h14m0 0-3-3m3 3-3 3M17 17H3m0 0 3 3m-3-3 3-3" />
          </svg>
          Flip home and away
        </button>
        {teamError && <p className="text-sm text-red-600" role="alert">{teamError}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-sm active:bg-blue-700 transition-colors mt-4"
        >
          Start Game
        </button>
      </form>
    </div>
  );
}
