/**
 * Compress an image file to JPEG at specified quality using canvas.
 * Returns a new File object with the compressed data.
 */
export async function compressImage(file: File, quality: number = 0.8): Promise<File> {
    // Skip non-image files (e.g. PDFs)
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Keep original dimensions, just compress quality
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(file); return; }
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { resolve(file); return; }
                        const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        // Only use compressed if it's actually smaller
                        resolve(compressed.size < file.size ? compressed : file);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => resolve(file);
            img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}
