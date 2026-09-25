"use client";

import { useState } from "react";
import { Download, LoaderCircle, X, Layers, FileText, Check } from "lucide-react";
import { createOptimizedPdf, getLayoutMetrics } from "../utils/nUpLayoutEngine";
import { createDocx } from "../utils/docxExporter";
import PreviewPanel from "./PreviewPanel";

export default function PrintPreviewModal({ pages, nUp, setNUp, onClose, onDownloaded }) {
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState("pdf");
  const [progress, setProgress] = useState(null);
  const included = pages.filter((page) => page.isIncluded);
  const metrics = getLayoutMetrics(nUp);
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

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row h-full max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] text-[var(--text-main)] paper-shadow">

        {/* Main Content (Left) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent-coral)]">Final check</p>
              <h2 className="font-display text-3xl font-bold">Preview</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
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

          <div className="mt-8 flex-1 min-h-0">
            <PreviewPanel pages={pages} nUp={nUp} sheets={sheets} metrics={metrics} />
          </div>
          </div>
          
          <div className="hidden lg:block p-6 md:p-8 border-t border-[var(--border-color)] bg-[var(--bg-main)]">
            <button
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-[var(--border-color)] px-8 py-3.5 text-sm font-bold text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)] disabled:opacity-50"
            >
              Keep editing
            </button>
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="w-full lg:w-[380px] flex-1 lg:flex-none border-t lg:border-t-0 lg:border-l border-[var(--border-color)] bg-[var(--bg-panel)] flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-8">
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
                      className={`flex w-full items-center justify-between rounded-xl border p-4 transition text-left ${
                        nUp === opt.id
                          ? "border-[var(--accent-mint)] bg-[var(--accent-mint)]/5"
                          : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      <div>
                        <span className="block font-bold text-[var(--text-main)]">{opt.title}</span>
                        <span className="block text-xs text-[var(--text-muted)] mt-1">{opt.desc}</span>
                      </div>
                      <div className={`grid h-6 w-6 place-items-center rounded-full border ${
                        nUp === opt.id
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
                <div className="relative flex rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1 w-full">
                  <div 
                    className="absolute bottom-1 left-1 top-1 w-[calc((100%-8px)/2)] rounded-lg bg-[var(--bg-card)] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    style={{ transform: `translateX(calc(${format === "pdf" ? 0 : 1} * 100%))` }}
                  />
                  <button
                    onClick={() => setFormat("pdf")}
                    className={`relative z-10 flex-1 rounded-lg py-2.5 text-xs font-bold transition-colors duration-300 ${format === "pdf" ? "text-[var(--text-main)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => setFormat("docx")}
                    className={`relative z-10 flex-1 rounded-lg py-2.5 text-xs font-bold transition-colors duration-300 ${format === "docx" ? "text-[var(--text-main)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                  >
                    DOCX
                  </button>
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
    </div>
  );
}
