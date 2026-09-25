import { useRef, forwardRef, useImperativeHandle } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PreviewPanel = forwardRef(({ pages, nUp, sheets, metrics }, ref) => {
  const scrollRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    scrollBy: (amount) => {
      if (scrollRef.current) {
        scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
      }
    }
  }));

  const handleWheel = (e) => {
    // Only map vertical scrolls (mouse wheel) to horizontal. 
    // Ignore if user is already swiping horizontally on a trackpad.
    if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-0">
      <div 
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex max-w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-[var(--bg-secondary)] p-5 pb-7 custom-scrollbar h-full"
      >
      <div className="flex flex-row gap-3 h-full">
        {sheets.map((sheet, sheetIndex) => (
          <div key={`sheet-${sheetIndex}`} className="snap-center shrink-0 h-full flex flex-col items-center">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[.16em] text-[var(--text-muted)] shrink-0 h-[16px] leading-4">
              Sheet {sheetIndex + 1} of {sheets.length}
            </p>
            <div className="relative h-[calc(100%-28px)] bg-[var(--bg-card)] shadow-xl shrink-0">
              {/* This SVG mathematically forces the correct intrinsic width based on available height */}
              <svg viewBox="0 0 595.28 841.89" className="h-full w-auto block pointer-events-none opacity-0" />
              
              <div 
                className="absolute inset-0 flex flex-col justify-between"
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
        {/* Trailing spacer for full right scroll */}
        <div className="shrink-0 w-1" />
      </div>
      </div>
    </div>
  );
});

export default PreviewPanel;
