
// src/image-resizer.worker.ts

self.onmessage = async (e: MessageEvent<File>) => {
  const file = e.data;

  try {
    const resizedBlob = await resizeAndCompressImage(file);
    self.postMessage({ success: true, blob: resizedBlob });
  } catch (error) {
    self.postMessage({ success: false, error: (error as Error).message });
  }
};

const resizeAndCompressImage = async (file: File): Promise<Blob> => {
    const imageBitmap = await createImageBitmap(file);

    const MAX_WIDTH = 1280;
    const MAX_HEIGHT = 1280;
    let { width, height } = imageBitmap;

    if (width > height) {
        if (width > MAX_WIDTH) {
            height = (height / width) * MAX_WIDTH;
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            width = (width / height) * MAX_HEIGHT;
            height = MAX_HEIGHT;
        }
    }

    // Use OffscreenCanvas which is available in workers
    const canvas = new OffscreenCanvas(Math.round(width), Math.round(height));
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get OffscreenCanvas context');
    }

    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    // Close the bitmap to free up memory
    imageBitmap.close();

    const blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: 0.8, // Using 0.8 as a good compromise
    });

    if (!blob) {
      throw new Error('Canvas to Blob conversion failed');
    }
    
    return blob;
};


