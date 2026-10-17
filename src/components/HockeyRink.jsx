import { normalizeRinkCoordinates } from '../utils/defaultShotTeam';

/* Hockey rink SVG — whiteboard / dry-erase style.
   Proportions based on NHL regulation: 200 ft x 85 ft.
   Rink geometry uses a 200 x 85 coordinate system for easy math. */

const RINK_LENGTH = 200;
const RINK_WIDTH = 85;
const CORNER_RADIUS = 28;
const FACE_OFF_CIRCLE_RADIUS = 15;
const CENTER_ICE_X = RINK_LENGTH / 2;
const CENTER_ICE_Y = RINK_WIDTH / 2;
const GOAL_LINE_OFFSET = 11;
const BLUE_LINE_OFFSET_FROM_GOAL = 64;
const BLUE_LINE_OFFSET = GOAL_LINE_OFFSET + BLUE_LINE_OFFSET_FROM_GOAL;
const END_FACE_OFF_X = GOAL_LINE_OFFSET + 20;
const FACE_OFF_Y_OFFSET = 22;

export default function HockeyRink({ onTapRink, children, orientation = 'landscape', maximized = false }) {
  const isPortrait = orientation === 'portrait';

  const reportTap = (clientX, clientY, svg) => {
    if (!onTapRink) return;
    const rect = svg.getBoundingClientRect();
    const screenX = (clientX - rect.left) / rect.width;
    const screenY = (clientY - rect.top) / rect.height;
    const { x, y } = normalizeRinkCoordinates(screenX, screenY, orientation);
    onTapRink(x, y);
  };

  const handleClick = (e) => {
    reportTap(e.clientX, e.clientY, e.currentTarget);
  };

  const handleTouch = (e) => {
    if (!onTapRink) return;
    e.preventDefault();
    const touch = e.touches[0];
    reportTap(touch.clientX, touch.clientY, e.currentTarget);
  };

  return (
    <svg
      viewBox={isPortrait ? `0 0 ${RINK_WIDTH} ${RINK_LENGTH}` : `0 0 ${RINK_LENGTH} ${RINK_WIDTH}`}
      className="w-full h-auto select-none"
      style={{
        touchAction: 'none',
        maxHeight: maximized ? '100%' : '60vh',
        ...(isPortrait && {
          width: 'auto',
          height: maximized ? '100%' : '60vh',
          maxWidth: '100%',
        }),
      }}
      onClick={handleClick}
      onTouchStart={handleTouch}
    >
      <g transform={isPortrait ? 'matrix(0 1 -1 0 85 0)' : undefined}>
        <defs>
          <clipPath id="rink-clip">
            <rect x="0" y="0" width={RINK_LENGTH} height={RINK_WIDTH} rx={CORNER_RADIUS} ry={CORNER_RADIUS} />
          </clipPath>
        </defs>

        {/* Ice surface */}
        <rect x="0" y="0" width={RINK_LENGTH} height={RINK_WIDTH} rx={CORNER_RADIUS} ry={CORNER_RADIUS} fill="white" stroke="#94a3b8" strokeWidth="0.8" />

        <g clipPath="url(#rink-clip)">
          {/* Center red line */}
          <line x1={CENTER_ICE_X} y1="0" x2={CENTER_ICE_X} y2={RINK_WIDTH} stroke="#ef4444" strokeWidth="0.8" />

          {/* Blue lines */}
          <line x1={BLUE_LINE_OFFSET} y1="0" x2={BLUE_LINE_OFFSET} y2={RINK_WIDTH} stroke="#3b82f6" strokeWidth="0.8" />
          <line x1={RINK_LENGTH - BLUE_LINE_OFFSET} y1="0" x2={RINK_LENGTH - BLUE_LINE_OFFSET} y2={RINK_WIDTH} stroke="#3b82f6" strokeWidth="0.8" />

          {/* Goal lines */}
          <line x1={GOAL_LINE_OFFSET} y1="0" x2={GOAL_LINE_OFFSET} y2={RINK_WIDTH} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1 1" />
          <line x1={RINK_LENGTH - GOAL_LINE_OFFSET} y1="0" x2={RINK_LENGTH - GOAL_LINE_OFFSET} y2={RINK_WIDTH} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1 1" />

          {/* Center circle */}
          <circle cx={CENTER_ICE_X} cy={CENTER_ICE_Y} r={FACE_OFF_CIRCLE_RADIUS} fill="none" stroke="#3b82f6" strokeWidth="0.5" />
          <circle cx={CENTER_ICE_X} cy={CENTER_ICE_Y} r="0.8" fill="#3b82f6" />

          {/* Face-off dots — neutral zone */}
          <circle cx="80" cy="20.5" r="0.8" fill="#ef4444" />
          <circle cx="80" cy="64.5" r="0.8" fill="#ef4444" />
          <circle cx="120" cy="20.5" r="0.8" fill="#ef4444" />
          <circle cx="120" cy="64.5" r="0.8" fill="#ef4444" />

          {/* Face-off circles — left zone */}
          <circle cx={END_FACE_OFF_X} cy={CENTER_ICE_Y - FACE_OFF_Y_OFFSET} r={FACE_OFF_CIRCLE_RADIUS} fill="none" stroke="#ef4444" strokeWidth="0.4" />
          <circle cx={END_FACE_OFF_X} cy={CENTER_ICE_Y - FACE_OFF_Y_OFFSET} r="0.8" fill="#ef4444" />
          <circle cx={END_FACE_OFF_X} cy={CENTER_ICE_Y + FACE_OFF_Y_OFFSET} r={FACE_OFF_CIRCLE_RADIUS} fill="none" stroke="#ef4444" strokeWidth="0.4" />
          <circle cx={END_FACE_OFF_X} cy={CENTER_ICE_Y + FACE_OFF_Y_OFFSET} r="0.8" fill="#ef4444" />

          {/* Face-off circles — right zone */}
          <circle cx={RINK_LENGTH - END_FACE_OFF_X} cy={CENTER_ICE_Y - FACE_OFF_Y_OFFSET} r={FACE_OFF_CIRCLE_RADIUS} fill="none" stroke="#ef4444" strokeWidth="0.4" />
          <circle cx={RINK_LENGTH - END_FACE_OFF_X} cy={CENTER_ICE_Y - FACE_OFF_Y_OFFSET} r="0.8" fill="#ef4444" />
          <circle cx={RINK_LENGTH - END_FACE_OFF_X} cy={CENTER_ICE_Y + FACE_OFF_Y_OFFSET} r={FACE_OFF_CIRCLE_RADIUS} fill="none" stroke="#ef4444" strokeWidth="0.4" />
          <circle cx={RINK_LENGTH - END_FACE_OFF_X} cy={CENTER_ICE_Y + FACE_OFF_Y_OFFSET} r="0.8" fill="#ef4444" />

          {/* Goalie creases — left */}
          <path
            d="M 11 38.5 L 15 38.5 A 4 4 0 0 1 15 46.5 L 11 46.5"
            fill="rgba(59,130,246,0.08)"
            stroke="#3b82f6"
            strokeWidth="0.4"
          />

          {/* Goalie creases — right */}
          <path
            d="M 189 38.5 L 185 38.5 A 4 4 0 0 0 185 46.5 L 189 46.5"
            fill="rgba(59,130,246,0.08)"
            stroke="#3b82f6"
            strokeWidth="0.4"
          />

          {/* Goals — left (simple rectangles behind goal line) */}
          <rect x="7" y="39.5" width="4" height="6" rx="0.5" fill="none" stroke="#94a3b8" strokeWidth="0.5" />

          {/* Goals — right */}
          <rect x="189" y="39.5" width="4" height="6" rx="0.5" fill="none" stroke="#94a3b8" strokeWidth="0.5" />

          {/* Overlay children (shot markers, etc.) */}
          {children}
        </g>
      </g>
    </svg>
  );
}
