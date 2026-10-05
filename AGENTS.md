# Repository instructions

## Project overview

- This is a client-side hockey shot tracker built with React, Vite, and Tailwind CSS.
- It is a static GitHub Pages app with no backend. Games and preferences are stored in browser `localStorage`.
- Use Node.js 20, matching the GitHub Actions workflow.

## Architecture and data

- `src/App.jsx` owns screen navigation and loads application configuration.
- UI screens and report components live in `src/components/`; shared state hooks live in `src/hooks/`; reusable logic and browser-storage helpers live in `src/utils/`.
- `useGameState` manages the current game and its periods. A game stores team names, date, status, and periods; each period stores shots and its start/end times. Each shot stores normalized rink coordinates, team, result, timestamp, and optional player number.
- Teams are configured as names in `config.teams`, with `config.defaultTeam` identifying the initial home-team choice. Saved games associate teams by their `homeTeam` and `awayTeam` names; preserve that name-based relationship in setup, summaries, and reports.
- `src/utils/headToHeadReport.js` selects opponents from saved matchups and aggregates shots across matching games. Include shots from saved in-progress games, but only completed games count toward wins and game momentum.
- `src/utils/rinkOrientation.js` defines the period-2 rink flip used by gameplay and full-game shot maps/density. Overtime currently uses the unflipped orientation.
- Rink coordinates are canonical landscape coordinates in the 0–1 range. Reuse `src/utils/defaultShotTeam.js` when handling portrait coordinate conversion or default team selection.
- Shot results are `goal`, `blocked`, `scoring_chance`, or `null` for a regular shot. Every recorded result counts toward total shots; keep totals consistent when changing result-specific statistics.
- `src/utils/storage.js` owns the separate local-storage keys and configuration defaults/normalization. Preserve existing game data and settings when changing storage behavior.
- PDF export is handled by `src/utils/pdfExport.js`; report DOM is rendered by the report components.

## Development and tests

- Start the local app with `npm run dev`.
- Run tests with `npm test`; run a production build with `npm run build`; run ESLint with `npm run lint`.
- Keep all tests under `tests/` and use the existing Vitest setup. Add or update focused tests for changed behavior, especially team configuration and opponent selection, rink orientation, shot totals, head-to-head aggregation, and config-dependent reporting.
- CI runs tests and a production build on Node 20 before deploying to GitHub Pages.
- Do not edit generated `dist/` output or dependencies under `node_modules/`.

## Change guidelines

- Follow existing React/JSX and Tailwind utility-class patterns; avoid introducing new libraries for functionality already supported by the project.
- Keep shot entry, live counts, saved-game summaries, visualizations, and PDF reports consistent when changing tracking options or shot-result behavior.
- Preserve current behavior through configuration defaults unless a requested change explicitly says otherwise. Keep browser-only data local; do not add network persistence.
- Update the README when user-facing behavior or setup instructions change.
- Prefer targeted changes and validation. The repository has some known ESLint findings in existing components; avoid unrelated cleanup and distinguish pre-existing findings from regressions.
