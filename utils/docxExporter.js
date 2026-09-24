import { AlignmentType, Document, ImageRun, Packer, Paragraph } from "docx";

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function prepareImageForDocx(thumbnailUrl, rotation = 0) {
  const normAngle = ((rotation % 360) + 360) % 360;

  if (typeof document === "undefined" || typeof window === "undefined") {
    let bytes;
    if (thumbnailUrl.startsWith("data:")) {
      bytes = dataUrlToBytes(thumbnailUrl);
    } else {
      bytes = new Uint8Array(await fetch(thumbnailUrl).then((r) => r.arrayBuffer()));
    }
    return { bytes, type: "jpg", width: 500, height: 350 };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const origW = img.naturalWidth || img.width || 800;
      const origH = img.naturalHeight || img.height || 600;

      if (normAngle === 0) {
        if (thumbnailUrl.startsWith("data:")) {
          const bytes = dataUrlToBytes(thumbnailUrl);
          const type = thumbnailUrl.startsWith("data:image/png") ? "png" : "jpg";
          resolve({ bytes, type, width: origW, height: origH });
          return;
        }
      }

      const isSwapped = normAngle === 90 || normAngle === 270;
      const canvasW = isSwapped ? origH : origW;
      const canvasH = isSwapped ? origW : origH;

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");

      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.rotate((normAngle * Math.PI) / 180);
      ctx.drawImage(img, -origW / 2, -origH / 2);

      const rotatedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      resolve({ bytes: dataUrlToBytes(rotatedDataUrl), type: "jpg", width: canvasW, height: canvasH });
    };

    img.onerror = async () => {
      let bytes;
      if (thumbnailUrl.startsWith("data:")) {
        bytes = dataUrlToBytes(thumbnailUrl);
      } else {
        bytes = new Uint8Array(await fetch(thumbnailUrl).then((r) => r.arrayBuffer()));
      }
      resolve({ bytes, type: "jpg", width: 500, height: 350 });
    };

    img.src = thumbnailUrl;
  });
}

export async function createDocx(pages, nUp = 1, onProgress) {
  const children = [];
  const included = pages.filter((item) => item.isIncluded);
  const total = included.length;

  for (const [index, page] of included.entries()) {
    if (onProgress) {
      onProgress({
        current: index + 1,
        total,
        percent: Math.round(((index + 0.5) / total) * 85),
        text: `Processing page ${index + 1} of ${total}...`,
      });
    }
    const { bytes, type, width, height } = await prepareImageForDocx(page.thumbnailUrl, page.rotation || 0);

    const maxDocxWidth = 468;
    const maxDocxHeight = Math.max(120, Math.round(620 / nUp));
    const scale = Math.min(maxDocxWidth / width, maxDocxHeight / height);

    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: bytes,
            type,
            transformation: { width: targetWidth, height: targetHeight },
          }),
        ],
        pageBreakBefore: index > 0 && index % nUp === 0,
      })
    );
    if (onProgress) {
      onProgress({
        current: index + 1,
        total,
        percent: Math.round(((index + 1) / total) * 85),
        text: `Prepared page ${index + 1} of ${total}`,
      });
    }
  }

  if (onProgress) {
    onProgress({ current: total, total, percent: 92, text: "Packing DOCX document..." });
  }
  const result = await Packer.toBlob(new Document({ sections: [{ children }] }));
  if (onProgress) {
    onProgress({ current: total, total, percent: 100, text: "Ready to download!" });
  }
  return result;
}
