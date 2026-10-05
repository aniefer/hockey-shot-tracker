export function getShotCounts(shots) {
  const homeShots = shots.filter((shot) => shot.team === 'home');
  const awayShots = shots.filter((shot) => shot.team === 'away');

  return {
    home: homeShots.length,
    away: awayShots.length,
    total: shots.length,
    homeScoringChances: homeShots.filter((shot) => shot.result === 'scoring_chance').length,
    awayScoringChances: awayShots.filter((shot) => shot.result === 'scoring_chance').length,
  };
}

export function getShotOutcomeCounts(shots) {
  return shots.reduce(
    (counts, shot) => {
      if (shot.result === 'goal') counts.goals++;
      else if (shot.result === 'blocked') counts.blocked++;
      else if (shot.result === 'scoring_chance') counts.scoringChances++;
      else counts.regularShots++;
      return counts;
    },
    { goals: 0, blocked: 0, scoringChances: 0, regularShots: 0 }
  );
}
