export default function SidebarSettings({ title, description, children, onExport, exportLabel, busy, progress, exportDisabled, onCancel }) {
  return (
    <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border-color)] bg-[var(--bg-panel)] flex flex-col max-h-[50vh] lg:max-h-none h-full">
      <div className="p-6 border-b border-[var(--border-color)]">
        <h3 className="font-display text-xl font-bold">{title || "Document Settings"}</h3>
        {description && <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {children}
      </div>

      <div className="border-t border-[var(--border-color)] p-6 bg-[var(--bg-panel)]">
        <div className="flex flex-row gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={busy}
              className="flex-1 rounded-xl border border-[var(--border-color)] px-5 py-4 text-sm font-bold text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)] disabled:opacity-50"
            >
              Keep editing
            </button>
          )}
          <button
            onClick={onExport}
            disabled={exportDisabled || busy}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-5 py-4 text-sm font-bold text-[var(--bg-main)] transition hover:brightness-110 disabled:opacity-50`}
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-[var(--bg-main)] border-t-transparent animate-spin" />
                Generating...
              </span>
            ) : (
              exportLabel || "Export"
            )}
          </button>
        </div>
        
        {progress && (
          <div className="mt-4 animate-rise">
            <div className="mb-2 flex justify-between text-xs">
              <span className="font-bold text-[var(--text-muted)]">{progress.text}</span>
              <span className="font-mono font-bold text-[var(--accent-mint)]">{progress.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
              <div className="h-full rounded-full bg-[var(--accent-mint)] progress-shimmer transition-all duration-300" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
