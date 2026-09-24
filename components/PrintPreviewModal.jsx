"use client";

import { useState } from "react";
import { Download, LoaderCircle, X } from "lucide-react";
import { createOptimizedPdf, getLayoutMetrics } from "../utils/nUpLayoutEngine";
import { createDocx } from "../utils/docxExporter";
import SidebarSettings from "./SidebarSettings";

export default function PrintPreviewModal({ pages, nUp, setNUp, onClose, onDownloaded }) {
  const [busy, setBusy] = useState(false);
  const [format, setFormat] = useState("pdf");
  const included = pages.filter((page) => page.isIncluded);
  const metrics = getLayoutMetrics(nUp);
  const sheets = [];
  for (let index = 0; index < included.length; index += nUp) sheets.push(included.slice(index, index + nUp));

  async function download() {
    setBusy(true);
    const blob = format === "pdf" ? new Blob([await createOptimizedPdf(included, nUp)], { type: "application/pdf" }) : await createDocx(included, nUp);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = format === "pdf" ? "printprep.pdf" : "printprep.docx";
    anchor.click();
    URL.revokeObjectURL(url);
    setBusy(false);
    onDownloaded();
  }

  return <div className="modal-backdrop fixed inset-0 z-20 flex items-center justify-center p-4"><div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 text-[var(--text-main)] paper-shadow md:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent-coral)]">Final check</p><h2 className="font-display text-3xl font-bold">Your download preview</h2><p className="mt-1 text-sm text-[var(--text-muted)]">{included.length} slides · {sheets.length} A4 sheets · {nUp}-up</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-coral)] text-[var(--bg-main)] transition hover:brightness-110" aria-label="Close preview"><X size={17} /></button></div><div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start"><div className="min-w-0"><div className="preview-scroll flex max-w-full snap-x snap-mandatory overflow-x-auto rounded-2xl bg-preview p-5 pb-7"><div className="preview-track">{sheets.map((sheet, sheetIndex) => <div key={`sheet-${sheetIndex}`} className="preview-sheet snap-center"><p className="mb-2 text-center text-xs font-bold uppercase tracking-[.16em] text-[var(--text-muted)]">Sheet {sheetIndex + 1} of {sheets.length}</p><div className="mx-auto w-full max-w-[350px]"><div className="relative aspect-[595/842] w-full bg-[var(--bg-card)] shadow-xl" style={{ padding: `${(metrics.margin / 595.28) * 100}%` }}>{sheet.map((page) => <div key={page.id} className="mb-[3.3%] overflow-hidden border border-[var(--border-color)]" style={{ height: `${100 / nUp - 3}%` }}><img src={page.thumbnailUrl} alt="Preview slide" className="h-full w-full object-contain" /></div>)}</div></div></div>)}</div></div></div><SidebarSettings nUp={nUp} setNUp={setNUp} format={format} setFormat={setFormat} /></div><div className="mt-7 flex justify-end border-t border-[var(--border-color)] pt-5"><div className="flex flex-col-reverse gap-3 sm:flex-row"><button onClick={onClose} className="rounded-full border border-[var(--border-color)] px-5 py-3 text-sm font-bold text-[var(--text-main)]">Keep editing</button><button onClick={download} disabled={busy || !included.length} className="flex items-center justify-center gap-2 rounded-full bg-[var(--accent-coral)] px-6 py-3 text-sm font-bold text-[var(--bg-main)] transition hover:brightness-110 disabled:opacity-50">{busy ? <LoaderCircle className="animate-spin" size={17} /> : <Download size={17} />} {busy ? "Building file..." : `Download ${format.toUpperCase()}`}</button></div></div></div></div>;
}
