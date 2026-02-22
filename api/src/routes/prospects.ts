import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { prospects } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { Env } from '../index.js';
import { getVisibleBookingIds } from '../services/hierarchy.js'; // To adapt for prospects later if needed

const api = new Hono<{ Bindings: Env, Variables: { user: any } }>();

const prospectSchema = z.object({
    fullName: z.string().min(2),
    phone: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    source: z.string().optional(),
    status: z.enum(['new', 'contacted', 'interested', 'not_interested', 'converted']).optional(),
    followUpDate: z.string().optional(), // YYYY-MM-DD
});

api.get('/', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    // Prospek is owned by the user (Agent)
    const data = await db.select().from(prospects).where(eq(prospects.ownerId, user.id));
    return c.json({ prospects: data });
});

api.post('/', authMiddleware, zValidator('json', prospectSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    try {
        const newProspect = await db.insert(prospects).values({
            ownerId: user.id,
            fullName: body.fullName,
            phone: body.phone,
            address: body.address,
            notes: body.notes,
            source: body.source,
            status: body.status || 'new',
            followUpDate: body.followUpDate,
        }).returning();

        return c.json({ message: 'Prospect created successfully', prospect: newProspect[0] }, 201);
    } catch (e: any) {
        return c.json({ error: 'Failed to create prospect: ' + e.message }, 500);
    }
});

api.patch('/:id', authMiddleware, zValidator('json', prospectSchema.partial().extend({ convertedBookingId: z.string().optional() })), async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const existing = await db.select().from(prospects).where(and(eq(prospects.id, id), eq(prospects.ownerId, user.id)));
    if (existing.length === 0) return c.json({ error: 'Not found' }, 404);

    try {
        const updated = await db.update(prospects).set({
            ...body,
            updatedAt: new Date().toISOString()
        }).where(eq(prospects.id, id)).returning();

        return c.json({ message: 'Prospect updated', prospect: updated[0] });
    } catch (e: any) {
        return c.json({ error: 'Failed to update prospect' }, 500);
    }
});

api.delete('/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const existing = await db.select().from(prospects).where(and(eq(prospects.id, id), eq(prospects.ownerId, user.id)));
    if (existing.length === 0) return c.json({ error: 'Not found' }, 404);

    await db.delete(prospects).where(eq(prospects.id, id));
    return c.json({ message: 'Prospect deleted' });
});

export default api;
