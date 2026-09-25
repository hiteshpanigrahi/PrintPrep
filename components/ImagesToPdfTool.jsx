"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDropzone } from "react-dropzone";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Download, FileImage, GripVertical, LoaderCircle, Maximize, Minimize, Plus, RotateCw, Trash2, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import ToolHeader from "./ToolHeader";
import { useToast } from "./ToastProvider";

const A4_W = 1190; // 595 * 2
const A4_H = 1684; // 842 * 2

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawImageToCell(ctx, img, cell, rotation, fitMode) {
  // Save context
  ctx.save();
  
  // Create clipping path for the cell so fill doesn't bleed
  ctx.beginPath();
  ctx.rect(cell.x, cell.y, cell.w, cell.h);
  ctx.clip();
  
  // Determine rotated dimensions of the image
  const isRotated = rotation === 90 || rotation === 270;
  const imgW = isRotated ? img.height : img.width;
  const imgH = isRotated ? img.width : img.height;
  
  // Calculate scale
  const scaleX = cell.w / imgW;
  const scaleY = cell.h / imgH;
  const scale = fitMode === "fill" ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  
  // Translate to cell center
  ctx.translate(cell.x + cell.w / 2, cell.y + cell.h / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Draw image centered
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  
  ctx.restore();
}

async function exportImagesToPdf(images, settings, onProgress) {
  const doc = await PDFDocument.create();
  const numImages = images.length;
  
  let imagesPerPage = 1;
  let cols = 1;
  let rows = 1;
  
  const isLandscape = settings.pageOrientation === "landscape";
  const canvasW = isLandscape ? A4_H : A4_W;
  const canvasH = isLandscape ? A4_W : A4_H;
  
  if (settings.layoutTemplate === "2up") {
    imagesPerPage = 2;
    rows = 2;
  } else if (settings.layoutTemplate === "4up") {
    imagesPerPage = 4;
    cols = 2;
    rows = 2;
  }
  
  const numPages = Math.ceil(numImages / imagesPerPage);
  const margin = 50; // Canvas pixels
  
  // Cell dimensions
  const cellW = (canvasW - (margin * 2)) / cols;
  const cellH = (canvasH - (margin * 2)) / rows;
  
  for (let p = 0; p < numPages; p++) {
    onProgress?.({ percent: Math.round((p / numPages) * 90), text: `Rendering page ${p + 1} of ${numPages}...` });
    
    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");
    
    // Fill white bg
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);
    
    for (let i = 0; i < imagesPerPage; i++) {
      const imgIdx = p * imagesPerPage + i;
      if (imgIdx >= numImages) break;
      
      const imgData = images[imgIdx];
      const img = await loadImage(imgData.url);
      
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      const cell = {
        x: margin + col * cellW,
        y: margin + row * cellH,
        w: cellW,
        h: cellH
      };
      
      drawImageToCell(ctx, img, cell, imgData.rotation, settings.fitMode);
    }
    
    // Convert canvas to jpeg blob
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.95));
    const bytes = await blob.arrayBuffer();
    
    const pdfImg = await doc.embedJpg(bytes);
    const pdfW = isLandscape ? 841.89 : 595.28;
    const pdfH = isLandscape ? 595.28 : 841.89;
    const page = doc.addPage([pdfW, pdfH]);
    page.drawImage(pdfImg, { x: 0, y: 0, width: pdfW, height: pdfH });
  }
  
  onProgress?.({ percent: 95, text: "Saving PDF file..." });
  const pdfBytes = await doc.save();
  onProgress?.({ percent: 100, text: "Done!" });
  return pdfBytes;
}

