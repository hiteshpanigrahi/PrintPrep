"use client";

import { useRef, forwardRef, useImperativeHandle, useState } from "react";
import { ZoomIn } from "lucide-react";
import ZoomPreviewModal from "./ZoomPreviewModal";

const PreviewPanel = forwardRef(({ pages, nUp, sheets, metrics }, ref) => {
  const scrollRef = useRef(null);
  const [zoomIndex, setZoomIndex] = useState(null);
  const includedPages = pages.filter((page) => page.isIncluded);
  
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

  const handleSlideClick = (page) => {
    const idx = includedPages.findIndex((p) => p.id === page.id);
    setZoomIndex(idx !== -1 ? idx : 0);
  };

  return (
    <>
      <div className="flex flex-col gap-4 w-full h-full min-h-0">
        <div 
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex max-w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-[var(--bg-secondary)] p-3 sm:p-5 custom-scrollbar h-full items-center"
        >
          <div className="flex flex-row gap-4 h-full items-center py-1">
            {sheets.map((sheet, sheetIndex) => (
              <div key={`sheet-${sheetIndex}`} className="snap-center shrink-0 flex flex-col items-center">
                <p className="mb-2 text-center text-[11px] sm:text-xs font-bold uppercase tracking-[.16em] text-[var(--text-muted)] shrink-0 h-[16px] leading-4">
                  Sheet {sheetIndex + 1} of {sheets.length}
                </p>
                <div 
                  className="relative bg-[var(--bg-card)] shadow-xl shrink-0 rounded-md overflow-hidden border border-[var(--border-color)] w-[190px] h-[268px] sm:w-[226px] sm:h-[320px] lg:w-[290px] lg:h-[410px]"
                >
                  <div 
                    className="absolute inset-0 w-full h-full flex flex-col justify-between"
                    style={{ padding: `${(metrics.margin / 595.28) * 100}%` }}
                  >
                    {sheet.map((page) => (
                      <div
                        key={page.id}
                        onClick={() => handleSlideClick(page)}
                        className="group/slide flex-1 min-h-0 relative overflow-hidden border border-[var(--border-color)] mb-[1.5%] last:mb-0 bg-white/5 flex items-center justify-center cursor-pointer transition hover:border-[var(--accent-mint)] hover:shadow-md"
                        title="Click or tap to view zoomed preview"
                      >
                        <img
                          src={page.thumbnailUrl}
                          alt="Preview slide"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover/slide:opacity-100 transition-opacity backdrop-blur-[1px]">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--bg-panel)] text-[var(--text-main)] shadow-lg transform scale-90 group-hover/slide:scale-100 transition-transform">
                            <ZoomIn size={15} />
                          </span>
                        </div>
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

      {/* Zoom Modal */}
      <ZoomPreviewModal
        isOpen={zoomIndex !== null}
        onClose={() => setZoomIndex(null)}
        pages={includedPages}
        initialIndex={zoomIndex !== null ? zoomIndex : 0}
      />
    </>
  );
});

PreviewPanel.displayName = "PreviewPanel";

export default PreviewPanel;
