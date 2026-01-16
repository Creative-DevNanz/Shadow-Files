export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

export function extractMask(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (d[i] > 230) {
      d[i] = 255;
    } else {
      d[i] = 0;
    }
    if (d[i + 1] > 230) {
      d[i + 1] = 255;
    } else {
      d[i + 1] = 0;
    }
    if (d[i + 2] > 230) {
      d[i + 2] = 255;
    } else {
      d[i + 2] = 0;
    }
    d[i + 3] = a;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function extractObject(image: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3];
        if (d[i] > 230) {
            d[i] = 255;
        }
        if (d[i + 1] > 230) {
            d[i + 1] = 255;
        }
        if (d[i + 2] > 230) {
            d[i + 2] = 255;
        }

        if (
            d[i] === 255 &&
            d[i + 1] === 255 &&
            d[i + 2] === 255
        ) {
            d[i + 3] = 0; // Set alpha to 0 (transparent)
        } else {
            d[i + 3] = a;
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

export function createMaskCanvasFromImage(
    img: HTMLImageElement,
    threshold = 1
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];

        if (alpha > threshold) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255; // Opaque black
        } else {
            data[i + 3] = 0; // Transparent
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
}
