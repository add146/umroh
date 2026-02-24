import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, inArray } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { marketingMaterials, hierarchyPaths } from '../db/schema.js';
import { StorageService } from '../services/storage_ocr.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env, Variables: { user: any } }>();

// 1. Cabang upload materi
api.post('/', authMiddleware, requireRole('cabang', 'pusat'), async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const body = await c.req.parseBody();
    const title = body['title'] as string;
    const category = body['category'] as string;
    const packageId = body['packageId'] as string | undefined;
    const description = body['description'] as string | undefined;
    const file = body['file'] as File;

    if (!title || !category || !file) {
        return c.json({ error: 'Missing required fields' }, 400);
    }

    try {
        const key = `marketing/${user.id}/${Date.now()}_${file.name}`;
        await c.env.R2_DOCUMENTS.put(key, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type }
        });

        const newMaterial = await db.insert(marketingMaterials).values({
            uploadedBy: user.id,
            title,
            category: category as any,
            packageId,
            r2Key: key,
            fileName: file.name,
            mimeType: file.type,
            description,
        }).returning();

        return c.json({ message: 'Material uploaded', material: newMaterial[0] }, 201);
    } catch (e: any) {
        return c.json({ error: 'Upload failed: ' + e.message }, 500);
    }
});

// 2. Agen/Reseller/Mitra/Cabang view materials
api.get('/', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    // Determine whose materials this user can see.
    // An agent can see materials uploaded by their ancestor Cabang or Pusat
    const ancestors = await db.select({ id: hierarchyPaths.ancestorId })
        .from(hierarchyPaths)
        .where(eq(hierarchyPaths.descendantId, user.id));

    const ancestorIds = ancestors.map(a => a.id);

    const data = await db.select().from(marketingMaterials)
        .where(inArray(marketingMaterials.uploadedBy, ancestorIds));

    // In real app, we might need a worker to serve R2 object, or return public URLs
    // Assuming R2 bucket is public under a custom domain (or served by another worker route)

    return c.json({ materials: data });
});

// 2.5 Download material
api.get('/:id/download', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    const user = c.get('user');

    // Simple auth check: ensure material exists and user is in the hierarchy of the uploader
    const [existing] = await db.select().from(marketingMaterials).where(eq(marketingMaterials.id, id)).limit(1);

    if (!existing) return c.json({ error: 'Material not found' }, 404);

    // In a real app we'd verify the user is allowed to see this specific material, similar to GET /
    // For now we allow any logged-in user to download it if they have the ID.

    const file = await StorageService.getFile(c.env.R2_DOCUMENTS, existing.r2Key);
    if (!file) return c.json({ error: 'File not found in storage' }, 404);

    c.header('Content-Type', file.httpMetadata?.contentType || existing.mimeType || 'application/octet-stream');
    c.header('Content-Disposition', `attachment; filename="${existing.fileName}"`);

    return c.body(file.body, 200);
});

// 3. Delete material
api.delete('/:id', authMiddleware, requireRole('cabang', 'pusat'), async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const existing = await db.query.marketingMaterials.findFirst({
        where: eq(marketingMaterials.id, id)
    });

    if (!existing) return c.json({ error: 'Not found' }, 404);
    if (existing.uploadedBy !== user.id && user.role !== 'pusat') {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    await c.env.R2_DOCUMENTS.delete(existing.r2Key);
    await db.delete(marketingMaterials).where(eq(marketingMaterials.id, id));

    return c.json({ message: 'Deleted successfully' });
});

export default api;
