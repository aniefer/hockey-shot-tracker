export function getPlayedAgainstTeams(teams, games, selectedTeam) {
  if (!selectedTeam) return [];

  return teams.filter((team) => (
    team !== selectedTeam
    && games.some((game) => (
      (game.homeTeam === selectedTeam && game.awayTeam === team)
      || (game.awayTeam === selectedTeam && game.homeTeam === team)
    ))
  ));
}

export function createHeadToHeadReport(games, homeTeam, awayTeam) {
  const matchingGames = games
    .filter((game) => (
      (game.homeTeam === homeTeam && game.awayTeam === awayTeam)
      || (game.homeTeam === awayTeam && game.awayTeam === homeTeam)
    ))
    .sort((a, b) => new Date(a.date) - new Date(b.date) || a.id.localeCompare(b.id));

  const periodsByNumber = new Map();
  const gameMomentum = [];
  let homeWins = 0;
  let awayWins = 0;
  let ties = 0;

  matchingGames.forEach((game) => {
    let homeGoals = 0;
    let awayGoals = 0;
    const reverseRink = game.homeTeam === awayTeam;

    game.periods.forEach((period, periodIndex) => {
      const periodKey = String(period.number);
      if (!periodsByNumber.has(periodKey)) {
        periodsByNumber.set(periodKey, {
          number: period.number,
          shots: [],
          startTime: null,
          endTime: null,
        });
      }

      const aggregatePeriod = periodsByNumber.get(periodKey);
      period.shots.forEach((shot, shotIndex) => {
        const shotId = shot.id === undefined || shot.id === null
          ? `${periodIndex}-${shotIndex}`
          : shot.id;
        const originalTeamName = shot.team === 'home'
          ? game.homeTeam
          : shot.team === 'away'
            ? game.awayTeam
            : null;
        const reportTeam = originalTeamName === homeTeam
          ? 'home'
          : originalTeamName === awayTeam
            ? 'away'
            : null;

        if (reportTeam === 'home' && shot.result === 'goal') homeGoals++;
        if (reportTeam === 'away' && shot.result === 'goal') awayGoals++;

        aggregatePeriod.shots.push({
          ...shot,
          id: `${game.id}-${shotId}`,
          team: reportTeam,
          x: reverseRink && typeof shot.x === 'number' ? 1 - shot.x : shot.x,
        });
      });
    });

    if (game.status === 'completed') {
      if (homeGoals > awayGoals) homeWins++;
      else if (awayGoals > homeGoals) awayWins++;
      else ties++;

      gameMomentum.push({
        gameNumber: gameMomentum.length + 1,
        date: game.date,
        homeScore: homeGoals,
        awayScore: awayGoals,
        homeWins,
        awayWins,
      });
    }
  });

  const periods = [...periodsByNumber.values()].sort((a, b) => {
    const aNumber = Number(a.number);
    const bNumber = Number(b.number);
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
    if (a.number === 'OT') return 1;
    if (b.number === 'OT') return -1;
    return String(a.number).localeCompare(String(b.number));
  });
  const firstGame = matchingGames[0];
  const lastGame = matchingGames[matchingGames.length - 1];
  const firstDate = firstGame ? firstGame.date : null;
  const lastDate = lastGame ? lastGame.date : null;
  const totalGames = matchingGames.filter((game) => game.status === 'completed').length;

  return {
    game: {
      id: `head-to-head-${homeTeam}-${awayTeam}`,
      date: lastDate || new Date().toISOString(),
      homeTeam,
      awayTeam,
      periods,
      status: 'completed',
    },
    totalGames,
    includedGames: matchingGames.length,
    homeWins,
    awayWins,
    ties,
    gameMomentum,
    firstDate,
    lastDate,
  };
}
