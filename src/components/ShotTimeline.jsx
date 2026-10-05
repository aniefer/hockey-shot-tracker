export default function ShotTimeline({ periods, homeTeam, awayTeam }) {
  const events = [];
  let homeTotal = 0;
  let awayTotal = 0;

  periods.forEach((period) => {
    const sorted = [...period.shots].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    sorted.forEach((shot) => {
      if (shot.team === 'home') homeTotal++;
      else if (shot.team === 'away') awayTotal++;
      events.push({
        home: homeTotal,
        away: awayTotal,
        period: period.number,
        isGoal: shot.result === 'goal',
        team: shot.team,
      });
    });
  });

  if (events.length === 0) return null;

  const maxShots = Math.max(homeTotal, awayTotal, 1);
  const chartW = 400;
  const chartH = 120;
  const padX = 32;
  const padY = 16;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const toX = (i) => padX + (i / Math.max(events.length - 1, 1)) * plotW;
  const toYHome = (v) => padY + plotH - (v / maxShots) * plotH;
  const toYAway = (v) => padY + plotH - (v / maxShots) * plotH;

  let homePath = `M ${toX(0)} ${toYHome(events[0].home)}`;
  let awayPath = `M ${toX(0)} ${toYAway(events[0].away)}`;
  events.forEach((event, index) => {
    if (index === 0) return;
    homePath += ` L ${toX(index)} ${toYHome(event.home)}`;
    awayPath += ` L ${toX(index)} ${toYAway(event.away)}`;
  });

  const periodDividers = [];
  let shotIndex = 0;
  periods.forEach((period, periodIndex) => {
    shotIndex += period.shots.length;
    if (periodIndex < periods.length - 1 && shotIndex > 0 && shotIndex < events.length) {
      periodDividers.push({ x: toX(shotIndex - 0.5), label: period.number });
    }
  });

  const yTicks = [];
  const step = maxShots <= 5 ? 1 : maxShots <= 15 ? 5 : 10;
  for (let value = 0; value <= maxShots; value += step) yTicks.push(value);
  if (!yTicks.includes(maxShots)) yTicks.push(maxShots);

  const goalMarkers = events
    .map((event, index) => ({ ...event, index }))
    .filter((event) => event.isGoal && event.team);

  return (
    <div>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
        {yTicks.map((value) => (
          <g key={value}>
            <line
              x1={padX} y1={toYHome(value)} x2={chartW - padX} y2={toYHome(value)}
              stroke="#e2e8f0" strokeWidth={0.5}
            />
            <text x={padX - 4} y={toYHome(value) + 1.5} textAnchor="end" fontSize="6" fill="#94a3b8">
              {value}
            </text>
          </g>
        ))}

        {periodDividers.map((divider) => (
          <g key={divider.label}>
            <line
              x1={divider.x} y1={padY} x2={divider.x} y2={chartH - padY}
              stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="2 2"
            />
          </g>
        ))}

        <path d={homePath} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
        <path d={awayPath} fill="none" stroke="#ef4444" strokeWidth={1.5} />

        {goalMarkers.map((goal) => {
          const x = toX(goal.index);
          const y = goal.team === 'home' ? toYHome(goal.home) : toYAway(goal.away);
          const color = goal.team === 'home' ? '#3b82f6' : '#ef4444';
          return (
            <circle
              key={goal.index}
              cx={x}
              cy={y}
              r={2.5}
              fill={color}
              stroke="white"
              strokeWidth={0.8}
            />
          );
        })}

        <line
          x1={padX} y1={chartH - padY} x2={chartW - padX} y2={chartH - padY}
          stroke="#cbd5e1" strokeWidth={0.5}
        />
      </svg>

      <div className="flex items-center justify-center gap-4 mt-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10">
            <line x1="0" y1="5" x2="10" y2="5" stroke="#3b82f6" strokeWidth="2" />
          </svg>
          {homeTeam}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10">
            <line x1="0" y1="5" x2="10" y2="5" stroke="#ef4444" strokeWidth="2" />
          </svg>
          {awayTeam}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-2.5 h-2.5" viewBox="0 0 10 10">
            <circle cx="5" cy="5" r="4" fill="#64748b" />
          </svg>
          Goal scored
        </span>
      </div>
    </div>
  );
}
