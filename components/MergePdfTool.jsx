"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { CheckSquare, Download, Eye, EyeOff, FilePlus2, Files, GripVertical, LoaderCircle, Square, Trash2, UploadCloud } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { processFiles } from "../utils/docProcessor";
import ToolHeader from "./ToolHeader";
import Toolbar from "./Toolbar";
import ThumbnailGrid from "./ThumbnailGrid";
import ConfirmModal from "./ConfirmModal";
import PrintPreviewModal from "./PrintPreviewModal";
import { useToast } from "./ToastProvider";


export default function MergePdfTool({ theme, setTheme, onBackToHub, onDownloaded }) {
  const { addToast, updateToast } = useToast();
  const [pages, setPages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [nUp, setNUp] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const fileInputRef = useRef(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    // Capture current pages in a ref to clean up on unmount
    const currentPages = pages;
    return () => {
      // Intentionally only cleaning up when the component unmounts entirely
      // to avoid breaking images during re-renders or additions.
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const toastId = addToast(`Uploading ${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''}...`, "loading");
    setProgress({ percent: 5, text: "Reading files..." });
    try {
      const newPages = await processFiles(acceptedFiles, (p) => setProgress(p));
      setPages((prev) => [...prev, ...newPages]);
      updateToast(toastId, "Files processed successfully!", "success");
    } catch (err) {
      console.error(err);
      updateToast(toastId, err.message || "Error reading files", "error");
    } finally {
      setProgress(null);
    }
  }, [addToast, updateToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: true,
    noClick: true,
  });

  function requestReset() {
    setConfirm({ title: "Start over?", message: "This will remove all files and return you to the upload screen.", confirmLabel: "Start over", action: () => setPages([]) });
  }

  function requestRestore() {
    setConfirm({ title: "Restore all pages?", message: "Every skipped page will be included again.", confirmLabel: "Restore all", action: () => { setPages(pages.map((p) => ({ ...p, isIncluded: true }))); setConfirm(null); } });
  }

  const included = pages.filter((p) => p.isIncluded).length;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <ToolHeader theme={theme} setTheme={setTheme} onBackToHub={() => onBackToHub(pages.length > 0)} badge="Merge" />

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-coral)]">Merge & Organize</p>
            <h1 className="font-display text-3xl font-bold">Combine PDFs, Images & Docs</h1>
            {pages.length > 0 && <p className="mt-1 text-sm text-[var(--text-muted)]">{included} of {pages.length} pages included · drag to reorder</p>}
          </div>
          {pages.length > 0 && (
            <button onClick={() => setShowPreview(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-3 py-2.5 text-xs font-bold text-[var(--bg-main)] transition hover:brightness-110 self-end w-1/2 md:w-auto">
              <FilePlus2 size={15} /> Export
            </button>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" multiple className="hidden" onChange={(e) => onDrop([...e.target.files])} />

        {pages.length === 0 ? (
          <div {...getRootProps()} className={`flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition ${isDragActive ? "border-[var(--accent-coral)] bg-[var(--bg-panel)]" : "border-[var(--accent-mint)] bg-[var(--mint)]/20"}`}>
            <input {...getInputProps()} />
            <UploadCloud size={36} className="mb-4 text-[var(--text-muted)]" strokeWidth={1.5} />
            <p className="font-display text-2xl font-bold">{isDragActive ? "Drop files here" : "Drop files to merge"}</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">PDF, DOCX, PNG, JPEG — all accepted</p>
            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="mt-6 rounded-full bg-[var(--accent-mint)] px-6 py-3 text-sm font-bold text-[var(--bg-main)]">
              Browse files
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-6">
              <Toolbar pages={pages} setPages={setPages} onRequestReset={requestReset} onRequestRestore={requestRestore} showFilters={false} />
              
              
              {progress && (
                <div className="mb-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 animate-rise">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold"><span className="h-2 w-2 rounded-full bg-[var(--accent-mint)] animate-pulse" />{progress.text}</span>
                    <span className="font-mono font-bold text-[var(--accent-mint)]">{progress.percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-panel)]">
                    <div className="h-full rounded-full progress-shimmer transition-all duration-300" style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>
              )}

              <ThumbnailGrid pages={pages} setPages={setPages} onDelete={(id) => setPages(pages.filter((page) => page.id !== id))} onAddFile={() => fileInputRef.current?.click()} onAddBlank={(idx) => {
                const blankUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
                const newPage = { id: crypto.randomUUID(), fileType: "BLANK PAGE", thumbnailUrl: blankUrl, isIncluded: true, rotation: 0 };
                const nextPages = [...pages];
                nextPages.splice(idx, 0, newPage);
                setPages(nextPages);
              }} />
            </div>
          </div>
        )}
      </div>

      {confirm && <ConfirmModal {...confirm} onConfirm={() => { confirm.action(); setConfirm(null); }} onClose={() => setConfirm(null)} />}
      {showPreview && <PrintPreviewModal pages={pages} nUp={nUp} setNUp={setNUp} onClose={() => setShowPreview(false)} onDownloaded={() => { setShowPreview(false); onDownloaded?.(); }} />}
    </div>
  );
}
