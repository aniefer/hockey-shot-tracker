import { getShotOutcomeCounts } from '../utils/shotStats';

const outcomes = [
  { key: 'goals', label: 'Goals', color: '#10b981' },
  { key: 'blocked', label: 'Blocked shots', color: '#f59e0b' },
  { key: 'scoringChances', label: 'Scoring chances', color: '#8b5cf6' },
  { key: 'regularShots', label: 'Regular shots', color: '#94a3b8' },
];

function slicePath(startAngle, endAngle) {
  const toRadians = (angle) => (angle * Math.PI) / 180;
  const startX = 50 + 50 * Math.cos(toRadians(startAngle));
  const startY = 50 + 50 * Math.sin(toRadians(startAngle));
  const endX = 50 + 50 * Math.cos(toRadians(endAngle));
  const endY = 50 + 50 * Math.sin(toRadians(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

export default function ShotOutcomePie({
  teamName,
  shots,
  trackBlockedShots = true,
  trackScoringChances = true,
}) {
  const counts = getShotOutcomeCounts(shots, { trackBlockedShots, trackScoringChances });
  const total = shots.length;
  const visibleOutcomes = outcomes.filter(
    (outcome) =>
      (outcome.key !== 'blocked' || trackBlockedShots) &&
      (outcome.key !== 'scoringChances' || trackScoringChances)
  );
  let currentAngle = -90;
  const slices = visibleOutcomes
    .filter((outcome) => counts[outcome.key] > 0)
    .map((outcome) => {
      const value = counts[outcome.key];
      const startAngle = currentAngle;
      currentAngle += (value / total) * 360;
      return {
        ...outcome,
        value,
        path: value === total ? null : slicePath(startAngle, currentAngle),
      };
    });
  const chartLabel = `${teamName} shot outcomes: ${visibleOutcomes
    .map((outcome) => `${counts[outcome.key]} ${outcome.label.toLowerCase()}`)
    .join(', ')}`;

  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{teamName}</h3>
      <div className="flex items-center gap-4">
        <svg
          viewBox="0 0 100 100"
          className="w-28 h-28 shrink-0"
          role="img"
          aria-label={chartLabel}
        >
          {total === 0 ? (
            <>
              <circle cx="50" cy="50" r="50" fill="#e2e8f0" />
              <text x="50" y="52" textAnchor="middle" fontSize="10" fill="#64748b">
                No shots
              </text>
            </>
          ) : (
            slices.map((slice) =>
              slice.path ? (
                <path key={slice.key} d={slice.path} fill={slice.color} />
              ) : (
                <circle key={slice.key} cx="50" cy="50" r="50" fill={slice.color} />
              )
            )
          )}
        </svg>
        <div className="flex-1 space-y-2 text-xs">
          {visibleOutcomes.map((outcome) => {
            const count = counts[outcome.key];
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={outcome.key} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: outcome.color }}
                />
                <span className="flex-1 text-slate-600">{outcome.label}</span>
                <span className="text-slate-700 font-semibold whitespace-nowrap">
                  {count} ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
