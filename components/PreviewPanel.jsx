export default function PreviewPanel({ pages, nUp, sheets, metrics }) {
  return (
    <div className="flex max-w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-[var(--bg-secondary)] p-5 pb-7 custom-scrollbar">
      <div className="flex flex-row gap-6 h-full">
        {sheets.map((sheet, sheetIndex) => (
          <div key={`sheet-${sheetIndex}`} className="snap-center shrink-0 w-[260px] sm:w-[350px] flex flex-col items-center">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[.16em] text-[var(--text-muted)]">
              Sheet {sheetIndex + 1} of {sheets.length}
            </p>
            <div className="w-full">
              <div
                className="relative aspect-[595/842] w-full bg-[var(--bg-card)] shadow-xl flex flex-col justify-between"
                style={{ padding: `${(metrics.margin / 595.28) * 100}%` }}
              >
                {sheet.map((page) => (
                  <div
                    key={page.id}
                    className="flex-1 overflow-hidden border border-[var(--border-color)] mb-[1.5%] last:mb-0"
                  >
                    <img
                      src={page.thumbnailUrl}
                      alt="Preview slide"
                      className="h-full w-full object-contain"
                      style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
