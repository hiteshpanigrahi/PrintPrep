"use client";

import { useRef, useState } from "react";
import { Check, FilePlus2, Layers3 } from "lucide-react";
import { processFiles } from "../utils/docProcessor";
import Toolbar from "./Toolbar";
import ThumbnailGrid from "./ThumbnailGrid";
import ConfirmModal from "./ConfirmModal";
import ToolHeader from "./ToolHeader";

export default function EditorWorkspace({ pages, setPages, nUp, setNUp, theme, setTheme, onReset, onPreview, onBackToHub }) {
  const inputRef = useRef(null);
  const [insertAt, setInsertAt] = useState(pages.length);
  const [confirm, setConfirm] = useState(null);
  const [importProgress, setImportProgress] = useState(null);

  async function addFile(event) {
    const files = [...event.target.files];
    if (!files.length) return;
    setImportProgress({ percent: 5, text: `Reading ${files.length} file${files.length > 1 ? "s" : ""}...` });
    try {
      const additions = await processFiles(files, (p) => setImportProgress(p));
      setPages([...pages.slice(0, insertAt), ...additions, ...pages.slice(insertAt)]);
    } catch (err) {
      console.error(err);
    } finally {
      setImportProgress(null);
      event.target.value = "";
    }
  }

  function requestFile(index) {
    setInsertAt(index);
    inputRef.current?.click();
  }

  function addBlank(index) {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 700;
    const context = canvas.getContext("2d");
    context.fillStyle = theme === "dark" ? "#202d28" : "#fffdf6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const blank = { id: `blank-${Date.now()}`, sourceFileName: "Blank page", originalIndex: pages.length, thumbnailUrl: canvas.toDataURL("image/jpeg"), fileType: "blank", isIncluded: true, inverted: false, rotation: 0 };
    setPages([...pages.slice(0, index), blank, ...pages.slice(index)]);
  }

  function requestReset() {
    setConfirm({ title: "Start over?", message: "This will remove every page and return you to the upload screen. Your current edits cannot be recovered.", confirmLabel: "Start over", action: onReset });
  }

  function requestRestore() {
    setConfirm({ title: "Restore all pages?", message: "Every skipped page will be included in the print pack again.", confirmLabel: "Restore all", action: () => { setPages(pages.map((page) => ({ ...page, isIncluded: true }))); setConfirm(null); } });
  }

  const included = pages.filter((page) => page.isIncluded).length;
  return <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
    <ToolHeader theme={theme} setTheme={setTheme} onBackToHub={() => onBackToHub(pages.length > 0)} badge="workspace" />
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-coral)]">Edit your stack</p>
          <h1 className="font-display text-3xl font-bold">Slide & Deck Optimizer</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{included} of {pages.length} pages included · drag to reorder</p>
        </div>
        <button onClick={onPreview} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-3 py-2.5 text-xs font-bold text-[var(--bg-main)] transition hover:brightness-110 self-end w-1/2 md:w-auto">
          <FilePlus2 size={15} /> Export
        </button>
      </div>

      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" multiple className="hidden" onChange={addFile} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <Toolbar pages={pages} setPages={setPages} onRequestReset={requestReset} onRequestRestore={requestRestore} />
          <ThumbnailGrid pages={pages} setPages={setPages} onDelete={(id) => setPages(pages.filter((page) => page.id !== id))} onAddBlank={addBlank} onAddFile={requestFile} />
        </div>
      </div>
    </div>
    {confirm && <ConfirmModal {...confirm} onConfirm={() => confirm.action()} onClose={() => setConfirm(null)} />}
    {importProgress && <div className="fixed inset-0 z-50 flex items-end justify-center p-6 pointer-events-none"><div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-5 shadow-2xl animate-rise"><div className="flex items-center justify-between text-xs mb-3"><span className="flex items-center gap-2 font-bold text-[var(--text-main)]"><span className="h-2 w-2 rounded-full bg-[var(--accent-mint)] animate-pulse" />{importProgress.text}</span><span className="font-mono font-bold text-[var(--accent-mint)]">{importProgress.percent}%</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]"><div className="h-full rounded-full progress-shimmer transition-all duration-300 ease-out" style={{ width: `${importProgress.percent}%` }} /></div></div></div>}
  </div>;
}
