import { Document, ImageRun, Packer, Paragraph } from "docx";

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function createDocx(pages, nUp = 1) {
  const children = [];
  const included = pages.filter((item) => item.isIncluded);
  for (const [index, page] of included.entries()) {
    const bytes = page.thumbnailUrl.startsWith("data:") ? dataUrlToBytes(page.thumbnailUrl) : new Uint8Array(await fetch(page.thumbnailUrl).then((response) => response.arrayBuffer()));
    const type = page.mimeType?.includes("png") ? "png" : "jpg";
    const rotated = (page.rotation || 0) % 180 !== 0;
    const imageHeight = Math.max(96, Math.round(425 / nUp));
    children.push(new Paragraph({ children: [new ImageRun({ data: bytes, type, transformation: { width: rotated ? imageHeight : 600, height: rotated ? 600 : imageHeight } })], pageBreakBefore: index > 0 && index % nUp === 0 }));
  }
  return Packer.toBlob(new Document({ sections: [{ children }] }));
}
