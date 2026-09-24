import { renderPdfFile } from "./pdfProcessor";

function renderDocxPage(title, text, pageIndex) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 850;
  const context = canvas.getContext("2d");
  context.fillStyle = "#fffdf6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#10211d";
  context.font = "700 34px Georgia";
  context.fillText(pageIndex === 0 ? title : `${title} (${pageIndex + 1})`, 70, 100);
  context.font = "24px Arial";
  const words = text.split(" ");
  let line = "";
  let y = 170;
  let lines = 0;
  for (const word of words) {
    if ((line + word).length > 58) {
      context.fillText(line, 70, y);
      line = "";
      y += 42;
      lines += 1;
      if (lines >= 14) break;
    }
    line += `${word} `;
  }
  if (lines < 14) context.fillText(line, 70, y);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export async function processFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (extension === "pdf") return renderPdfFile(file);
  if (["png", "jpg", "jpeg"].includes(extension)) {
    return [{ thumbnailUrl: URL.createObjectURL(file), fileType: "image", mimeType: file.type, sourceFileName: file.name, originalIndex: 0 }];
  }
  if (extension === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const text = result.value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const title = file.name.replace(/\.docx$/i, "");
    const wordsPerPage = 800;
    const words = text.split(" ");
    const pages = [];
    for (let offset = 0; offset < Math.max(words.length, 1); offset += wordsPerPage) {
      pages.push({ thumbnailUrl: renderDocxPage(title, words.slice(offset, offset + wordsPerPage).join(" "), pages.length), fileType: "docx", mimeType: "image/jpeg", sourceFileName: file.name, originalIndex: pages.length });
    }
    return pages;
  }
  throw new Error("Unsupported file type");
}

export async function processFiles(files) {
  const batches = await Promise.all(files.map(processFile));
  return batches.flat().map((page, index) => ({
    ...page,
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    isIncluded: true,
    inverted: false,
    rotation: 0,
  }));
}
