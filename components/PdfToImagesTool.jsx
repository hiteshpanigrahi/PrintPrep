"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Download, FilePlus2, LoaderCircle, UploadCloud, X, RotateCw, Trash2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import ToolHeader from "./ToolHeader";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}


async function renderPdfToImages(file, scale, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const total = pdf.numPages;
  const results = [];
  for (let i = 1; i <= total; i++) {
    onProgress?.({ percent: Math.round((i / total) * 90), text: `Rendering page ${i} of ${total}...` });
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const url = await new Promise((resolve) => canvas.toBlob((b) => resolve(URL.createObjectURL(b)), "image/png"));
    results.push({ pageNum: i, url });
  }
  onProgress?.({ percent: 100, text: "Done!" });
  return results;
}

import JSZip from "jszip";

export default function PdfToImagesTool({ theme, setTheme, onBackToHub, onDownloaded }) {
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [scale, setScale] = useState(2);
  const [pdfName, setPdfName] = useState("document");
  const fileInputRef = useRef(null);

  // Cleanup object URLs on unmount or when images change
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const pdf = acceptedFiles.find((f) => f.type === "application/pdf");
    if (!pdf) return;
    setBusy(true);
    setPdfName(pdf.name.replace(/\.[^/.]+$/, ""));
    setProgress({ percent: 5, text: "Loading PDF..." });
    // Revoke previous URLs before setting new ones
    images.forEach((img) => URL.revokeObjectURL(img.url));
    try {
      const pages = await renderPdfToImages(pdf, scale, setProgress);
      setImages(pages);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [scale, images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const removeImage = (pageNum) => {
    setImages(prev => prev.filter(img => img.pageNum !== pageNum));
  };

  const rotateImage = (pageNum) => {
    setImages(prev => prev.map(img => img.pageNum === pageNum ? { ...img, rotation: ((img.rotation || 0) + 90) % 360 } : img));
  };

  async function getRotatedBlobUrl(img) {
    if (!img.rotation) return img.url;
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const isLandscape = (img.rotation / 90) % 2 !== 0;
        canvas.width = isLandscape ? image.height : image.width;
        canvas.height = isLandscape ? image.width : image.height;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((img.rotation * Math.PI) / 180);
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        canvas.toBlob(blob => resolve(URL.createObjectURL(blob)), 'image/png');
      };
      image.src = img.url;
    });
  }

  async function downloadOne(img) {
    const url = await getRotatedBlobUrl(img);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pdfName}_page_${img.pageNum}.png`;
    a.click();
    if (url !== img.url) URL.revokeObjectURL(url);
    onDownloaded?.();
  }

  async function downloadAllZip() {
    if (!images.length) return;
    setBusy(true);
    setProgress({ percent: 10, text: "Creating ZIP archive..." });

    try {
      const zip = new JSZip();
      for (const img of images) {
        const url = await getRotatedBlobUrl(img);
        const response = await fetch(url);
        const blob = await response.blob();
        zip.file(`${pdfName}_page_${img.pageNum}.png`, blob);
        if (url !== img.url) URL.revokeObjectURL(url);
      }

      const zipBlob = await zip.generateAsync(
        { type: "blob" },
        (metadata) => {
          setProgress({
            percent: Math.round(metadata.percent),
            text: `Compressing ZIP (${Math.round(metadata.percent)}%)...`,
          });
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pdfName}_images.zip`;
      a.click();
      URL.revokeObjectURL(url);
      onDownloaded?.();
    } catch (err) {
      console.error("ZIP creation failed:", err);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <ToolHeader theme={theme} setTheme={setTheme} onBackToHub={onBackToHub} badge="PDF → Images" />

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-coral)]">PDF Renderer</p>
            <h1 className="font-display text-3xl font-bold">Export PDF Pages as Images</h1>
            {images.length > 0 && <p className="mt-1 text-sm text-[var(--text-muted)]">{images.length} pages rendered</p>}
          </div>
          <div className="flex items-center gap-2">
            {/* Resolution selector */}
            <div className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-panel)] px-4 py-2">
              <span className="text-xs font-bold text-[var(--text-muted)]">Quality</span>
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${scale === s ? "bg-[var(--accent-mint)] text-[var(--bg-main)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                >
                  {s === 1 ? "Standard" : s === 2 ? "High" : "Maximum"}
                </button>
              ))}
            </div>
            {images.length > 0 && (
              <button
                onClick={downloadAllZip}
                disabled={busy}
                className="flex items-center gap-2 rounded-full bg-[var(--accent-coral)] px-5 py-2.5 text-sm font-bold text-[var(--bg-main)] transition hover:brightness-110 disabled:opacity-50"
              >
                {busy ? <LoaderCircle className="animate-spin" size={15} /> : <Download size={15} />}
                {busy ? `${progress?.percent ?? 0}% Compressing...` : "Download All as ZIP"}
              </button>
            )}
          </div>
        </div>

        {progress && (
          <div className="mb-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 animate-rise">
            <div className="mb-2 flex justify-between text-xs">
              <span className="flex items-center gap-2 font-bold"><span className="h-2 w-2 rounded-full bg-[var(--accent-mint)] animate-pulse" />{progress.text}</span>
              <span className="font-mono font-bold text-[var(--accent-mint)]">{progress.percent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-panel)]">
              <div className="h-full rounded-full progress-shimmer transition-all duration-300" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        )}

        <div {...getRootProps()} className={`mb-8 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition ${isDragActive ? "border-[var(--accent-coral)] bg-[var(--bg-panel)]" : images.length ? "border-[var(--border-color)]" : "border-[var(--accent-mint)] bg-[var(--mint)]/20"}`}>
          <input {...getInputProps()} />
          {busy ? (
            <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
              <LoaderCircle size={28} className="animate-spin" />
              <p className="text-sm font-bold">Rendering pages...</p>
            </div>
          ) : (
            <>
              <UploadCloud size={28} className="mb-2 text-[var(--text-muted)]" strokeWidth={1.5} />
              <p className="font-bold text-sm">{isDragActive ? "Drop PDF here" : images.length ? "Drop a new PDF to replace" : "Drop a PDF to extract pages"}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">or click to browse — one file at a time</p>
            </>
          )}
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {images.map((img) => (
              <div key={img.pageNum} className="group relative rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                <div className="checkerboard relative aspect-[3/4]">
                  <img src={img.url} alt={`Page ${img.pageNum}`} className="h-full w-full object-contain transition-transform duration-300" style={{ transform: `rotate(${img.rotation || 0}deg)` }} />
                  <div className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[var(--accent-mint)] text-[10px] font-bold text-[var(--bg-main)]">{img.pageNum}</div>
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm pointer-events-none">
                    <button onClick={(e) => { e.stopPropagation(); rotateImage(img.pageNum); }} className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-110" aria-label="Rotate">
                      <RotateCw size={18} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeImage(img.pageNum); }} className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white text-red-600 shadow-lg transition hover:scale-110" aria-label="Remove">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <button
                    onClick={() => downloadOne(img)}
                    className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-bold opacity-0 transition group-hover:opacity-100 border border-[var(--border-color)] hover:bg-[var(--accent-mint)] hover:text-[var(--bg-main)] z-10"
                  >
                    <Download size={12} /> Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
