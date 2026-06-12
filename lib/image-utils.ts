const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function getMaxImageSizeBytes(): number {
  const maxMb = Number.parseFloat(process.env.MAX_IMAGE_SIZE_MB || '5');
  return maxMb * 1024 * 1024;
}

export function getImageSrc(imageData: string): string {
  if (!imageData) return '';
  if (imageData.startsWith('data:')) return imageData;
  return `data:image/jpeg;base64,${imageData}`;
}

export function validateImageBase64(dataUri: string, mimeType: string): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('Invalid image type. Allowed: JPEG, PNG, WebP');
  }

  if (!dataUri.startsWith('data:')) {
    throw new Error('Image must be a valid base64 data URI');
  }

  const base64Part = dataUri.split(',')[1];
  if (!base64Part) {
    throw new Error('Invalid base64 image data');
  }

  const sizeBytes = Math.ceil((base64Part.length * 3) / 4);
  if (sizeBytes > getMaxImageSizeBytes()) {
    throw new Error(`Image exceeds maximum size of ${process.env.MAX_IMAGE_SIZE_MB || 5}MB`);
  }
}

export async function fileToBase64(file: File): Promise<{ dataUri: string; mimeType: string }> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Invalid image type. Allowed: JPEG, PNG, WebP');
  }

  if (file.size > getMaxImageSizeBytes()) {
    throw new Error(`Image exceeds maximum size of ${process.env.MAX_IMAGE_SIZE_MB || 5}MB`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read image file'));
        return;
      }
      resolve({ dataUri: result, mimeType: file.type });
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
