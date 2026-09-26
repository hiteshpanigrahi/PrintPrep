"use client";

import { useState, useRef } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Eye, EyeOff, FilePlus2, GripVertical, Plus, RotateCw, Trash2, ZoomIn } from "lucide-react";
import ZoomPreviewModal from "./ZoomPreviewModal";

function InsertMenu({ index, side = "right", onAddBlank, onAddFile }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`absolute ${
        side === "left" ? "-left-4" : "-right-4"
      } top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center opacity-0 group-hover:opacity-100 group-hover:z-30 transition-opacity`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="grid h-8 w-8 place-items-center rounded-full border-2 border-[var(--bg-panel)] bg-[var(--accent-mint)] text-[var(--bg-main)] shadow-md transition hover:scale-110"
        aria-label="Add page here"
      >
        <Plus size={15} />
      </button>
      {open && (
        <div
          className={`absolute top-10 z-20 w-44 rounded-xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-1.5 text-[var(--text-main)] shadow-xl ${
            side === "left" ? "left-0" : "right-0"
          }`}
        >
          <button
            onClick={() => {
              onAddBlank(index);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold hover:bg-[var(--mint)]/30"
          >
            <Plus size={14} /> Add blank page
          </button>
          <button
            onClick={() => {
              onAddFile(index);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold hover:bg-[var(--mint)]/30"
          >
            <FilePlus2 size={14} /> Add a file
          </button>
        </div>
      )}
    </div>
  );
}

export default function ThumbnailGrid({ pages, setPages, onDelete, onAddBlank, onAddFile }) {
  const [zoomIndex, setZoomIndex] = useState(null);
  const pointerStartPos = useRef({ x: 0, y: 0 });

  function reorder(result) {
    if (!result.destination) return;
    const next = [...pages];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setPages(next);
  }

  function updatePage(id, changes) {
    setPages(pages.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }

  const handlePointerDown = (e) => {
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleThumbnailClick = (e, index) => {
    // Prevent zoom if the user was dragging to reorder
    const dist = Math.hypot(
      e.clientX - pointerStartPos.current.x,
      e.clientY - pointerStartPos.current.y
    );
    if (dist < 8) {
      setZoomIndex(index);
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={reorder}>
        <Droppable droppableId="pages" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
            >
              {pages.map((page, index) => (
                <Draggable draggableId={page.id} index={index} key={page.id}>
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      className={`group relative overflow-visible rounded-xl border bg-[var(--bg-card)] transition hover:z-20 ${
                        page.isIncluded
                          ? "border-[var(--border-color)]"
                          : "border-[var(--accent-coral)] opacity-60"
                      }`}
                    >
                      {index === 0 && (
                        <InsertMenu
                          index={0}
                          side="left"
                          onAddBlank={onAddBlank}
                          onAddFile={onAddFile}
                        />
                      )}

                      {/* Thumbnail Container */}
                      <div
                        className="checkerboard relative aspect-[4/3] overflow-hidden rounded-t-xl cursor-pointer"
                        onPointerDown={handlePointerDown}
                        onClick={(e) => handleThumbnailClick(e, index)}
                        title="Click or tap to view zoomed preview"
                      >
                        <img
                          src={page.thumbnailUrl}
                          alt={`Page ${index + 1}`}
                          className="h-full w-full object-contain transition-transform duration-300 pointer-events-none"
                          style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                        />

                        {/* Page Number Badge */}
                        <div className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[var(--accent-mint)] text-xs font-bold text-[var(--bg-main)] shadow-sm">
                          {index + 1}
                        </div>

                        {/* Hover Overlay with Rotate & Zoom buttons */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePage(page.id, {
                                rotation: ((page.rotation || 0) - 90 + 360) % 360,
                              });
                            }}
                            className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-110"
                            title="Rotate counter-clockwise"
                            aria-label="Rotate CCW"
                          >
                            <RotateCw size={17} className="-scale-x-100" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomIndex(index);
                            }}
                            className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-full bg-[var(--accent-mint)] text-[var(--bg-main)] shadow-lg transition hover:scale-110"
                            title="Zoom preview"
                            aria-label="Zoom preview"
                          >
                            <ZoomIn size={19} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePage(page.id, {
                                rotation: ((page.rotation || 0) + 90) % 360,
                              });
                            }}
                            className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-110"
                            title="Rotate clockwise"
                            aria-label="Rotate CW"
                          >
                            <RotateCw size={17} />
                          </button>
                        </div>

                        {/* Eye include/skip toggle button */}
                        <div className="absolute right-2 top-2 flex gap-1 z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePage(page.id, { isIncluded: !page.isIncluded });
                            }}
                            className={`grid h-7 w-7 place-items-center rounded-full shadow-sm ${
                              page.isIncluded
                                ? "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--accent-coral)] hover:text-[var(--bg-main)]"
                                : "bg-[var(--accent-coral)] text-[var(--bg-main)]"
                            }`}
                            aria-label={
                              page.isIncluded
                                ? `Skip page ${index + 1}`
                                : `Restore page ${index + 1}`
                            }
                          >
                            {page.isIncluded ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>

                        {/* Drag Handle Indicator */}
                        <div className="absolute bottom-2 left-2 opacity-0 transition group-hover:opacity-100">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm">
                            <GripVertical size={15} />
                          </span>
                        </div>
                      </div>

                      {/* Card Bottom Bar */}
                      <div className="flex items-center justify-between rounded-b-xl bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-muted)]">
                        <span className="rounded-md bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate max-w-[80px]">
                          {page.fileType}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomIndex(index);
                            }}
                            className="grid h-7 w-7 md:hidden place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition hover:bg-[var(--accent-mint)] hover:text-[var(--bg-main)]"
                            title="Zoom"
                            aria-label="Zoom preview"
                          >
                            <ZoomIn size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePage(page.id, {
                                rotation: ((page.rotation || 0) + 90) % 360,
                              });
                            }}
                            className="grid h-7 w-7 md:hidden place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition hover:bg-[var(--accent-mint)] hover:text-[var(--bg-main)]"
                            aria-label="Rotate"
                          >
                            <RotateCw size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(page.id);
                            }}
                            className="grid h-7 w-7 place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition hover:bg-[var(--accent-coral)] hover:text-[var(--bg-main)]"
                            aria-label={`Delete page ${index + 1}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <InsertMenu
                        index={index + 1}
                        onAddBlank={onAddBlank}
                        onAddFile={onAddFile}
                      />
                    </div>
                  )}
                </Draggable>
              ))}

              <div
                onClick={() => onAddFile(pages.length)}
                className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-color)] text-[var(--text-muted)] transition hover:border-[var(--accent-mint)] hover:bg-[var(--mint)] hover:text-[var(--accent-mint)]"
              >
                <Plus size={32} />
                <span className="mt-2 text-xs font-bold uppercase tracking-widest">
                  Add Files
                </span>
              </div>

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Zoomed Preview Lightbox */}
      <ZoomPreviewModal
        isOpen={zoomIndex !== null}
        onClose={() => setZoomIndex(null)}
        pages={pages}
        initialIndex={zoomIndex !== null ? zoomIndex : 0}
        onUpdatePage={updatePage}
      />
    </>
  );
}
