import { ZONES, ZONE_LABELS, formatZoneDuration, getPeriodZoneDurations } from '../utils/zoneTime';

const ZONE_COLORS = {
  defensive: '#2563eb',
  neutral: '#cbd5e1',
  offensive: '#059669',
};

// Neutral's percentage is only shown when it is large enough to fit.
const MIN_NEUTRAL_PERCENT_TO_SHOW = 5;
const TEXT_COLORS = {
  defensive: 'text-white',
  neutral: 'text-slate-700',
  offensive: 'text-white',
};

export default function ZoneTimeChart({ periods }) {
  const rows = (periods || []).map((period) => {
    const durations = getPeriodZoneDurations(period);
    const total = ZONES.reduce((sum, zone) => sum + durations[zone], 0);
    return { key: period.number, label: `P${period.number}`, durations, total };
  });
  const gameTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
        {ZONES.map((zone) => (
          <span key={zone} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: ZONE_COLORS[zone] }} />
            {ZONE_LABELS[zone]}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center gap-2 text-xs">
            <span className="w-8 text-right text-slate-500 font-semibold shrink-0">{row.label}</span>
            <div className="flex-1 flex h-7 rounded-md overflow-hidden bg-slate-100">
              {ZONES.map((zone) => {
                const share = row.total > 0 ? (row.durations[zone] / row.total) * 100 : 0;
                const showPercent = zone === 'neutral' ? share > MIN_NEUTRAL_PERCENT_TO_SHOW : share > 0;
                return (
                  <div
                    key={zone}
                    className={`h-full flex items-center justify-center font-semibold overflow-hidden whitespace-nowrap ${TEXT_COLORS[zone]}`}
                    style={{ width: `${share}%`, backgroundColor: ZONE_COLORS[zone] }}
                  >
                    {showPercent && `${Math.round(share)}%`}
                  </div>
                );
              })}
            </div>
            <span className="w-12 text-slate-600 font-semibold whitespace-nowrap text-right shrink-0">
              {formatZoneDuration(row.total)}
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-400 mt-2">
        {formatZoneDuration(gameTotal)} tracked. Percentages are of each period's tracked time. Zones are from the home team's perspective.
      </div>
    </div>
  );
}
