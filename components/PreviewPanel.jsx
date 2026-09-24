export default function PreviewPanel({ pages, nUp, sheets, metrics }) {
  return (
    <div className="preview-scroll flex max-w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-preview p-5 pb-7">
      <div className="preview-track">
        {sheets.map((sheet, sheetIndex) => (
          <div key={`sheet-${sheetIndex}`} className="preview-sheet snap-center">
            <p className="mb-2 text-center text-xs font-bold uppercase tracking-[.16em] text-[var(--text-muted)]">
              Sheet {sheetIndex + 1} of {sheets.length}
            </p>
            <div className="mx-auto w-full max-w-[350px]">
              <div
                className="relative aspect-[595/842] w-full bg-[var(--bg-card)] shadow-xl"
                style={{ padding: `${(metrics.margin / 595.28) * 100}%` }}
              >
                {sheet.map((page) => (
                  <div
                    key={page.id}
                    className="mb-[3.3%] overflow-hidden border border-[var(--border-color)]"
                    style={{ height: `${100 / nUp - 3}%` }}
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
