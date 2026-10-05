export default function GameMomentum({ games, homeTeam, awayTeam }) {
  if (games.length === 0) return null;

  const points = [{ homeWins: 0, awayWins: 0 }, ...games];
  const maxWins = Math.max(
    1,
    ...points.map((point) => Math.max(point.homeWins, point.awayWins))
  );
  const chartW = 400;
  const chartH = 150;
  const padX = 34;
  const padY = 16;
  const bottom = chartH - 26;
  const plotW = chartW - padX - 16;
  const plotH = bottom - padY;
  const tickStep = Math.max(1, Math.ceil(maxWins / 5));
  const yTicks = Array.from(
    { length: Math.floor(maxWins / tickStep) + 1 },
    (_, index) => index * tickStep
  );
  if (yTicks[yTicks.length - 1] !== maxWins) yTicks.push(maxWins);
  const toX = (index) => padX + (index / (points.length - 1)) * plotW;
  const toY = (wins) => bottom - (wins / maxWins) * plotH;
  const homePath = points.map((point, index) => (
    `${index === 0 ? 'M' : 'L'} ${toX(index)} ${toY(point.homeWins)}`
  )).join(' ');
  const awayPath = points.map((point, index) => (
    `${index === 0 ? 'M' : 'L'} ${toX(index)} ${toY(point.awayWins)}`
  )).join(' ');

  return (
    <div>
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Cumulative game wins: ${homeTeam} ${games[games.length - 1].homeWins}, ${awayTeam} ${games[games.length - 1].awayWins}`}
      >
        {yTicks.map((wins) => (
          <g key={wins}>
            <line
              x1={padX}
              y1={toY(wins)}
              x2={chartW - 16}
              y2={toY(wins)}
              stroke="#e2e8f0"
              strokeWidth={0.5}
            />
            <text
              x={padX - 5}
              y={toY(wins) + 2}
              textAnchor="end"
              fontSize="7"
              fill="#94a3b8"
            >
              {wins}
            </text>
          </g>
        ))}
        <path d={homePath} fill="none" stroke="#3b82f6" strokeWidth={2} />
        <path d={awayPath} fill="none" stroke="#ef4444" strokeWidth={2} />
        {games.map((game, index) => (
          <g key={game.gameNumber}>
            <circle cx={toX(index + 1)} cy={toY(game.homeWins)} r={3} fill="#3b82f6">
              <title>
                After game {game.gameNumber}: {homeTeam} {game.homeWins} wins, {awayTeam} {game.awayWins} wins
              </title>
            </circle>
            <circle cx={toX(index + 1)} cy={toY(game.awayWins)} r={3} fill="#ef4444">
              <title>
                After game {game.gameNumber}: {homeTeam} {game.homeWins} wins, {awayTeam} {game.awayWins} wins
              </title>
            </circle>
          </g>
        ))}
        <line
          x1={padX}
          y1={bottom}
          x2={chartW - 16}
          y2={bottom}
          stroke="#cbd5e1"
          strokeWidth={0.5}
        />
        <text x={padX} y={chartH - 8} fontSize="7" fill="#94a3b8">Start</text>
        <text x={chartW - 16} y={chartH - 8} textAnchor="end" fontSize="7" fill="#94a3b8">
          {games.length} {games.length === 1 ? 'game' : 'games'}
        </text>
      </svg>

      <div className="flex items-center justify-center gap-4 mt-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          {homeTeam} wins
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          {awayTeam} wins
        </span>
      </div>
    </div>
  );
}
