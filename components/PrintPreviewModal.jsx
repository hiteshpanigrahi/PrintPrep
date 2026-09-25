"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, LoaderCircle, X, Layers, FileText, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { createOptimizedPdf, getLayoutMetrics } from "../utils/nUpLayoutEngine";
import { createDocx } from "../utils/docxExporter";
import PreviewPanel from "./PreviewPanel";
import SegmentedControl from "./SegmentedControl";

export default function PrintPreviewModal({ pages, nUp, setNUp, onClose, onDownloaded }) {
  const previewPanelRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState("pdf");
  const [progress, setProgress] = useState(null);
  const included = pages.filter((page) => page.isIncluded);
  const metrics = getLayoutMetrics(nUp);

  useEffect(() => {
    setMounted(true);
  }, []);
  const sheets = [];
  for (let index = 0; index < included.length; index += nUp) sheets.push(included.slice(index, index + nUp));

  async function download() {
    setBusy(true);
    setProgress({ percent: 5, text: `Starting ${format.toUpperCase()} compilation...` });
    try {
      const blob =
        format === "pdf"
          ? new Blob([await createOptimizedPdf(included, nUp, (p) => setProgress(p))], { type: "application/pdf" })
          : await createDocx(included, nUp, (p) => setProgress(p));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = format === "pdf" ? "printprep.pdf" : "printprep.docx";
      anchor.click();
      URL.revokeObjectURL(url);
      setBusy(false);
      setProgress(null);
      onDownloaded();
    } catch (err) {
      console.error(err);
      setBusy(false);
      setProgress(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row h-auto lg:h-full max-h-[92vh] w-full max-w-6xl overflow-y-auto lg:overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] text-[var(--text-main)] paper-shadow">

        {/* Main Content (Left) */}
        <div className="flex-1 flex flex-col shrink-0 lg:shrink lg:overflow-hidden">
          <div className="flex-1 flex flex-col p-5 sm:p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent-coral)]">Final check</p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold">Preview</h2>
                <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">
                  {included.length} slides · {sheets.length} A4 sheets · {nUp}-up
                </p>
              </div>
              {/* Mobile close button */}
              <button
                onClick={onClose}
                className="lg:hidden grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-coral)] text-[var(--bg-main)] transition hover:brightness-110"
                aria-label="Close preview"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-6 w-full min-h-[360px] sm:min-h-[400px] lg:min-h-0 lg:h-full lg:flex-1">
              <PreviewPanel ref={previewPanelRef} pages={pages} nUp={nUp} sheets={sheets} metrics={metrics} />
            </div>
          </div>

          <div className="hidden lg:flex p-6 md:p-8 border-t border-[var(--border-color)] bg-[var(--bg-main)] items-center justify-between">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-[var(--border-color)] px-8 py-3.5 text-sm font-bold text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)] disabled:opacity-50"
            >
              Keep editing
            </button>
            
            {/* Scroll Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => previewPanelRef.current?.scrollBy(-350)}
                disabled={sheets.length <= 1}
                className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-main)] transition-colors hover:bg-[var(--border-color)] active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} />
              </button>
              
              <button
                onClick={() => previewPanelRef.current?.scrollBy(350)}
                disabled={sheets.length <= 1}
                className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-main)] transition-colors hover:bg-[var(--border-color)] active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                aria-label="Scroll right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="w-full lg:w-[380px] shrink-0 lg:flex-none border-t lg:border-t-0 lg:border-l border-[var(--border-color)] bg-[var(--bg-panel)] flex flex-col justify-between overflow-y-visible lg:overflow-y-auto custom-scrollbar">
          <div className="p-5 sm:p-6 md:p-8">
            <div className="hidden lg:flex justify-end mb-6">
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-coral)] text-[var(--bg-main)] transition hover:brightness-110"
                aria-label="Close preview"
              >
                <X size={17} />
              </button>
            </div>

            <h3 className="font-display text-xl font-bold mb-6">Export Settings</h3>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-mint)]/20 text-[var(--accent-mint)]">
                    <Layers size={20} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-[var(--text-main)]">Sheet layout</span>
                    <span className="block text-xs text-[var(--text-muted)]">Stacked vertically on A4</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    { id: 1, title: "Full page", desc: "Maximum writing room" },
                    { id: 2, title: "2-up", desc: "A balanced study sheet" },
                    { id: 3, title: "3-up", desc: "Compact and economical" },
                    { id: 4, title: "4-up", desc: "Maximum ink savings" },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setNUp(opt.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 transition text-left ${nUp === opt.id
                          ? "border-[var(--accent-mint)] bg-[var(--accent-mint)]/5"
                          : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]"
                        }`}
                    >
                      <div>
                        <span className="block font-bold text-[var(--text-main)]">{opt.title}</span>
                        <span className="block text-xs text-[var(--text-muted)] mt-1">{opt.desc}</span>
                      </div>
                      <div className={`grid h-6 w-6 place-items-center rounded-full border ${nUp === opt.id
                          ? "border-[var(--accent-mint)] bg-[var(--accent-mint)] text-[var(--bg-main)]"
                          : "border-[var(--border-color)] border-2"
                        }`}>
                        {nUp === opt.id && <Check size={14} strokeWidth={3} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-[var(--border-color)]" />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[var(--accent-coral)]" />
                  <span className="text-sm font-bold text-[var(--text-main)]">Export format</span>
                </div>
                <div className="w-full">
                  <SegmentedControl
                    items={['PDF', 'DOCX']}
                    value={format.toUpperCase()}
                    onChange={(val) => setFormat(val.toLowerCase())}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 pt-0 lg:pt-6 border-t-0 lg:border-t border-[var(--border-color)] mt-auto bg-[var(--bg-panel)]">
            {busy && progress && (
              <div className="mb-4 animate-rise">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <LoaderCircle className="animate-spin text-[var(--accent-mint)]" size={13} />
                    {progress.text}
                  </span>
                  <span className="font-mono font-bold text-[var(--accent-mint)]">{progress.percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-mint)] transition-all duration-300 ease-out progress-shimmer"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={download}
              disabled={busy || !included.length}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-5 py-4 text-sm font-bold text-[var(--bg-main)] transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Download size={17} />}{" "}
              {busy ? (progress ? `Exporting...` : "Building...") : `Download`}
            </button>
            <button
              onClick={onClose}
              disabled={busy}
              className="mt-3 lg:hidden w-full rounded-xl border border-[var(--border-color)] px-5 py-4 text-sm font-bold text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)] disabled:opacity-50"
            >
              Keep editing
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.querySelector("main") || document.body
  );
}
