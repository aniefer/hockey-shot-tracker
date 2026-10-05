import HockeyRink from './HockeyRink';

export default function ShotMap({
  shots,
  homeTeam,
  awayTeam,
  trackBlockedShots = true,
  trackScoringChances = true,
}) {
  const openShotLabel = trackBlockedShots ? 'blocked / regular shots' : 'regular shots';

  return (
    <div>
      <HockeyRink>
        {shots.map((shot) => {
          const cx = shot.x * 200;
          const cy = shot.y * 85;
          const isGoal = shot.result === 'goal';
          const isScoringChance = trackScoringChances && shot.result === 'scoring_chance';
          const isHome = shot.team === 'home';
          const isAway = shot.team === 'away';
          const color = isHome ? '#3b82f6' : isAway ? '#ef4444' : '#94a3b8';

          return (
            <g key={shot.id}>
              {isScoringChance ? (
                <polygon
                  points={`${cx},${cy - 2} ${cx + 2},${cy} ${cx},${cy + 2} ${cx - 2},${cy}`}
                  fill="white"
                  stroke={color}
                  strokeWidth={0.7}
                  opacity={0.85}
                />
              ) : isGoal ? (
                <circle cx={cx} cy={cy} r={2} fill={color} opacity={0.85} />
              ) : (
                <circle cx={cx} cy={cy} r={1.5} fill="none" stroke={color} strokeWidth={0.5} opacity={0.85} />
              )}
              {shot.playerNumber && (
                <text
                  x={cx}
                  y={cy - 3}
                  textAnchor="middle"
                  fontSize="2.2"
                  fill={color}
                  fontWeight="600"
                >
                  {shot.playerNumber}
                </text>
              )}
            </g>
          );
        })}
      </HockeyRink>

      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#3b82f6" /></svg>
          {homeTeam} goal
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3.5" fill="none" stroke="#3b82f6" strokeWidth="1" /></svg>
          {homeTeam} {openShotLabel}
        </span>
        {trackScoringChances && (
          <span className="flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10"><polygon points="5,1 9,5 5,9 1,5" fill="white" stroke="#3b82f6" strokeWidth="1" /></svg>
            {homeTeam} scoring chance
          </span>
        )}
        <span className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#ef4444" /></svg>
          {awayTeam} goal
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10"><circle cx="5" cy="5" r="3.5" fill="none" stroke="#ef4444" strokeWidth="1" /></svg>
          {awayTeam} {openShotLabel}
        </span>
        {trackScoringChances && (
          <span className="flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10"><polygon points="5,1 9,5 5,9 1,5" fill="white" stroke="#ef4444" strokeWidth="1" /></svg>
            {awayTeam} scoring chance
          </span>
        )}
      </div>
    </div>
  );
}
