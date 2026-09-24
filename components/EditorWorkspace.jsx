"use client";

import { useRef, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { processFiles } from "../utils/docProcessor";
import Toolbar from "./Toolbar";
import ThumbnailGrid from "./ThumbnailGrid";
import ConfirmModal from "./ConfirmModal";
import ThemeToggle from "./ThemeToggle";

export default function EditorWorkspace({ pages, setPages, theme, setTheme, onReset, onPreview }) {
  const inputRef = useRef(null);
  const [insertAt, setInsertAt] = useState(pages.length);
  const [confirm, setConfirm] = useState(null);

  async function addFile(event) {
    const files = [...event.target.files];
    if (!files.length) return;
    const additions = await processFiles(files);
    setPages([...pages.slice(0, insertAt), ...additions, ...pages.slice(insertAt)]);
    event.target.value = "";
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
  return <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]"><header className="border-b border-[var(--border-color)] bg-[var(--bg-panel)]"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--text-main)] text-[var(--accent-mint)]">✦</span><span className="font-display text-lg font-bold">PrintPrep</span><span className="hidden rounded-full bg-[var(--mint)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:inline">workspace</span></div><div className="flex items-center gap-2"><ThemeToggle theme={theme} setTheme={setTheme} /><button onClick={onPreview} className="flex items-center gap-2 rounded-full bg-[var(--accent-coral)] px-5 py-3 text-sm font-bold text-[var(--bg-main)] transition hover:brightness-110"><FilePlus2 size={16} /> Export</button></div></div></header><div className="mx-auto max-w-7xl px-6 py-8 lg:px-10"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-coral)]">Edit your stack</p><p className="text-sm text-[var(--text-muted)]">{included} of {pages.length} pages included · drag to reorder</p></div></div><input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" multiple className="hidden" onChange={addFile} /><Toolbar pages={pages} setPages={setPages} onRequestReset={requestReset} onRequestRestore={requestRestore} /><div className="mt-8"><ThumbnailGrid pages={pages} setPages={setPages} onDelete={(id) => setPages(pages.filter((page) => page.id !== id))} onAddBlank={addBlank} onAddFile={requestFile} /></div></div>{confirm && <ConfirmModal {...confirm} onConfirm={() => confirm.action()} onClose={() => setConfirm(null)} />}</div>;
}
