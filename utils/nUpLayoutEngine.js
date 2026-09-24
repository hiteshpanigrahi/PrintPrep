import { PDFDocument, degrees, rgb } from "pdf-lib";

export const A4 = { width: 595.28, height: 841.89 };
const CM = 28.3465;

export function getLayoutMetrics(nUp) {
  const margin = CM;
  const gap = CM;
  const usableWidth = A4.width - margin * 2;
  const slideHeight = (A4.height - margin * 2 - gap * (nUp - 1)) / nUp;
  return { margin, gap, usableWidth, slideHeight };
}

export async function createOptimizedPdf(pages, nUp, onProgress) {
  const included = pages.filter((page) => page.isIncluded);
  const output = await PDFDocument.create();
  const metrics = getLayoutMetrics(nUp);
  const total = included.length;
  let processed = 0;
  const loadedDocs = new Map();

  for (let offset = 0; offset < included.length; offset += nUp) {
    const sheet = output.addPage([A4.width, A4.height]);
    const group = included.slice(offset, offset + nUp);
    for (let slot = 0; slot < group.length; slot += 1) {
      const page = group[slot];
      processed++;
      if (onProgress) {
        onProgress({
          current: processed,
          total,
          percent: Math.round(((processed - 0.5) / total) * 90),
          text: `Processing page ${processed} of ${total}...`,
        });
      }
      let renderable;
      let naturalWidth, naturalHeight;
      let isPdf = false;

      if (page.fileType === "pdf" && page.originalFile && !page.inverted) {
        if (!loadedDocs.has(page.originalFile)) {
          const buffer = await page.originalFile.arrayBuffer();
          const doc = await PDFDocument.load(buffer);
          loadedDocs.set(page.originalFile, doc);
        }
        const srcDoc = loadedDocs.get(page.originalFile);
        const [copiedPage] = await output.copyPages(srcDoc, [page.originalIndex]);
        renderable = await output.embedPage(copiedPage);
        naturalWidth = renderable.width;
        naturalHeight = renderable.height;
        isPdf = true;
      } else {
        const imageBytes = await fetch(page.thumbnailUrl).then((response) => response.arrayBuffer());
        renderable = page.mimeType === "image/png" || page.thumbnailUrl.startsWith("data:image/png") ? await output.embedPng(imageBytes) : await output.embedJpg(imageBytes);
        naturalWidth = renderable.width;
        naturalHeight = renderable.height;
      }

      const normAngle = ((page.rotation || 0) % 360 + 360) % 360;
      const isSwapped = normAngle === 90 || normAngle === 270;
      const naturalBoxWidth = isSwapped ? naturalHeight : naturalWidth;
      const naturalBoxHeight = isSwapped ? naturalWidth : naturalHeight;

      const scale = Math.min(metrics.usableWidth / naturalBoxWidth, metrics.slideHeight / naturalBoxHeight);
      const width = naturalWidth * scale;
      const height = naturalHeight * scale;
      const boxW = naturalBoxWidth * scale;
      const boxH = naturalBoxHeight * scale;

      const boxX = metrics.margin + (metrics.usableWidth - boxW) / 2;
      const slotTop = A4.height - metrics.margin - slot * (metrics.slideHeight + metrics.gap);
      const boxY = slotTop - metrics.slideHeight + (metrics.slideHeight - boxH) / 2;

      let x = boxX;
      let y = boxY;
      if (normAngle === 90) {
        x = boxX + height;
        y = boxY;
      } else if (normAngle === 180) {
        x = boxX + width;
        y = boxY + height;
      } else if (normAngle === 270) {
        x = boxX;
        y = boxY + width;
      }

      if (isPdf) {
        sheet.drawPage(renderable, { x, y, width, height, rotate: degrees(normAngle) });
      } else {
        sheet.drawImage(renderable, { x, y, width, height, rotate: degrees(normAngle) });
      }
      if (onProgress) {
        onProgress({
          current: processed,
          total,
          percent: Math.round((processed / total) * 90),
          text: `Compiled page ${processed} of ${total}`,
        });
      }
    }
    sheet.drawLine({ start: { x: metrics.margin, y: 18 }, end: { x: A4.width - metrics.margin, y: 18 }, thickness: 0.5, color: rgb(0.82, 0.85, 0.81) });
  }

  if (onProgress) {
    onProgress({ current: total, total, percent: 95, text: "Assembling PDF document..." });
  }
  const result = await output.save();
  if (onProgress) {
    onProgress({ current: total, total, percent: 100, text: "Ready to download!" });
  }
  return result;
}
