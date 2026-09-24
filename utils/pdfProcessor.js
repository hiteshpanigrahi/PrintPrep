export async function renderPdfFile(file) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const viewport = page.getViewport({ scale: 1.35 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    pages.push({ thumbnailUrl: canvas.toDataURL("image/jpeg", 0.88), fileType: "pdf", mimeType: "image/jpeg", sourceFileName: file.name, originalIndex: index - 1 });
  }
  return pages;
}

export function applyPixelFilter(dataUrl, mode = "smart") {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        if (mode === "full") {
          pixels.data[index] = 255 - red;
          pixels.data[index + 1] = 255 - green;
          pixels.data[index + 2] = 255 - blue;
        } else if (red + green + blue < 210) {
          pixels.data[index] = 255;
          pixels.data[index + 1] = 255;
          pixels.data[index + 2] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    image.src = dataUrl;
  });
}
