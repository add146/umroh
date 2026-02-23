import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { packageTypes } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

const typeSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
});

// GET all types
api.get('/', async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.query.packageTypes.findMany({
        where: eq(packageTypes.isActive, true),
        orderBy: (pt, { asc }) => [asc(pt.name)]
    });
    return c.json({ data });
});

// POST new type
api.post('/', authMiddleware, requireRole('pusat'), zValidator('json', typeSchema), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const result = await db.insert(packageTypes).values(body).returning();
    return c.json({ data: result[0] }, 201);
});

// PUT update type
api.put('/:id', authMiddleware, requireRole('pusat'), zValidator('json', typeSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const result = await db.update(packageTypes).set(body).where(eq(packageTypes.id, id)).returning();
    if (result.length === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: result[0] });
});

// DELETE type (soft delete)
api.delete('/:id', authMiddleware, requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    await db.update(packageTypes).set({ isActive: false }).where(eq(packageTypes.id, id));
    return c.json({ message: 'Deleted' });
});

export default api;
