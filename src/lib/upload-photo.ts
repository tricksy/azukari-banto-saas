'use client';

export async function uploadPhoto(
  blob: Blob,
  itemNumber: string,
  type: 'front' | 'back' | 'after_front' | 'after_back' | 'additional',
  mimeType?: string,
): Promise<string> {
  const mime = mimeType || 'image/webp';
  const ext = mime.split('/')[1] || 'webp';
  const fileName = `${type}.${ext}`;

  const file = new File([blob], fileName, { type: mime });
  const formData = new FormData();
  formData.append('file', file);
  formData.append('item_number', itemNumber);
  formData.append('type', type);

  const res = await fetch('/api/photos/upload', {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Upload failed');
  }

  return json.url;
}

export async function uploadItemPhotos(
  itemNumber: string,
  photos: {
    frontBlob?: Blob;
    frontMimeType?: string;
    backBlob?: Blob;
    backMimeType?: string;
    additionalBlobs?: Array<{ blob: Blob; mimeType?: string }>;
  },
): Promise<{ frontUrl?: string; backUrl?: string; additionalUrls?: string[] }> {
  const promises: Promise<void>[] = [];
  let frontUrl: string | undefined;
  let backUrl: string | undefined;
  const additionalUrls: string[] = [];

  if (photos.frontBlob) {
    promises.push(
      uploadPhoto(photos.frontBlob, itemNumber, 'front', photos.frontMimeType).then((url) => {
        frontUrl = url;
      }),
    );
  }

  if (photos.backBlob) {
    promises.push(
      uploadPhoto(photos.backBlob, itemNumber, 'back', photos.backMimeType).then((url) => {
        backUrl = url;
      }),
    );
  }

  if (photos.additionalBlobs) {
    for (const additional of photos.additionalBlobs) {
      promises.push(
        uploadPhoto(additional.blob, itemNumber, 'additional', additional.mimeType).then((url) => {
          additionalUrls.push(url);
        }),
      );
    }
  }

  await Promise.all(promises);

  return { frontUrl, backUrl, additionalUrls: additionalUrls.length > 0 ? additionalUrls : undefined };
}
