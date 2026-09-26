"use client";

import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Move
} from "lucide-react";

const emptySubscribe = () => () => {};

export default function ZoomPreviewModal({
  isOpen,
  onClose,
  pages = [],
  initialIndex = 0,
  onUpdatePage,
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [prevProps, setPrevProps] = useState({ isOpen, initialIndex });

  // Sync state when modal opens or initialIndex changes (React recommended pattern)
  if (prevProps.isOpen !== isOpen || prevProps.initialIndex !== initialIndex) {
    setPrevProps({ isOpen, initialIndex });
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, pages.length - 1)));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const containerRef = useRef(null);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleNext = useCallback(() => {
    if (pages.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % pages.length);
    resetTransform();
  }, [pages.length, resetTransform]);

  const handlePrev = useCallback(() => {
    if (pages.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + pages.length) % pages.length);
    resetTransform();
  }, [pages.length, resetTransform]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.35, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.35, 0.75);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0" || e.key.toLowerCase() === "r") {
        e.preventDefault();
        resetTransform();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev, handleZoomIn, handleZoomOut, resetTransform]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.2, 4));
    } else {
      setZoom((prev) => {
        const next = Math.max(prev - 0.2, 0.75);
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Pan handlers (drag)
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double click to toggle zoom
  const handleDoubleClick = () => {
    if (zoom > 1) {
      resetTransform();
    } else {
      setZoom(2);
      setPan({ x: 0, y: 0 });
    }
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      if (zoom > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX: pan.x,
          panY: pan.y,
        };
      }
    }
  };

  const handleTouchMove = (e) => {
    if (zoom > 1 && isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy,
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (isDragging) {
      setIsDragging(false);
    }
    // If not zoomed, check for swipe navigation
    if (zoom <= 1 && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;

      if (dt < 400 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  if (!isClient || !isOpen || pages.length === 0) return null;

  const currentPage = pages[currentIndex] || pages[0];
  const imageUrl = currentPage.thumbnailUrl || currentPage.url || currentPage.thumbUrl || "";
  const rotation = currentPage.rotation || 0;
  const isIncluded = currentPage.isIncluded !== undefined ? currentPage.isIncluded : true;
  const title = currentPage.sourceFileName || currentPage.name || `Page ${currentIndex + 1}`;

  const handleRotateCurrent = (delta) => {
    const nextRot = ((rotation + delta) % 360 + 360) % 360;
    if (onUpdatePage && currentPage.id !== undefined) {
      onUpdatePage(currentPage.id, { rotation: nextRot });
    } else if (onUpdatePage && currentPage.pageNum !== undefined) {
      onUpdatePage(currentPage.pageNum, { rotation: nextRot });
    }
  };

  const handleToggleInclude = () => {
    if (onUpdatePage && currentPage.id !== undefined) {
      onUpdatePage(currentPage.id, { isIncluded: !isIncluded });
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-black/85 backdrop-blur-md text-white select-none animate-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent-mint)] text-xs font-bold text-[var(--bg-main)] shadow-sm">
              {currentIndex + 1}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-white/90">
              Sheet {currentIndex + 1} of {pages.length}
            </span>
          </div>
          {title && (
            <span className="hidden sm:inline-block max-w-[200px] md:max-w-xs truncate text-xs text-white/60 font-mono border-l border-white/20 pl-3">
              {title}
            </span>
          )}
        </div>

        {/* Center Floating Controls (Desktop/Tablet) */}
        <div className="flex items-center gap-1 sm:gap-2 rounded-full bg-white/10 p-1 backdrop-blur-lg border border-white/15 shadow-xl">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.75}
            className="grid h-8 w-8 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition disabled:opacity-30 disabled:hover:bg-transparent"
            title="Zoom Out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <button
            onClick={resetTransform}
            className="px-2.5 py-1 rounded-full text-xs font-mono font-bold text-[var(--accent-mint)] hover:bg-white/15 transition"
            title="Click to reset zoom (0 or R)"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="grid h-8 w-8 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition disabled:opacity-30 disabled:hover:bg-transparent"
            title="Zoom In (+)"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          <div className="h-4 w-[1px] bg-white/20 mx-0.5" />

          <button
            onClick={() => handleRotateCurrent(90)}
            className="grid h-8 w-8 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition"
            title="Rotate Clockwise"
            aria-label="Rotate clockwise"
          >
            <RotateCw size={16} />
          </button>

          {onUpdatePage && currentPage.isIncluded !== undefined && (
            <button
              onClick={handleToggleInclude}
              className={`grid h-8 w-8 place-items-center rounded-full transition ${
                isIncluded 
                  ? "text-white/80 hover:text-white hover:bg-white/15" 
                  : "bg-[var(--accent-coral)] text-white"
              }`}
              title={isIncluded ? "Skip this page" : "Include this page"}
              aria-label={isIncluded ? "Skip page" : "Include page"}
            >
              {isIncluded ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          )}

          <button
            onClick={resetTransform}
            className="hidden md:grid h-8 w-8 place-items-center rounded-full text-white/80 hover:text-white hover:bg-white/15 transition"
            title="Fit to Screen"
            aria-label="Fit to screen"
          >
            <Maximize2 size={15} />
          </button>
        </div>

        {/* Right Action: Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            title="Close Preview (Esc)"
            aria-label="Close zoomed preview"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Preview Canvas */}
      <div 
        ref={containerRef}
        className={`relative flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-8 ${
          zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        {/* Navigation Arrows */}
        {pages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 grid h-12 w-12 place-items-center rounded-full bg-black/50 text-white/90 hover:text-white hover:bg-black/80 hover:scale-110 border border-white/15 shadow-2xl transition active:scale-95 backdrop-blur-md"
              title="Previous Page (Left Arrow)"
              aria-label="Previous page"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 grid h-12 w-12 place-items-center rounded-full bg-black/50 text-white/90 hover:text-white hover:bg-black/80 hover:scale-110 border border-white/15 shadow-2xl transition active:scale-95 backdrop-blur-md"
              title="Next Page (Right Arrow)"
              aria-label="Next page"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Center Page Display Card */}
        <div
          className="relative max-h-full max-w-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            willChange: "transform",
          }}
        >
          <div className="relative shadow-2xl rounded-xl overflow-hidden border border-white/10 bg-[var(--bg-card)]">
            <img
              src={imageUrl}
              alt={`Page ${currentIndex + 1}`}
              className="max-h-[76vh] max-w-[85vw] sm:max-w-[75vw] object-contain pointer-events-none transition-transform duration-300 select-none"
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Hint Pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center gap-2 rounded-full bg-black/60 px-4 py-1.5 text-[11px] sm:text-xs text-white/70 backdrop-blur-md border border-white/10 shadow-lg">
          {zoom > 1 ? (
            <span className="flex items-center gap-1.5">
              <Move size={13} className="text-[var(--accent-mint)]" />
              Drag to pan · Double-click to reset
            </span>
          ) : (
            <span>
              Double-click or scroll to zoom · Arrows to navigate
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
