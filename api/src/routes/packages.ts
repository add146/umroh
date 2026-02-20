import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, or } from 'drizzle-orm';
import { getDb } from '../db/index.js';

import { packages } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

const packageSchema = z.object({
    name: z.string().min(3),
    slug: z.string().min(3),
    description: z.string().optional(),
    basePrice: z.number().positive(),
    image: z.string().url().optional(),
    isActive: z.boolean().default(true),
});


// Admin only: CRUD packages
api.get('/', async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.select().from(packages).where(eq(packages.isActive, true));
    return c.json({ packages: data });
});

api.get('/:id', async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    const pkg = await db.query.packages.findFirst({
        where: or(eq(packages.id, id), eq(packages.slug, id)),
        with: {
            departures: {
                with: {
                    roomTypes: true
                }
            }
        }
    });

    if (!pkg) return c.json({ error: 'Package not found' }, 404);
    return c.json({ package: pkg });


});

api.post('/', authMiddleware, requireRole('pusat'), zValidator('json', packageSchema), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const result = await db.insert(packages).values(body).returning();
    return c.json({ package: result[0] }, 201);
});

api.put('/:id', authMiddleware, requireRole('pusat'), zValidator('json', packageSchema), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const result = await db.update(packages).set(body).where(eq(packages.id, id)).returning();
    if (result.length === 0) return c.json({ error: 'Package not found' }, 404);
    return c.json({ package: result[0] });
});

api.delete('/:id', authMiddleware, requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    await db.update(packages).set({ isActive: false }).where(eq(packages.id, id));
    return c.json({ message: 'Package deactivated' });
});

export default api;
