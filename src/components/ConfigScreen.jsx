function ToggleSetting({ label, description, value, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 py-4 border-b border-slate-100 last:border-b-0">
      <span>
        <span className="block font-semibold text-slate-700">{label}</span>
        <span className="block text-sm text-slate-500 mt-0.5">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
      />
    </label>
  );
}

export default function ConfigScreen({ config, onChange, onBack }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 font-medium active:text-blue-800"
        >
          Back
        </button>
        <h1 className="text-xl font-bold text-slate-800">Configuration</h1>
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 mb-5">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide pt-4">
          Shot Tracking
        </h2>
        <ToggleSetting
          label="Track blocked shots"
          description="Show the blocked-shot option when recording a shot and include blocked-shot stats in reports."
          value={config.trackBlockedShots}
          onChange={(value) => onChange('trackBlockedShots', value)}
        />
        <ToggleSetting
          label="Track scoring chances"
          description="Show the scoring-chance option when recording a shot and include scoring-chance stats in reports."
          value={config.trackScoringChances}
          onChange={(value) => onChange('trackScoringChances', value)}
        />
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide pt-4">
          Game Report
        </h2>
        <ToggleSetting
          label="Report shots by zone"
          description="Include the offensive, neutral, and defensive zone breakdown."
          value={config.reportShotsByZone}
          onChange={(value) => onChange('reportShotsByZone', value)}
        />
        <ToggleSetting
          label="Report shot outcome breakdown"
          description="Include the outcome pie charts for each team."
          value={config.reportShotOutcomeBreakdown}
          onChange={(value) => onChange('reportShotOutcomeBreakdown', value)}
        />
        <label className="flex items-start justify-between gap-4 py-4 border-t border-slate-100">
          <span>
            <span className="block font-semibold text-slate-700">Shot maps by period</span>
            <span className="block text-sm text-slate-500 mt-0.5">
              Choose whether and how period shot maps appear in the game report.
            </span>
          </span>
          <select
            value={config.reportShotMapsByPeriod === false ? 'none' : config.reportShotMapsByPeriod}
            onChange={(event) => onChange(
              'reportShotMapsByPeriod',
              event.target.value === 'none' ? false : event.target.value
            )}
            className="mt-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
          >
            <option value="none">Off</option>
            <option value="mini">Mini</option>
            <option value="full">Full-size</option>
          </select>
        </label>
      </section>
      <p className="text-xs text-slate-400 text-center mt-4">
        Settings are saved automatically on this device.
      </p>
    </div>
  );
}