// Inline Insert Menu between images
function InsertMenu({ index, side = "right", onInsert }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onInsert(index, [...e.target.files]);
    }
    setOpen(false);
  };

  return (
    <div className={`absolute ${side === "left" ? "-left-5" : "-right-5"} top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
      <button onClick={() => inputRef.current?.click()} className="grid h-8 w-8 place-items-center rounded-full border-2 border-[var(--bg-panel)] bg-[var(--accent-mint)] text-[var(--bg-main)] shadow-md transition hover:scale-110" aria-label="Add image here">
        <Plus size={15} />
      </button>
      <input ref={inputRef} type="file" multiple accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

export default function ImagesToPdfTool({ theme, setTheme, onBackToHub, onDownloaded }) {
  const { addToast, updateToast } = useToast();
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState({
    fitMode: "fit", // 'fit' | 'fill'
    layoutTemplate: "1up", // '1up' | '2up' | '4up'
    pageOrientation: "portrait", // 'portrait' | 'landscape'
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const processFiles = (files) => {
    return files
      .filter((f) => ["image/png", "image/jpeg", "image/webp"].includes(f.type))
      .map((f) => ({
        id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "img_" + Math.random().toString(36).slice(2, 9) + Date.now(),
        url: URL.createObjectURL(f),
        type: f.type,
        name: f.name,
        rotation: 0,
      }));
  };

  const onDrop = useCallback((acceptedFiles) => {
    setImages((prev) => [...prev, ...processFiles(acceptedFiles)]);
  }, []);

  const handleInsert = (index, files) => {
    const newImgs = processFiles(files);
    setImages((prev) => {
      const next = [...prev];
      next.splice(index, 0, ...newImgs);
      return next;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] },
    multiple: true,
  });

  function reorder(result) {
    if (!result.destination) return;
    const next = [...images];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setImages(next);
  }

  function remove(id) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  function rotate(id, degrees) {
    setImages((prev) => prev.map((img) => {
      if (img.id === id) {
        return { ...img, rotation: (img.rotation + degrees + 360) % 360 };
      }
      return img;
    }));
  }

  async function handleExport() {
    if (!images.length) return;
    const toastId = addToast("Starting PDF generation...", "loading");
    setBusy(true);
    setProgress({ percent: 5, text: "Starting..." });
    try {
      const pdfBytes = await exportImagesToPdf(images, settings, setProgress);
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
      updateToast(toastId, "Downloaded successfully!", "success");
      onDownloaded?.();
    } catch (err) {
      console.error(err);
      updateToast(toastId, "Error generating PDF.", "error");
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(null), 1000);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col">
      <ToolHeader theme={theme} setTheme={setTheme} onBackToHub={() => onBackToHub(images.length > 0)} badge="Images → PDF Workspace" />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        {/* Main Center Canvas */}
        <div className="flex-1 p-6">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-coral)]">Sequence Editor</p>
              <h1 className="font-display text-3xl font-bold">Arrange & Orient Images</h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Drag to reorder. Hover over an image to rotate or insert pages between.</p>
            </div>
            {images.length > 0 && (
              <div className="flex gap-2 self-end w-full md:w-auto justify-end">
                <button
                  onClick={() => setImages([])}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2.5 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-coral)] hover:text-[var(--accent-coral)] w-1/2 md:w-auto"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-3 py-2.5 text-xs font-bold text-[var(--bg-main)] transition hover:brightness-110 w-1/2 md:w-auto"
                >
                  <FileImage size={15} /> Export
                </button>
              </div>
            )}
          </div>

          {!images.length ? (
            <div {...getRootProps()} className={`flex min-h-[400px] w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed text-center transition ${isDragActive ? "border-[var(--accent-coral)] bg-[var(--bg-panel)]" : "border-[var(--accent-mint)] bg-[var(--mint)]/20"}`}>
              <input {...getInputProps()} />
              <FileImage size={40} className="mb-4 text-[var(--accent-mint)]" strokeWidth={1.5} />
              <h2 className="font-display text-2xl font-bold">{isDragActive ? "Drop images here" : "Upload PNGs or JPEGs"}</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Select multiple files or drag and drop an entire folder.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={reorder}>
              <Droppable droppableId="images-workspace" direction="horizontal">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {images.map((img, index) => (
                      <Draggable key={img.id} draggableId={img.id} index={index}>
                        {(drag) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className="group relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm transition hover:border-[var(--accent-mint)] hover:shadow-md"
                          >
                            {index === 0 && <InsertMenu index={0} side="left" onInsert={handleInsert} />}
                            
                            <div className="checkerboard relative aspect-[3/4] overflow-hidden rounded-t-2xl bg-[var(--bg-secondary)]">
                              <img src={img.url} alt={img.name} className="h-full w-full object-contain transition-transform duration-300" style={{ transform: `rotate(${img.rotation}deg)` }} />
                              <div className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-mint)] text-xs font-bold text-[var(--bg-main)] shadow-sm">{index + 1}</div>
                              
                              {/* Hover Actions */}
                              <div className="hidden md:flex absolute inset-0 items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                                <button onClick={() => rotate(img.id, -90)} className="grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-110" aria-label="Rotate CCW">
                                  <RotateCw size={18} className="-scale-x-100" />
                                </button>
                                <button onClick={() => rotate(img.id, 90)} className="grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-110" aria-label="Rotate CW">
                                  <RotateCw size={18} />
                                </button>
                              </div>

                              <div className="hidden md:block absolute bottom-2 left-2 opacity-0 transition-opacity group-hover:opacity-100">
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm"><GripVertical size={14} /></span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between rounded-b-2xl bg-[var(--bg-card)] px-3 py-3">
                              <span className="truncate text-xs font-bold text-[var(--text-muted)] max-w-[80px]">{img.name}</span>
                              <div className="flex gap-2">
                                <button onClick={() => rotate(img.id, 90)} className="grid h-7 w-7 md:hidden place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition hover:bg-[var(--accent-mint)] hover:text-[var(--bg-main)]">
                                  <RotateCw size={14} />
                                </button>
                                <button onClick={() => remove(img.id)} className="grid h-7 w-7 place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] transition hover:bg-[var(--accent-coral)] hover:text-[var(--bg-main)]">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            
                            <InsertMenu index={index + 1} onInsert={handleInsert} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    
                    <div onClick={() => fileInputRef.current?.click()} className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-color)] text-[var(--text-muted)] transition hover:border-[var(--accent-mint)] hover:bg-[var(--mint)]/20 hover:text-[var(--accent-mint)]">
                      <Plus size={32} />
                      <span className="mt-2 text-xs font-bold uppercase tracking-widest">Add</span>
                      <input type="file" multiple accept=".png,.jpg,.jpeg,.webp" className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files?.length) onDrop(Array.from(e.target.files)); e.target.value = null; }} />
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {showExportModal && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-[var(--bg-panel)] shadow-2xl animate-rise flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-5 shrink-0">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Export Settings</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Configure how pages are rendered.</p>
              </div>
              <button onClick={() => !busy && setShowExportModal(false)} className="text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition" disabled={busy}>
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 min-h-0">
              {/* Orientation Options */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 block">Orientation</label>
                <div className="flex rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1">
                  <button
                    onClick={() => setSettings(s => ({ ...s, pageOrientation: "portrait" }))}
                    className={`flex-1 rounded-md px-3 py-2.5 text-sm font-bold transition ${settings.pageOrientation === "portrait" ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                  >Portrait</button>
                  <button
                    onClick={() => setSettings(s => ({ ...s, pageOrientation: "landscape" }))}
                    className={`flex-1 rounded-md px-3 py-2.5 text-sm font-bold transition ${settings.pageOrientation === "landscape" ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                  >Landscape</button>
                </div>
              </div>

              {/* Layout Options */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 block">Page Layout (N-Up)</label>
                <div className="space-y-3">
                  {[
                    { id: "1up", label: "1-Up (Standard)", desc: "1 image per page" },
                    { id: "2up", label: "2-Up Stacked", desc: "2 images vertically" },
                    { id: "4up", label: "2x2 Grid (4-Up)", desc: "4 images per page" }
                  ].map(opt => (
                    <label key={opt.id} className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${settings.layoutTemplate === opt.id ? "border-[var(--accent-mint)] bg-[var(--bg-secondary)]" : "border-[var(--border-color)] hover:border-[var(--accent-mint)]"}`}>
                      <input type="radio" name="layout" checked={settings.layoutTemplate === opt.id} onChange={() => setSettings(s => ({ ...s, layoutTemplate: opt.id }))} className="mt-1" />
                      <div>
                        <p className="text-sm font-bold text-[var(--text-main)]">{opt.label}</p>
                        <p className="text-xs mt-1 text-[var(--text-muted)]">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Scaling Options */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 block">Image Scaling</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSettings(s => ({ ...s, fitMode: "fit" }))}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition ${settings.fitMode === "fit" ? "border-[var(--accent-mint)] bg-[var(--bg-secondary)] text-[var(--accent-mint)]" : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-mint)] hover:text-[var(--text-main)]"}`}
                  >
                    <Minimize size={20} />
                    <span className="text-sm font-bold">Fit to Page</span>
                  </button>
                  <button
                    onClick={() => setSettings(s => ({ ...s, fitMode: "fill" }))}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition ${settings.fitMode === "fill" ? "border-[var(--accent-mint)] bg-[var(--bg-secondary)] text-[var(--accent-mint)]" : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-mint)] hover:text-[var(--text-main)]"}`}
                  >
                    <Maximize size={20} />
                    <span className="text-sm font-bold">Fill Page</span>
                  </button>
                </div>
                <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">
                  {settings.fitMode === "fit" ? "Images will be scaled down to fit entirely inside their layout box, maintaining aspect ratio. No cropping." : "Images will be scaled to completely cover their layout box. Parts of the image may be cropped."}
                </p>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="border-t border-[var(--border-color)] p-6 shrink-0">
              <div className="flex flex-row gap-3">
                <button
                  onClick={() => !busy && setShowExportModal(false)}
                  disabled={busy}
                  className="flex-1 rounded-xl border border-[var(--border-color)] px-5 py-4 text-sm font-bold text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                >
                  Keep editing
                </button>
                <button
                  onClick={handleExport}
                  disabled={images.length === 0 || busy}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-5 py-4 text-sm font-bold text-[var(--bg-main)] transition hover:brightness-110 disabled:opacity-50"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-[var(--bg-main)] border-t-transparent animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    "Download PDF"
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
        </div>,
        document.querySelector("main") || document.body
      )}
    </div>
  );
}
