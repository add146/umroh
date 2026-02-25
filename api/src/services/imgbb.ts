/**
 * imgBB Image Hosting Service
 * Uploads images to imgBB via their API and returns public URLs.
 * Used for all general image uploads EXCEPT package (umroh/haji) images.
 */

export interface ImgBBUploadResult {
    url: string;        // Full-size image URL
    displayUrl: string; // Display URL
    thumbUrl: string;   // Thumbnail URL
    deleteUrl: string;  // Delete URL
    title: string;
    width: number;
    height: number;
    size: number;
}

export class ImgBBService {
    /**
     * Upload an image to imgBB
     * @param apiKey - imgBB API key
     * @param imageData - Image as ArrayBuffer
     * @param fileName - Original file name (optional)
     * @returns Upload result with URLs
     */
    static async upload(
        apiKey: string,
        imageData: ArrayBuffer,
        fileName?: string
    ): Promise<ImgBBUploadResult> {
        // Convert ArrayBuffer to base64
        const uint8 = new Uint8Array(imageData);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
        }
        const base64Image = btoa(binary);

        // Build form data for imgBB API
        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('image', base64Image);
        if (fileName) {
            formData.append('name', fileName.replace(/\.[^.]+$/, '')); // Remove extension
        }

        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`imgBB upload failed (${response.status}): ${errorText}`);
        }

        const result = await response.json() as any;

        if (!result.success) {
            throw new Error(`imgBB upload failed: ${JSON.stringify(result.error || result)}`);
        }

        const data = result.data;
        return {
            url: data.url,
            displayUrl: data.display_url,
            thumbUrl: data.thumb?.url || data.display_url,
            deleteUrl: data.delete_url,
            title: data.title,
            width: data.width,
            height: data.height,
            size: data.size,
        };
    }
}
