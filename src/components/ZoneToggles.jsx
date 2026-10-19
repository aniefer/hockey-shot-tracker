import { ZONES, ZONE_BAND_GAP, ZONE_BAND_HEIGHT, ZONE_LABELS, getZoneXRange } from '../utils/zoneTime';

const RINK_LENGTH = 200;
const RINK_WIDTH = 85;

// Drawn outside the ice, along its top long edge (the right edge in portrait).
export default function ZoneToggles({ activeZone, flipped, orientation, onSelect }) {
  const isPortrait = orientation === 'portrait';

  return (
    <g>
      {ZONES.map((zone) => {
        const [startX, endX] = getZoneXRange(zone, flipped);
        const along = startX * RINK_LENGTH;
        const length = (endX - startX) * RINK_LENGTH;
        const across = isPortrait ? RINK_WIDTH + ZONE_BAND_GAP : -(ZONE_BAND_GAP + ZONE_BAND_HEIGHT);
        const rect = isPortrait
          ? { x: across, y: along, width: ZONE_BAND_HEIGHT, height: length }
          : { x: along, y: across, width: length, height: ZONE_BAND_HEIGHT };
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        const isActive = zone === activeZone;

        return (
          <g
            key={zone}
            role="radio"
            aria-checked={isActive}
            aria-label={`${ZONE_LABELS[zone]} zone`}
            className={onSelect ? 'cursor-pointer' : undefined}
            onClick={(event) => {
              // Stop propagation so the rink's tap handler does not record a shot.
              event.stopPropagation();
              if (onSelect && !isActive) onSelect(zone);
            }}
            onTouchStart={(event) => event.stopPropagation()}
          >
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={isActive ? '#2563eb' : 'rgba(148,163,184,0.12)'}
              stroke="#94a3b8"
              strokeWidth="0.4"
            />
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              dominantBaseline="central"
              transform={isPortrait ? `rotate(90 ${centerX} ${centerY})` : undefined}
              fill={isActive ? '#ffffff' : '#64748b'}
              fontSize="3.6"
              fontWeight={isActive ? '700' : '500'}
            >
              {ZONE_LABELS[zone]}
            </text>
          </g>
        );
      })}
    </g>
  );
}
