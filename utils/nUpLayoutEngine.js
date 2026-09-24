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

export async function createOptimizedPdf(pages, nUp) {
  const included = pages.filter((page) => page.isIncluded);
  const output = await PDFDocument.create();
  const metrics = getLayoutMetrics(nUp);
  for (let offset = 0; offset < included.length; offset += nUp) {
    const sheet = output.addPage([A4.width, A4.height]);
    const group = included.slice(offset, offset + nUp);
    for (let slot = 0; slot < group.length; slot += 1) {
      const page = group[slot];
      const imageBytes = await fetch(page.thumbnailUrl).then((response) => response.arrayBuffer());
      const image = page.mimeType === "image/png" || page.thumbnailUrl.startsWith("data:image/png") ? await output.embedPng(imageBytes) : await output.embedJpg(imageBytes);
      const scale = Math.min(metrics.usableWidth / image.width, metrics.slideHeight / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = metrics.margin + (metrics.usableWidth - width) / 2;
      const y = A4.height - metrics.margin - slot * (metrics.slideHeight + metrics.gap) - height;
      sheet.drawImage(image, { x, y, width, height, rotate: degrees(page.rotation || 0) });
    }
    sheet.drawLine({ start: { x: metrics.margin, y: 18 }, end: { x: A4.width - metrics.margin, y: 18 }, thickness: 0.5, color: rgb(0.82, 0.85, 0.81) });
  }
  return output.save();
}
