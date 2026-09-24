import ThemeToggle from "./ThemeToggle";

export default function ToolHeader({ theme, setTheme, onBackToHub, badge }) {
  return (
    <>
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-panel)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <div 
            className={`flex items-center gap-3 ${onBackToHub ? 'cursor-pointer hover:opacity-80 transition' : ''}`} 
            onClick={onBackToHub ? onBackToHub : undefined}
          >
            <img src="/logo.png" alt="PrintPrep Logo" className="h-8 w-auto object-contain" />
            {badge && <span className="hidden rounded-full bg-[var(--mint)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] sm:inline">{badge}</span>}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>
      </header>
      {onBackToHub && (
        <div className="mx-auto w-full max-w-7xl px-6 pt-4 lg:px-10">
          <button onClick={onBackToHub} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] px-4 py-2 text-xs font-bold text-[var(--text-muted)] transition hover:border-[var(--accent-mint)] hover:text-[var(--text-main)]">
            ← Back
          </button>
        </div>
      )}
    </>
  );
}
