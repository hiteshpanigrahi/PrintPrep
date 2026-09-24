import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument } from "pdf-lib";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

/**
 * Compress an image File/Blob to roughly the targetBytes size.
 * Returns a new Blob.
 */
export async function compressImage(blob, targetBytes, profile = "balanced", onProgress) {
  const url = URL.createObjectURL(blob);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  URL.revokeObjectURL(url);

  let scale = 1.0;
  let canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  let bestBlob = null;

  // First try binary search on quality without resizing
  bestBlob = await binarySearchQuality(canvas, targetBytes, profile);

  if (bestBlob && bestBlob.size <= targetBytes * 1.1) {
    return bestBlob;
  }

  // If still too large, scale down and try again
  for (let s = 0.9; s >= 0.2; s -= 0.1) {
    scale = s;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    bestBlob = await binarySearchQuality(canvas, targetBytes, profile);
    if (bestBlob && bestBlob.size <= targetBytes * 1.1) {
      break;
    }
  }

  return bestBlob;
}

async function binarySearchQuality(canvas, targetBytes, profile) {
  let low = 0.1;
  let high = profile === "text" ? 1.0 : 0.9;
  let bestBlob = null;
  let minDiff = Infinity;

  for (let i = 0; i < 6; i++) {
    const mid = (low + high) / 2;
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", mid));
    
    if (!blob) continue;

    const diff = Math.abs(blob.size - targetBytes);
    if (diff < minDiff) {
      minDiff = diff;
      bestBlob = blob;
    }

    if (blob.size > targetBytes) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return bestBlob;
}

/**
 * Compress a PDF File to roughly targetBytes size.
 * Returns an array of compressed image Blobs representing each page, 
 * which can then be compiled into a PDF or downloaded as ZIP.
 */
export async function compressPdf(file, targetBytes, profile = "balanced", onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const numPages = pdf.numPages;
  const targetBytesPerPage = targetBytes / numPages;
  
  const compressedPages = [];
  
  for (let i = 1; i <= numPages; i++) {
    onProgress?.({ percent: Math.round(((i - 1) / numPages) * 100), text: `Compressing page ${i} of ${numPages}...` });
    
    const page = await pdf.getPage(i);
    // Base scale. For "text" profile we might start higher to maintain sharpness.
    let baseScale = profile === "text" ? 2.5 : 2.0;
    const viewport = page.getViewport({ scale: baseScale });
    
    let canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    
    // Draw white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    await page.render({ canvasContext: ctx, viewport }).promise;
    
    // Now compress this page's canvas
    let bestBlob = await binarySearchQuality(canvas, targetBytesPerPage, profile);
    
    if (!bestBlob || bestBlob.size > targetBytesPerPage * 1.1) {
      // Downscale if still too big
      for (let s = 0.8; s >= 0.3; s -= 0.15) {
        const scaledCanvas = document.createElement("canvas");
        scaledCanvas.width = canvas.width * s;
        scaledCanvas.height = canvas.height * s;
        const sCtx = scaledCanvas.getContext("2d");
        sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
        
        bestBlob = await binarySearchQuality(scaledCanvas, targetBytesPerPage, profile);
        if (bestBlob && bestBlob.size <= targetBytesPerPage * 1.1) break;
      }
    }
    
    if (bestBlob) compressedPages.push(bestBlob);
  }
  
  onProgress?.({ percent: 100, text: "Done!" });
  return compressedPages;
}

/**
 * Package an array of image Blobs into a PDF.
 */
export async function packageImagesToPdf(imageBlobs) {
  const pdfDoc = await PDFDocument.create();
  for (const blob of imageBlobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const image = await pdfDoc.embedJpg(arrayBuffer);
    const { width, height } = image.scale(1);
    
    // Optional: fit to A4 if required, or match image size. Here we match image size.
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}
