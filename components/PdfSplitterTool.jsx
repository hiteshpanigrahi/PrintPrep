"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Check, CheckSquare, Download, LoaderCircle, Scissors, Settings, Square, UploadCloud } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument } from "pdf-lib";
import ToolHeader from "./ToolHeader";
import { useToast } from "./ToastProvider";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}


// Convert a sorted array of page numbers to range string: [1,2,3,5,7,8] -> "1-3, 5, 7-8"
function formatPageRange(pages) {
  if (!pages.length) return "";
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let prev = start;

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = cur;
      prev = cur;
    }
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(", ");
}

// Parse range string "1-5, 8, 11-15" into a Set of numbers
function parsePageRange(str, maxPages) {
  const result = new Set();
  if (!str || !str.trim()) return result;

  const parts = str.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(maxPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          result.add(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        result.add(num);
      }
    }
  }
  return result;
}

export default function PdfSplitterTool({ theme, setTheme, onBackToHub, onDownloaded }) {
  const { addToast, updateToast } = useToast();
  const [fileData, setFileData] = useState(null); // { name, arrayBuffer, totalPages }
  const [pages, setPages] = useState([]); // Array of { pageNum, thumbUrl }
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      pages.forEach((p) => URL.revokeObjectURL(p.thumbUrl));
    };
  }, [pages]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles.find((f) => f.type === "application/pdf");
    if (!file) return;

    setBusy(true);
    setProgress({ percent: 5, text: "Reading PDF document..." });
    // Revoke previous URLs before rendering new ones
    pages.forEach((p) => URL.revokeObjectURL(p.thumbUrl));
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
      const total = pdf.numPages;

      setFileData({
        name: file.name,
        arrayBuffer,
        totalPages: total,
      });

      const loadedPages = [];
      for (let i = 1; i <= total; i++) {
        setProgress({ percent: Math.round((i / total) * 90), text: `Generating preview for page ${i} of ${total}...` });
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        const thumbUrl = await new Promise((resolve) => canvas.toBlob((b) => resolve(URL.createObjectURL(b)), "image/jpeg", 0.8));
        loadedPages.push({ pageNum: i, thumbUrl });
      }

      setPages(loadedPages);
      // Select all by default
      const allSelected = new Set(Array.from({ length: total }, (_, i) => i + 1));
      setSelectedPages(allSelected);
      setRangeInput(formatPageRange(Array.from(allSelected)));
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  function handleRangeInputChange(e) {
    const val = e.target.value;
    setRangeInput(val);
    if (fileData) {
      const parsed = parsePageRange(val, fileData.totalPages);
      setSelectedPages(parsed);
    }
  }

  function togglePage(pageNum) {
    const next = new Set(selectedPages);
    if (next.has(pageNum)) {
      next.delete(pageNum);
    } else {
      next.add(pageNum);
    }
    setSelectedPages(next);
    setRangeInput(formatPageRange(Array.from(next)));
  }

  function selectAll() {
    if (!fileData) return;
    const all = new Set(Array.from({ length: fileData.totalPages }, (_, i) => i + 1));
    setSelectedPages(all);
    setRangeInput(formatPageRange(Array.from(all)));
  }

  function clearSelection() {
    setSelectedPages(new Set());
    setRangeInput("");
  }

  function invertSelection() {
    if (!fileData) return;
    const next = new Set();
    for (let i = 1; i <= fileData.totalPages; i++) {
      if (!selectedPages.has(i)) next.add(i);
    }
    setSelectedPages(next);
    setRangeInput(formatPageRange(Array.from(next)));
  }

  async function handleExtract() {
    if (!fileData || selectedPages.size === 0) return;
    setBusy(true);
    setProgress({ percent: 10, text: "Extracting selected pages..." });

    try {
      const srcDoc = await PDFDocument.load(fileData.arrayBuffer.slice(0));
      const destDoc = await PDFDocument.create();

      // Convert 1-based page numbers to 0-based sorted indices
      const sortedPageNums = Array.from(selectedPages).sort((a, b) => a - b);
      const pageIndices = sortedPageNums.map((num) => num - 1);

      setProgress({ percent: 40, text: `Copying ${pageIndices.length} pages...` });
      const copiedPages = await destDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((page) => destDoc.addPage(page));

      setProgress({ percent: 80, text: "Saving extracted PDF..." });
      const pdfBytes = await destDoc.save();

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = fileData.name.replace(/\.[^/.]+$/, "");
      a.download = `${baseName}_extracted.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      onDownloaded?.();
    } catch (err) {
      console.error("Extraction error:", err);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <ToolHeader theme={theme} setTheme={setTheme} onBackToHub={() => onBackToHub(file !== null)} badge="Splitter" />

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-coral)]">Page Splitter & Extractor</p>
            <h1 className="font-display text-3xl font-bold">Extract Specific Pages</h1>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => onDrop([...e.target.files])}
          />
          {fileData && (
            <div className="flex gap-2 self-end w-full md:w-auto justify-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2.5 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-coral)] hover:text-[var(--accent-coral)] w-1/2 md:w-auto"
              >
                Change PDF
              </button>
              <button
                onClick={handleExtract}
                disabled={busy || selectedPages.size === 0}
                className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-3 py-2.5 text-xs font-bold text-[var(--bg-main)] transition hover:brightness-110 disabled:opacity-50 w-1/2 md:w-auto"
              >
                {busy ? <LoaderCircle className="animate-spin" size={15} /> : <Download size={15} />}
                {busy ? `${progress?.percent ?? 0}%` : `Export`}
              </button>
            </div>
          )}
        </div>

        {progress && (
          <div className="mb-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 animate-rise">
            <div className="mb-2 flex justify-between text-xs">
              <span className="flex items-center gap-2 font-bold">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-mint)] animate-pulse" />
                {progress.text}
              </span>
              <span className="font-mono font-bold text-[var(--accent-mint)]">{progress.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-panel)]">
              <div className="h-full rounded-full progress-shimmer transition-all duration-300" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        )}

        {!fileData ? (
          <div
            {...getRootProps()}
            className={`flex min-h-[380px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
              isDragActive ? "border-[var(--accent-coral)] bg-[var(--bg-panel)]" : "border-[var(--accent-mint)] bg-[var(--mint)]/20"
            }`}
          >
            <input {...getInputProps()} />
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-panel)] text-[var(--accent-mint)] shadow-sm">
              <Scissors size={28} />
            </div>
            <h2 className="font-display text-2xl font-bold">{isDragActive ? "Drop PDF to split" : "Drop your PDF here"}</h2>
            <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">Select page ranges like 1-5, 8, 11-15 or click thumbnails to extract exactly what you want.</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-6 rounded-full bg-[var(--accent-mint)] px-6 py-3 text-sm font-bold text-[var(--bg-main)] hover:brightness-110"
            >
              Select PDF file
            </button>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start">
            {/* Main Canvas - Left Column */}
            <div className="flex-1 space-y-6">
              {/* Thumbnail Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                {pages.map((p) => {
                  const isSelected = selectedPages.has(p.pageNum);
                  return (
                    <div
                      key={p.pageNum}
                      onClick={() => togglePage(p.pageNum)}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-[var(--accent-mint)] bg-[var(--bg-card)] shadow-md"
                          : "border-[var(--border-color)] bg-[var(--bg-card)] opacity-40 hover:opacity-75"
                      }`}
                    >
                      <div className="checkerboard relative aspect-[3/4] overflow-hidden">
                        <img src={p.thumbUrl} alt={`Page ${p.pageNum}`} className="h-full w-full object-contain" />
                        {/* Page badge */}
                        <div
                          className={`absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                            isSelected ? "bg-[var(--accent-mint)] text-[var(--bg-main)]" : "bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-color)]"
                          }`}
                        >
                          {p.pageNum}
                        </div>
                        {/* Check indicator */}
                        <div className="absolute right-2 top-2">
                          {isSelected ? (
                            <div className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-mint)] text-[var(--bg-main)]">
                              <Check size={13} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="grid h-6 w-6 place-items-center rounded-full bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-color)]">
                              <Square size={13} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-2 text-center text-xs font-bold text-[var(--text-muted)]">
                        Page {p.pageNum}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="w-full shrink-0 space-y-6 lg:w-80">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                  <Settings size={20} /> Settings
                </h3>
                <div className="mb-6 flex items-center justify-between rounded-xl bg-[var(--bg-secondary)] p-4">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-[var(--accent-mint)] leading-none">{selectedPages.size}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mt-1">Pages Selected</span>
                  </div>
                  <div className="text-right text-sm font-semibold text-[var(--text-muted)]">
                    of {fileData.totalPages} total
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Range Selection
                  </label>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={handleRangeInputChange}
                    placeholder="e.g. 1-5, 8, 11-15"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-3.5 py-3 font-mono text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-mint)]"
                  />
                  <p className="mt-2 text-[10px] text-[var(--text-muted)]">Type a custom range or click thumbnails to select visually.</p>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={selectAll}
                    className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-2 py-2 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-mint)]"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-2 py-2 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-coral)]"
                  >
                    Clear
                  </button>
                  <button
                    onClick={invertSelection}
                    className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-2 py-2 text-xs font-bold text-[var(--text-main)] transition hover:border-[var(--accent-mint)]"
                  >
                    Invert Selection
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
