import { renderPdfFile, canvasToBlobUrl } from "./pdfProcessor";

async function renderDocxPages(title, text) {
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  if (!words.length) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 850;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffdf6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#10211d";
    context.font = "700 34px Georgia";
    const url = await canvasToBlobUrl(canvas, "image/jpeg", 0.9);
    return [url];
  }

  const maxLinesPerPage = 14;
  const maxCharsPerLine = 60;
  const pages = [];
  let wordIndex = 0;

  while (wordIndex < words.length) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 850;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffdf6";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#10211d";
    context.font = "700 34px Georgia";
    const pageIndex = pages.length;
    context.fillText(pageIndex === 0 ? title : `${title} (${pageIndex + 1})`, 70, 100);

    context.font = "24px Arial";
    let y = 170;
    let lines = 0;
    let currentLine = "";

    while (wordIndex < words.length && lines < maxLinesPerPage) {
      const word = words[wordIndex];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length > maxCharsPerLine) {
        if (currentLine) {
          context.fillText(currentLine, 70, y);
          y += 42;
          lines++;
          currentLine = word;
        } else {
          context.fillText(word, 70, y);
          y += 42;
          lines++;
          currentLine = "";
        }
      } else {
        currentLine = testLine;
      }
      wordIndex++;
    }

    if (currentLine && lines < maxLinesPerPage) {
      context.fillText(currentLine, 70, y);
      lines++;
    } else if (currentLine) {
      wordIndex--;
    }

    const url = await canvasToBlobUrl(canvas, "image/jpeg", 0.9);
    pages.push(url);
  }

  return pages;
}

export async function processFile(file, onProgress) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (extension === "pdf") {
    return renderPdfFile(file, onProgress);
  }
  if (["png", "jpg", "jpeg"].includes(extension)) {
    if (onProgress) {
      onProgress({
        file: file.name,
        current: 1,
        total: 1,
        percent: 100,
        text: `Loaded image ${file.name}`,
      });
    }
    return [{ thumbnailUrl: URL.createObjectURL(file), fileType: "image", mimeType: file.type, sourceFileName: file.name, originalIndex: 0, originalFile: file }];
  }
  if (extension === "docx") {
    if (onProgress) {
      onProgress({
        file: file.name,
        current: 0,
        total: 1,
        percent: 25,
        text: `Reading Word document ${file.name}...`,
      });
    }
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const text = result.value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const title = file.name.replace(/\.docx$/i, "");
    if (onProgress) {
      onProgress({
        file: file.name,
        current: 1,
        total: 1,
        percent: 60,
        text: `Formatting pages for ${file.name}...`,
      });
    }
    const pageImages = await renderDocxPages(title, text);
    if (onProgress) {
      onProgress({
        file: file.name,
        current: 1,
        total: 1,
        percent: 100,
        text: `Prepared ${pageImages.length} pages from ${file.name}`,
      });
    }
    return pageImages.map((thumbnailUrl, index) => ({
      thumbnailUrl,
      fileType: "docx",
      mimeType: "image/jpeg",
      sourceFileName: file.name,
      originalIndex: index,
    }));
  }
  throw new Error("Unsupported file type");
}

export async function processFiles(files, onProgress) {
  const batches = [];
  const totalFiles = files.length;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const pages = await processFile(file, (p) => {
      if (onProgress) {
        const basePercent = (i / totalFiles) * 100;
        const filePercent = (p.percent / 100) * (100 / totalFiles);
        const overallPercent = Math.min(99, Math.round(basePercent + filePercent));
        onProgress({
          ...p,
          fileIndex: i + 1,
          totalFiles,
          percent: overallPercent,
          text: totalFiles > 1 ? `[${i + 1}/${totalFiles}] ${p.text}` : p.text,
        });
      }
    });
    batches.push(pages);
  }
  if (onProgress) {
    onProgress({ percent: 100, text: "Ready!" });
  }
  return batches.flat().map((page, index) => ({
    ...page,
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    isIncluded: true,
    inverted: false,
    rotation: 0,
  }));
}
