'use client';

const MAX_WIDTH = 1600;
const MAX_HEIGHT = 2400;
const WEBP_QUALITY = 0.85;
const JPEG_QUALITY = 0.85;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      type,
      quality
    );
  });
}

export async function resizeAndConvertToBlob(
  source: HTMLVideoElement | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number
): Promise<{ blob: Blob; mimeType: string }> {
  let width = sourceWidth;
  let height = sourceHeight;

  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    const scale = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, width, height);

  // Try WebP first
  const webpBlob = await canvasToBlob(canvas, 'image/webp', WEBP_QUALITY);
  if (webpBlob.type === 'image/webp') {
    return { blob: webpBlob, mimeType: 'image/webp' };
  }

  // Fallback to JPEG
  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
  return { blob: jpegBlob, mimeType: 'image/jpeg' };
}

export async function fileToResizedBlob(file: File): Promise<{ blob: Blob; mimeType: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image'));
      image.src = url;
    });
    return resizeAndConvertToBlob(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function createPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
