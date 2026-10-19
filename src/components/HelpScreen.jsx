const base = import.meta.env.BASE_URL;

function Section({ id, title, children }) {
  return (
    <section id={id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 scroll-mt-4">
      <h2 className="text-lg font-bold text-slate-800 mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function Figure({ src, alt, caption, wide = false }) {
  return (
    <figure className="my-2">
      <img
        src={`${base}help/${src}`}
        alt={alt}
        className={`mx-auto w-full rounded-xl border border-slate-200 ${wide ? '' : 'max-w-xs'}`}
      />
      {caption && <figcaption className="mt-2 text-center text-xs text-slate-500">{caption}</figcaption>}
    </figure>
  );
}

export default function HelpScreen({ onBack }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-blue-600 font-medium active:text-blue-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </button>
        <h1 className="text-xl font-bold text-slate-800">Help</h1>
        <span className="w-16" aria-hidden="true" />
      </div>

      <div className="space-y-4">
        <nav aria-label="Help sections" className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Jump to</p>
          <ul className="grid grid-cols-1 gap-1 text-sm text-blue-600 font-medium">
            <li><a href="#help-data">Your data stays on this device</a></li>
            <li><a href="#help-new-game">Setting up a new game</a></li>
            <li><a href="#help-periods">Starting and ending periods</a></li>
            <li><a href="#help-shots">Recording a shot</a></li>
            <li><a href="#help-maximize">Maximize mode</a></li>
            <li><a href="#help-zone">Tracking time in zone</a></li>
            <li><a href="#help-export">Exporting the game report</a></li>
          </ul>
        </nav>

        <Section id="help-data" title="Your data stays on this device">
          <p>
            Hockey Shot Tracker has no accounts and no server. Every game and setting is saved
            only in this device.
          </p>
          <p>
            That means other people cannot see your games automatically. To share a game or keep a backup,
            export it:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Export data</strong> on the game summary (or <strong>Export game data</strong>
              {' '}during play) saves one game as a file.
            </li>
            <li>
              <strong>Export all games</strong> on the home screen saves every game as a backup file.
            </li>
          </ul>
          <p>
            Send the file to someone, they can use {' '}<strong>Import backup</strong> to add the games.
          </p>
        </Section>

        <Section id="help-new-game" title="Setting up a new game">
          <p>
            Tap <strong>New Game</strong> on the home screen. The first time you use the app, add
            your team on the home screen; it becomes the default home team.
          </p>
          <Figure
            src="new-game-setup.png"
            alt="New Game setup form showing team selectors, Home goal left or right, and Track time in zone"
            caption="The New Game dialog"
          />
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Home Team / Away Team:</strong> pick the teams. Choose <em>Add a new team...</em>
              to add one. Tap <strong>Flip home and away</strong> to swap them.
            </li>
            <li>
              <strong>Home goal is on the left / right:</strong> choose the side of the rink where
              the home team&apos;s goal actually is. Look at the rink you are in before you pick.
              This matters because the app flips the rink between periods, so the shot map must
              match the real ice. The home team shoots toward the other end in the 1st period.
            </li>
            <li>
              <strong>Track time in zone:</strong> check this box to record how long the puck spends
              in the defensive, neutral, and offensive zones. It is off by default. See{' '}
              <a href="#help-zone" className="text-blue-600 font-medium">Tracking time in zone</a>.
            </li>
            <li>
              <strong>Date and Time</strong> fill in automatically; change them if needed.
            </li>
          </ul>
          <p>Tap <strong>Start Game</strong> when everything is set.</p>
        </Section>

        <Section id="help-periods" title="Starting and ending periods">
          <p>
            The period buttons sit below the rink. Tapping them in order follows the game:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Start 1st Period</strong>, then <strong>End 1st Period</strong> at the buzzer.</li>
            <li><strong>Start 2nd Period</strong>, then <strong>End 2nd Period</strong>.</li>
            <li><strong>Start 3rd Period</strong>, then <strong>End 3rd Period</strong>.</li>
            <li>
              If the game is tied, <strong>Add Overtime</strong> appears (optional). Otherwise,
              tap <strong>End &amp; Save Game</strong> when the game is over.
            </li>
          </ol>
          <p>
            You can only record shots while a period is running. Between periods, the rink is
            locked. An <strong>Export Period N Report</strong> button appears between periods if you
            want a report for the period you just finished.
          </p>
        </Section>

        <Section id="help-shots" title="Recording a shot">
          <p>
            During play, tap the spot on the ice where the shot came from. Then:
          </p>
          <Figure
            src="record-shot.png"
            alt="Record Shot popup with Team, Result, and Player number fields"
            caption="The Record Shot popup"
          />
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Team</strong>: The team that took the shot.  By default, the team that is on offense in the
              zone where you tapped should be selected. You can change it if needed.
            </li>
            <li>
              <strong>Result</strong> is optional. Leave it empty for a regular shot, or pick{' '}
              <strong>Goal</strong>, or <strong>Scoring Chance</strong>.  When enabled in the options,
              {' '}<strong>Blocked</strong> is also available.
            </li>
            <li>
              <strong>Player #</strong> is optional. Enter the jersey number to get per-player stats.
            </li>
          </ul>
          <p>
            Tap <strong>OK</strong> to save the shot, or <strong>Cancel</strong> to discard it. Use{' '}
            <strong>Undo</strong> under the rink to remove the last shot if you tap by mistake.
          </p>
        </Section>

        <Section id="help-maximize" title="Maximize mode">
          <p>
            On a phone, the rink is small. Tap the <strong>Maximize rink</strong> button (the expand
            icon in the row of buttons above the rink) to fill the screen with a landscape rink. Use
            it for easier, more accurate taps.
          </p>
          <Figure
            src="maximize-restore.png"
            alt="Rink controls with the Maximize rink button (expand icon) in the row above the rink"
            caption="Maximize rink: the expand icon at the top right of the rink controls"
          />
          <p>
            In maximized mode, the rink fills the screen. To return to the normal view, tap the{' '}
            <strong>Restore normal rink view</strong> button (the shrink icon) at the left of the
            bottom bar.
          </p>
          <Figure
            src="maximize-restore-maximized.png"
            alt="Maximized rink with the Restore normal rink view button (shrink icon) at the left of the bottom bar"
            caption="Restore normal rink view: the shrink icon at the left of the bottom bar"
            wide
          />
        </Section>

        <Section id="help-zone" title="Tracking time in zone">
          <p>
            If you checked <strong>Track time in zone</strong> when setting up the game, colored bars
            appear along the top edge of the rink: <strong>Defensive</strong>, <strong>Neutral</strong>,
            and <strong>Offensive</strong>. Only one zone is active at a time.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Each period starts in <strong>Neutral</strong>.</li>
            <li>When the puck moves into a different zone, tap that zone&apos;s bar to switch to it.</li>
            <li>Tapping a zone bar does not record a shot. Tapping the ice still records one.</li>
          </ul>
          <p>
            The time in each zone is calculated from your switch times and appears as a chart in the
            game summary.
          </p>
        </Section>

        <Section id="help-export" title="Exporting the game report">
          <p>
            When you tap <strong>End &amp; Save Game</strong>, the summary report opens. It includes the
            final score, shot totals, charts, shot map, and player and zone stats. From there:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Export PDF</strong> creates a printable report to share with coaches, parents, or
              players.
            </li>
            <li>
              <strong>Export data</strong> creates a backup file that another device can import with
              <strong> Import backup</strong>.
            </li>
          </ul>
          <p>
            You can open the game again from the home screen&apos;s <strong>Saved Games</strong> list
            at any time to review or export it.
          </p>
        </Section>
      </div>
    </div>
  );
}
