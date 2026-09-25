export function canvasToBlobUrl(canvas, type = "image/jpeg", quality = 0.88) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), type, quality);
  });
}

export async function renderPdfFile(file, onProgress) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages = [];
  const total = pdf.numPages;
  for (let index = 1; index <= total; index += 1) {
    if (onProgress) {
      onProgress({
        file: file.name,
        current: index,
        total,
        percent: Math.round(((index - 1) / total) * 100),
        text: `Processing page ${index} of ${total}...`,
      });
    }
    const page = await pdf.getPage(index);
    const viewport = page.getViewport({ scale: 3.0 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    const thumbUrl = await canvasToBlobUrl(canvas, "image/jpeg", 0.95);
    pages.push({ thumbnailUrl: thumbUrl, fileType: "pdf", mimeType: "image/jpeg", sourceFileName: file.name, originalIndex: index - 1, originalFile: file });
    if (onProgress) {
      onProgress({
        file: file.name,
        current: index,
        total,
        percent: Math.round((index / total) * 100),
        text: `Processed page ${index} of ${total}`,
      });
    }
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

      if (mode === "full") {
        for (let index = 0; index < pixels.data.length; index += 4) {
          pixels.data[index] = 255 - pixels.data[index];
          pixels.data[index + 1] = 255 - pixels.data[index + 1];
          pixels.data[index + 2] = 255 - pixels.data[index + 2];
        }
      } else {
        // Smart clean: sample luminance to determine if the slide is predominantly dark or light
        let totalLuminance = 0;
        let samples = 0;
        const step = 4 * 16;
        for (let i = 0; i < pixels.data.length; i += step) {
          totalLuminance += 0.299 * pixels.data[i] + 0.587 * pixels.data[i + 1] + 0.114 * pixels.data[i + 2];
          samples++;
        }
        const isDarkSlide = (totalLuminance / (samples || 1)) < 128;

        for (let index = 0; index < pixels.data.length; index += 4) {
          const red = pixels.data[index];
          const green = pixels.data[index + 1];
          const blue = pixels.data[index + 2];

          if (isDarkSlide) {
            let invR = 255 - red;
            let invG = 255 - green;
            let invB = 255 - blue;
            if (invR > 215 && invG > 215 && invB > 215) {
              invR = 255;
              invG = 255;
              invB = 255;
            } else if (invR < 55 && invG < 55 && invB < 55) {
              invR = 0;
              invG = 0;
              invB = 0;
            }
            pixels.data[index] = invR;
            pixels.data[index + 1] = invG;
            pixels.data[index + 2] = invB;
          } else {
            // Already light slide: snap off-white background to pure white, keep text dark and legible
            if (red > 215 && green > 215 && blue > 215) {
              pixels.data[index] = 255;
              pixels.data[index + 1] = 255;
              pixels.data[index + 2] = 255;
            }
          }
        }
      }

      context.putImageData(pixels, 0, 0);
      canvasToBlobUrl(canvas, "image/jpeg", 0.95).then(resolve);
    };
    image.src = dataUrl;
  });
}
