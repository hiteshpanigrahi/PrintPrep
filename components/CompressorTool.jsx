"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUpRight, Download, FileImage, FileText, LoaderCircle, Settings2, UploadCloud, X } from "lucide-react";
import JSZip from "jszip";
import ToolHeader from "./ToolHeader";
import { compressImage, compressPdf, packageImagesToPdf } from "../utils/compressorEngine";
import { useToast } from "./ToastProvider";

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function CompressorTool({ theme, setTheme, onBackToHub, onDownloaded }) {
  const { addToast, updateToast } = useToast();
  const [file, setFile] = useState(null); // original file
  const [targetKB, setTargetKB] = useState(500);
  const [profile, setProfile] = useState("balanced"); // balanced | text
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  
  // Results
  const [compressedBlobs, setCompressedBlobs] = useState(null); // Array of blobs (1 for image, N for pdf)
  const [totalCompressedSize, setTotalCompressedSize] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      addToast(`Uploaded ${acceptedFiles[0].name}`, "info");
      setFile(acceptedFiles[0]);
      setCompressedBlobs(null);
      setPreviewUrl(null);
      setTotalCompressedSize(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] },
    multiple: false,
  });

  const handleCompress = async () => {
    if (!file || targetKB <= 0) return;
    const toastId = addToast("Compressing file...", "loading");
    setBusy(true);
    setProgress({ percent: 10, text: "Analyzing document structure..." });
    setCompressedBlobs(null);
    setTotalCompressedSize(0);

    const targetBytes = targetKB * 1024;
    try {
      let blobs = [];
      if (file.type === "application/pdf") {
        blobs = await compressPdf(file, targetBytes, profile, setProgress);
      } else {
        setProgress({ percent: 50, text: "Compressing image..." });
        const resultBlob = await compressImage(file, targetBytes, profile);
        blobs = [resultBlob];
      }
      
      const totalSize = blobs.reduce((acc, b) => acc + b.size, 0);
      setCompressedBlobs(blobs);
      setTotalCompressedSize(totalSize);
      if (blobs.length > 0) {
        setPreviewUrl(URL.createObjectURL(blobs[0]));
      }
      updateToast(toastId, "Compression complete!", "success");
      setProgress({ percent: 100, text: "Done!" });
    } catch (err) {
      console.error(err);
      updateToast(toastId, "Error compressing file.", "error");
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(null), 1000);
    }
  };

  const savedPercent = file && totalCompressedSize > 0 
    ? Math.max(0, Math.round(((file.size - totalCompressedSize) / file.size) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <ToolHeader theme={theme} setTheme={setTheme} onBackToHub={() => onBackToHub(file !== null)} badge="Compressor" />

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-8">
          <p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-[var(--accent-coral)]">Smart PDF & Image Compressor</p>
          <h1 className="font-display text-3xl font-bold">Shrink Files to a Target Size</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column: File & Config */}
          <div className="space-y-6">
            {!file ? (
              <div
                {...getRootProps()}
                className={`noise paper-shadow flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed p-8 text-center transition ${isDragActive ? "border-[var(--accent-coral)] bg-[var(--bg-panel)]" : "border-[var(--accent-mint)] bg-[var(--mint)]/35"}`}
              >
                <input {...getInputProps()} />
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[var(--bg-panel)] text-[var(--accent-mint)] shadow-sm">
                  <UploadCloud size={24} />
                </div>
                <h2 className="font-display text-2xl font-bold">{isDragActive ? "Drop file here" : "Upload PDF or Image"}</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Max 1 file at a time.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm relative">
                <button onClick={() => { setFile(null); setCompressedBlobs(null); setPreviewUrl(null); setTotalCompressedSize(0); }} className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--accent-coral)]">
                  <X size={18} />
                </button>
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--bg-panel)] text-[var(--accent-mint)] shadow-sm">
                    {file.type === "application/pdf" ? <FileText size={20} /> : <FileImage size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--text-main)]">{file.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">Original: {formatBytes(file.size)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className={`rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 shadow-sm transition ${file ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={18} className="text-[var(--accent-mint)]" />
                <h3 className="font-bold text-sm">Compression Settings</h3>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Target Size (KB)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={targetKB}
                      onChange={(e) => setTargetKB(Number(e.target.value))}
                      className="w-24 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm font-mono focus:border-[var(--accent-mint)] outline-none"
                    />
                    <span className="text-sm font-bold text-[var(--text-muted)]">KB</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[100, 300, 500, 1024].map((kb) => (
                      <button
                        key={kb}
                        onClick={() => setTargetKB(kb)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${targetKB === kb ? "border-[var(--accent-mint)] bg-[var(--mint)] text-[var(--accent-mint)]" : "border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent-mint)] hover:text-[var(--text-main)]"}`}
                      >
                        {kb >= 1024 ? `${kb / 1024} MB` : `${kb} KB`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Profile</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setProfile("balanced")}
                      className={`flex-1 rounded-xl border p-3 text-left transition ${profile === "balanced" ? "border-[var(--accent-mint)] bg-[var(--bg-secondary)]" : "border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--accent-mint)]"}`}
                    >
                      <span className="block text-sm font-bold text-[var(--text-main)]">Balanced</span>
                      <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Good mix of res & quality</span>
                    </button>
                    <button
                      onClick={() => setProfile("text")}
                      className={`flex-1 rounded-xl border p-3 text-left transition ${profile === "text" ? "border-[var(--accent-mint)] bg-[var(--bg-secondary)]" : "border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--accent-mint)]"}`}
                    >
                      <span className="block text-sm font-bold text-[var(--text-main)]">Text-Optimized</span>
                      <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block">Sharper edges for notes</span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCompress}
                disabled={!file || busy}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-mint)] px-5 py-4 text-sm font-bold text-[var(--bg-main)] transition hover:brightness-110 disabled:opacity-50"
              >
                {busy ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowUpRight size={18} />}
                {busy ? "Compressing..." : "Compress File"}
              </button>
              
              {progress && (
                <div className="mt-4 space-y-2 animate-rise">
                  <div className="flex justify-between text-xs font-bold text-[var(--text-muted)]">
                    <span>{progress.text}</span>
                    <span className="font-mono text-[var(--accent-mint)]">{progress.percent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    <div className="h-full rounded-full bg-[var(--accent-mint)] transition-all duration-300 ease-out progress-shimmer" style={{ width: `${progress.percent}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 shadow-sm h-full flex flex-col">
              <h3 className="font-display text-lg font-bold mb-6">Before & After</h3>
              
              {!compressedBlobs ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] text-sm border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center">
                  <Settings2 size={32} className="mb-3 opacity-50" />
                  Upload a file and hit compress to see results here.
                </div>
              ) : (
                <div className="flex-1 flex flex-col animate-rise">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Original</p>
                      <p className="text-xl font-mono font-bold text-[var(--text-main)]">{formatBytes(file.size)}</p>
                    </div>
                    <div className="rounded-xl bg-[var(--mint)] border border-[var(--accent-mint)] p-4 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 rounded-bl-lg bg-[var(--accent-mint)] px-2 py-0.5 text-[10px] font-bold text-[var(--bg-main)]">
                        -{savedPercent}%
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Compressed</p>
                      <p className="text-xl font-mono font-black text-[var(--accent-mint)]">{formatBytes(totalCompressedSize)}</p>
                    </div>
                  </div>
                  
                  {previewUrl && (
                    <div className="flex-1 min-h-0 mb-6 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] overflow-hidden flex items-center justify-center p-2">
                      <img src={previewUrl} alt="Compressed preview" className="max-w-full max-h-[200px] object-contain rounded-lg" />
                    </div>
                  )}

                  <div className="mt-auto">
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-coral)] px-5 py-4 text-sm font-bold text-[var(--bg-main)] transition hover:brightness-110"
                    >
                      <Download size={18} /> Download Compressed File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showExportModal && compressedBlobs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-color)] bg-[var(--bg-panel)] p-6 paper-shadow animate-rise relative">
            <button onClick={() => setShowExportModal(false)} className="absolute right-5 top-5 text-[var(--text-muted)] hover:text-[var(--text-main)]">
              <X size={18} />
            </button>
            <h3 className="font-display text-xl font-bold mb-1">Export Format</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">Choose how you want to download your optimized file.</p>
            
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    const pdfBlob = await packageImagesToPdf(compressedBlobs);
                    const url = URL.createObjectURL(pdfBlob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${file.name.split('.')[0]}_compressed.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setShowExportModal(false);
                    addToast("File downloaded successfully!", "success");
                    onDownloaded?.();
                  } catch (e) {
                    addToast("Error packing PDF", "error");
                  }
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 text-left transition hover:border-[var(--accent-mint)] hover:bg-[var(--bg-secondary)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--bg-panel)] text-[var(--accent-mint)]">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-main)]">Download as PDF</p>
                  <p className="text-xs text-[var(--text-muted)]">Perfect for multi-page documents</p>
                </div>
              </button>

              <button
                onClick={async () => {
                  try {
                    if (compressedBlobs.length === 1) {
                      const url = URL.createObjectURL(compressedBlobs[0]);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${file.name.split('.')[0]}_compressed.jpg`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } else {
                      const zip = new JSZip();
                      compressedBlobs.forEach((b, i) => zip.file(`page_${i + 1}.jpg`, b));
                      const zipBlob = await zip.generateAsync({ type: "blob" });
                      const url = URL.createObjectURL(zipBlob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${file.name.split('.')[0]}_images.zip`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                    setShowExportModal(false);
                    addToast("Images exported successfully!", "success");
                    onDownloaded?.();
                  } catch (e) {
                    addToast("Error exporting images", "error");
                  }
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 text-left transition hover:border-[var(--accent-mint)] hover:bg-[var(--bg-secondary)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--bg-panel)] text-[var(--accent-coral)]">
                  <FileImage size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-main)]">Download as Image(s)</p>
                  <p className="text-xs text-[var(--text-muted)]">{compressedBlobs.length > 1 ? "Downloads as a .zip file" : "Downloads as a single JPEG"}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
