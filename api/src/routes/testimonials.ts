import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { testimonials } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// 1. GET ALL PUBLISHED TESTIMONIALS (Public)
api.get('/', async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.query.testimonials.findMany({
        where: eq(testimonials.isPublished, true),
        orderBy: [desc(testimonials.createdAt)]
    });
    return c.json(data);
});

// 2. GET ALL TESTIMONIALS (Admin)
api.get('/all', authMiddleware, requireRole('pusat'), async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.query.testimonials.findMany({
        orderBy: [desc(testimonials.createdAt)]
    });
    return c.json(data);
});

// 3. CREATE TESTIMONIAL (Admin)
api.post('/', authMiddleware, requireRole('pusat'), zValidator('json', z.object({
    pilgrimName: z.string(),
    departureInfo: z.string().optional(),
    content: z.string(),
    photoR2Key: z.string().optional(),
    videoUrl: z.string().optional(),
    rating: z.number().min(1).max(5).default(5),
    isPublished: z.boolean().default(false)
})), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);
    const [newItem] = await db.insert(testimonials).values(body).returning();
    return c.json(newItem);
});

// 4. UPLOAD PHOTO TO R2 (Admin)
api.post('/upload', authMiddleware, requireRole('pusat'), async (c) => {
    const body = await c.req.parseBody();
    const file = body['photo'] as File;

    if (!file) return c.json({ error: 'No photo provided' }, 400);

    const key = `testimonials/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    await c.env.R2_DOCUMENTS.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
    });

    return c.json({ key });
});

// 5. UPDATE TESTIMONIAL (Admin)
api.patch('/:id', authMiddleware, requireRole('pusat'), zValidator('json', z.object({
    pilgrimName: z.string().optional(),
    departureInfo: z.string().optional(),
    content: z.string().optional(),
    photoR2Key: z.string().optional(),
    videoUrl: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    isPublished: z.boolean().optional()
})), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const [updatedItem] = await db.update(testimonials)
        .set(body)
        .where(eq(testimonials.id, id))
        .returning();

    if (!updatedItem) return c.json({ error: 'Not found' }, 404);
    return c.json(updatedItem);
});

// 6. DELETE TESTIMONIAL (Admin)
api.delete('/:id', authMiddleware, requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    await db.delete(testimonials).where(eq(testimonials.id, id));
    return c.json({ success: true });
});

export default api;
