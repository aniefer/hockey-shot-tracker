// Zones are from the home team's perspective: defensive is the home goal to the
// near blue line, offensive is the far blue line to the away goal.
export const ZONES = ['defensive', 'neutral', 'offensive'];
export const NEUTRAL_ZONE = 'neutral';

export const ZONE_LABELS = {
  defensive: 'Defensive',
  neutral: 'Neutral',
  offensive: 'Offensive',
};

// Size of the zone bars and their gap from the ice, in rink units (200 x 85 ice).
export const ZONE_BAND_HEIGHT = 8;
export const ZONE_BAND_GAP = 2;

// Normalized rink x-ranges (0–1) split at the blue lines, matching src/utils/defaultShotTeam.js.
const END_RANGE = [0, 0.375];
const CENTER_RANGE = [0.375, 0.625];
const OTHER_END_RANGE = [0.625, 1];

// Physical x-range of a zone on the displayed rink. The home goal is on the left
// when the rink is not flipped, which places the defensive zone on the left.
export function getZoneXRange(zone, flipped) {
  if (zone === NEUTRAL_ZONE) return [...CENTER_RANGE];
  const defensiveOnLeft = !flipped;
  const isDefensive = zone === 'defensive';
  return [...(isDefensive === defensiveOnLeft ? END_RANGE : OTHER_END_RANGE)];
}

export function getCurrentZone(period) {
  const log = period?.zoneChanges;
  return log?.length ? log[log.length - 1].zone : null;
}

// Returns the period unchanged when the zone is already active.
export function appendZoneChange(period, zone, timestamp) {
  if (getCurrentZone(period) === zone) return period;
  return {
    ...period,
    zoneChanges: [...(period.zoneChanges || []), { zone, timestamp }],
  };
}

// Each segment runs from its timestamp to the next change, or to the period end for
// the last one. Segments without a known end (an open period) are not counted.
export function getPeriodZoneDurations(period) {
  const totals = { defensive: 0, neutral: 0, offensive: 0 };
  const log = period?.zoneChanges || [];

  log.forEach((entry, index) => {
    if (!ZONES.includes(entry.zone)) return;
    const endTime = index + 1 < log.length ? log[index + 1].timestamp : period.endTime;
    if (!endTime) return;
    const duration = Date.parse(endTime) - Date.parse(entry.timestamp);
    if (duration > 0) totals[entry.zone] += duration;
  });

  return totals;
}

export function getGameZoneDurations(game) {
  const totals = { defensive: 0, neutral: 0, offensive: 0, total: 0 };
  (game?.periods || []).forEach((period) => {
    const periodTotals = getPeriodZoneDurations(period);
    ZONES.forEach((zone) => {
      totals[zone] += periodTotals[zone];
      totals.total += periodTotals[zone];
    });
  });
  return totals;
}

export function formatZoneDuration(ms) {
  const totalSeconds = Math.round(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
