"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUpRight, FileImage, FileText, Leaf, UploadCloud } from "lucide-react";
import { processFiles } from "../utils/docProcessor";
import ThemeToggle from "./ThemeToggle";
import ToolHeader from "./ToolHeader";
import { useToast } from "./ToastProvider";

export default function LandingHero({ onFilesReady, theme, setTheme, onBackToHub, onFeedback }) {
  const { addToast, updateToast } = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const toastId = addToast(`Uploading ${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''}...`, "loading");
    setLoading(true); setError("");
    setProgress({ percent: 5, text: "Reading files..." });
    try {
      const readyPages = await processFiles(acceptedFiles, (p) => setProgress(p));
      updateToast(toastId, "Files processed successfully!", "success");
      onFilesReady(readyPages);
    } catch (caught) {
      updateToast(toastId, caught.message || "Could not read those files.", "error");
      setError(caught.message || "Could not read those files.");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [onFilesReady]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }, multiple: true });
  return (
    <div className="min-h-screen overflow-hidden">
      <ToolHeader theme={theme} setTheme={setTheme} onBackToHub={() => onBackToHub(false)} onFeedback={onFeedback} />
      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-12 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-24 lg:pt-20">
        <div className="animate-rise max-w-2xl text-[var(--text-main)]"><p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-coral)]">THE ULTIMATE STUDY DECK &amp; DOC TOOLKIT</p><h1 className="font-display text-6xl font-bold leading-[.94] tracking-[-.04em] text-[var(--text-main)] md:text-8xl">Merge, clean,<br /><span className="text-[var(--accent-mint)]">and print smarter.</span></h1><p className="mt-8 max-w-lg text-lg leading-relaxed text-[var(--text-muted)]">Combine multiple files, strip heavy backgrounds, reorder pages, and build customized study sheets—all right in your browser.</p><div className="mt-10 flex flex-wrap gap-3 text-sm text-[var(--text-muted)]"><span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2">PDF / images / DOCX</span></div></div>
        <div {...getRootProps()} className={`noise paper-shadow relative min-h-[390px] cursor-pointer rounded-[2rem] border-2 border-dashed p-8 text-[var(--text-main)] transition ${isDragActive ? "border-[var(--accent-coral)] bg-[var(--bg-panel)]" : "border-[var(--accent-mint)] bg-[var(--mint)]/35"}`}><input {...getInputProps()} /><div className="absolute right-7 top-7 grid h-11 w-11 place-items-center rounded-full bg-[var(--bg-panel)] text-[var(--text-main)]"><ArrowUpRight size={19} /></div><div className="flex h-full min-h-[330px] flex-col items-center justify-center text-center"><div className={`drop-pulse mb-7 grid h-20 w-20 place-items-center rounded-full bg-[var(--bg-panel)] text-[var(--text-main)] ${loading ? "animate-spin" : ""}`}><UploadCloud size={30} strokeWidth={1.7} /></div><h2 className="font-display text-3xl font-bold text-[var(--text-main)]">{loading ? (progress?.text || "Reading your files...") : isDragActive ? "Drop them here" : "Drop your files here"}</h2>{loading ? (<div className="mt-5 w-full max-w-xs space-y-2"><div className="flex justify-between text-xs font-bold text-[var(--text-muted)]"><span className="truncate pr-2">{progress?.text || "Processing..."}</span><span className="font-mono font-bold text-[var(--accent-mint)]">{progress?.percent || 0}%</span></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)]"><div className="h-full rounded-full bg-[var(--accent-mint)] transition-all duration-300 ease-out progress-shimmer" style={{ width: `${progress?.percent || 0}%` }} /></div></div>) : (<><p className="mt-3 text-sm text-[var(--text-muted)]">or click to browse your PDF, PNG, JPEG, or DOCX files</p><div className="mt-8 flex gap-2 text-[var(--text-muted)]"><FileText size={18} /><FileImage size={18} /></div></>)}</div></div>
        {error && <p className="lg:col-start-2 text-sm text-[var(--coral)]">{error}</p>}
      </section>
    </div>
  );
}
