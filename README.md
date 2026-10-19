# Hockey Shot Tracker

A free, simple app for tracking shots on goal during hockey games. Built for coaches and parents who want to turn game data into teachable moments.

**Use it now:** [dvelton.github.io/hockey-shot-tracker](https://dvelton.github.io/hockey-shot-tracker/)

No downloads, no accounts, no fees. Open the link on your phone, tablet, or computer and start tracking.

---

## What It Does

Hockey Shot Tracker lets you record every shot on goal as it happens during a game, capturing where on the ice each shot came from. Review individual games or create a head-to-head report that combines games between two teams, with shot maps, heatmaps, win records, and player breakdowns.

## How It Works

### 1. Set up teams and start a game

On first launch, add a team name; it becomes the default home team. Manage teams and choose a different default in Configuration. To start a game, tap "New Game," choose home and away teams, or add a new team from the setup screen. Use "Flip home and away" to swap the selections. Choose which side of the rink the home team's goal is on (left or right). The date and time fill in automatically. Optionally check "Track time in zone" to record time spent in the defensive, neutral, and offensive zones.

<p align="center">
  <img src="docs/screenshots/home-screen.png" alt="Home screen with saved games" width="300" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/screenshots/new-game.png" alt="New game setup" width="300" />
</p>

### 2. Track shots during the game

The app displays a clean whiteboard-style hockey rink. When a shot on goal happens, tap the spot on the ice where it came from. A quick popup lets you tag the team, whether it was a goal, blocked shot, or scoring chance, and optionally the player's jersey number. Tap OK and you're back to watching the game.

The rink stays clean throughout. No clutter, no marks piling up. You can tap "View Shots" any time to pull up an overlay of everything you've recorded so far, then dismiss it and keep going.

<p align="center">
  <img src="docs/screenshots/gameplay-rink.png" alt="Gameplay rink view" width="300" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/screenshots/shot-popup.png" alt="Recording a shot" width="300" />
</p>

Other things you can do during the game:

- **Undo** the last shot if you mis-tap
- **Running shot counter** at the top so you always know the totals
- **Time in zone** (if enabled in New Game): tap Defensive, Neutral, or Offensive in the bars just outside the top edge of the rink (the right edge in portrait) to switch the active zone. Only one zone is active at a time, and each period starts in Neutral. Taps on the zone bars don't record shots, and every tap on the ice does.
- **Period management** handles the full flow: 1st, 2nd, and 3rd periods, plus optional overtime for tournament games
- The rink **flips orientation** between periods since teams switch ends (just like a real game). When the home team's goal is on the right, the rink starts reversed, so the home team shoots left in the 1st period

### 3. Review an individual game

After the final period, tap "End & Save Game" and the app generates a full summary report:

- Final score and total shots per team
- Scoring chance counts for each team
- Shot outcome pie charts for goals, blocked shots, scoring chances, and regular shots
- Period-by-period shot breakdown
- Goalie save percentages
- Shot location map showing every shot plotted on the rink (goals are filled circles, blocked shots are open circles, and scoring chances are diamonds)
- Shot density heatmap you can filter by team
- Per-player stats (shots and goals) for any players you tagged by number
- Shot momentum timeline for the game
- Time in zone bar chart (for games tracked with "Track time in zone")

<p align="center">
  <img src="docs/screenshots/summary-desktop.png" alt="Game summary report" width="700" />
</p>

### 4. Create a head-to-head report

Tap "Create Report" on the home screen and choose a first team. The second-team list is limited to teams with a saved game against the first team. The report combines shots from all saved matchups, including in-progress games; its win record and game momentum include completed games only. It also shows a win-share bar and aggregated shot maps and density.

### 5. Export and revisit

- **Export either report as PDF** to share with your coaching staff or email to parents
- All games are **saved automatically** and show up on the home screen so you can revisit any past game's summary

Here's a full example of an exported game report ([download the PDF](docs/HawksShotReport.pdf)):

<p align="center">
  <img src="docs/sample-report-page-1.png" alt="Example exported game report — Hawks vs Eagles" width="700" />
</p>

## Tips for Coaches

- You don't have to fill in every field on the shot popup. If the action is fast and you just want to capture the location, tap the ice and hit OK. You can always tell the story from the shot map later.
- If you have an assistant coach or parent willing to help, one person can track home shots and the other can track away shots.
- The heatmap is particularly useful for showing players where the team is generating offense from and where the opposing team is getting their looks. 
- The per-player stats are only as good as the jersey numbers you enter, so don't stress about catching every one. Even partial data tells a story.

## Privacy and Data

Your data stays on your device. The app saves games to your browser's local storage, which means no data is uploaded anywhere, no account is needed, and nobody else can see your games. The tradeoff is that if you clear your browser data or switch to a different device, your saved games won't carry over.

Team names, the default team, tracking options, and report preferences are saved in local storage as well. Open Configuration from the home screen to manage teams and change settings.

---

### New to the app?

Tap **How to use** on the home screen for an in-app mobile guide covering the New Game setup, recording shots, periods, Maximize mode, zone time, and exporting reports.

## Technical Details

Built with React, Vite, and Tailwind CSS. The hockey rink is an inline SVG, the heatmaps use HTML Canvas, and PDF export uses html2canvas + jsPDF. Deployed as a static site to GitHub Pages via GitHub Actions. No backend, no database, no server costs.

To run locally for development:

```
git clone https://github.com/dvelton/hockey-shot-tracker.git
cd hockey-shot-tracker
npm install
npm run dev
```

Run the unit tests with `npm test`.

---

## Shoutout

Dedicated to my son's 12U hockey team. Good luck in the playoffs. Go Hawks!
