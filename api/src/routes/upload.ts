import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { ImgBBService } from '../services/imgbb.js';
import { StorageService } from '../services/storage_ocr.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

/**
 * POST /api/upload/imgbb
 * Upload image to imgBB (for general image uploads: testimonials, marketing, etc.)
 * Returns: { url, displayUrl, thumbUrl, deleteUrl }
 */
api.post('/imgbb', authMiddleware, async (c) => {
    const apiKey = c.env.IMGBB_API_KEY;
    if (!apiKey) {
        return c.json({ error: 'imgBB API key not configured' }, 500);
    }

    const formData = await c.req.parseBody();
    const file = formData['image'] as File;

    if (!file) {
        return c.json({ error: 'No image file provided. Use field name "image".' }, 400);
    }

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
        return c.json({ error: 'File must be an image (JPEG, PNG, GIF, WebP)' }, 400);
    }

    // Max 32MB (imgBB limit)
    const MAX_SIZE = 32 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        return c.json({ error: 'Image too large. Max 32MB.' }, 400);
    }

    try {
        const buffer = await file.arrayBuffer();
        const result = await ImgBBService.upload(apiKey, buffer, file.name);

        return c.json({
            success: true,
            url: result.displayUrl,
            thumbUrl: result.thumbUrl,
            deleteUrl: result.deleteUrl,
            fullUrl: result.url,
            width: result.width,
            height: result.height,
            size: result.size,
        });
    } catch (err: any) {
        console.error('imgBB upload error:', err);
        return c.json({ error: err.message || 'Failed to upload to imgBB' }, 500);
    }
});

/**
 * POST /api/upload/package-image
 * Upload package image to R2 internal storage (for umroh/haji packages only)
 * Images should be pre-compressed on the client side.
 * Returns: { key, url }
 */
api.post('/package-image', authMiddleware, requireRole('pusat'), async (c) => {
    const formData = await c.req.parseBody();
    const file = formData['image'] as File;

    if (!file) {
        return c.json({ error: 'No image file provided. Use field name "image".' }, 400);
    }

    if (!file.type.startsWith('image/')) {
        return c.json({ error: 'File must be an image' }, 400);
    }

    // Max 5MB (should already be compressed client-side)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        return c.json({ error: 'Image too large. Max 5MB after compression.' }, 400);
    }

    try {
        const buffer = await file.arrayBuffer();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `packages/${Date.now()}_${sanitizedName}`;

        await StorageService.upload(c.env.R2_DOCUMENTS, key, buffer, file.type);

        return c.json({
            success: true,
            key,
            url: `/api/upload/package-image/${encodeURIComponent(key)}`,
        });
    } catch (err: any) {
        console.error('Package image upload error:', err);
        return c.json({ error: err.message || 'Failed to upload package image' }, 500);
    }
});

/**
 * GET /api/upload/package-image/:key+
 * Serve package image from R2 (wildcard route for nested keys like packages/123_img.jpg)
 */
api.get('/package-image/*', async (c) => {
    const fullPath = c.req.path.replace('/api/upload/package-image/', '');
    const key = decodeURIComponent(fullPath);

    if (!key) {
        return c.json({ error: 'Missing image key' }, 400);
    }

    try {
        const file = await StorageService.getFile(c.env.R2_DOCUMENTS, key);
        if (!file) {
            return c.json({ error: 'Image not found' }, 404);
        }

        const headers = new Headers();
        if (file.httpMetadata?.contentType) {
            headers.set('Content-Type', file.httpMetadata.contentType);
        }
        headers.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 year
        headers.set('ETag', file.httpEtag);

        return new Response(file.body, { headers });
    } catch (err: any) {
        console.error('Package image serve error:', err);
        return c.json({ error: 'Failed to retrieve image' }, 500);
    }
});

export default api;
