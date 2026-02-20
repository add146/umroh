import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { departures, roomTypes } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

const departureSchema = z.object({
    packageId: z.string().uuid(),
    departureDate: z.string(), // YYYY-MM-DD
    airport: z.string().length(3),
    totalSeats: z.number().int().positive(),
    status: z.enum(['available', 'last_call', 'full', 'departed']).default('available'),
});

const roomTypeSchema = z.object({
    name: z.string(),
    capacity: z.number().int().positive(),
    priceAdjustment: z.number().int(),
});

api.get('/', async (c) => {
    const packageId = c.req.query('packageId');
    const db = getDb(c.env.DB);

    if (packageId) {
        const data = await db.select().from(departures).where(eq(departures.packageId, packageId));
        return c.json({ departures: data });
    }

    const data = await db.select().from(departures);
    return c.json({ departures: data });
});

api.get('/:id', async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    const dep = await db.query.departures.findFirst({
        where: eq(departures.id, id),
        with: {
            // Note: we need to handle roomTypes separately if not using relational queries correctly
        }
    });

    if (!dep) return c.json({ error: 'Departure not found' }, 404);

    const rooms = await db.select().from(roomTypes).where(eq(roomTypes.departureId, id));

    return c.json({ departure: { ...dep, roomTypes: rooms } });
});

const departureCreateSchema = departureSchema.extend({
    roomTypes: z.array(roomTypeSchema).optional()
});

api.post('/', authMiddleware, requireRole('pusat'), zValidator('json', departureCreateSchema), async (c) => {
    const { roomTypes: roomTypesData, ...depData } = c.req.valid('json');
    const db = getDb(c.env.DB);

    try {
        // Use batch for transaction-like behavior in D1
        const [dep] = await db.insert(departures).values(depData).returning();

        if (roomTypesData && roomTypesData.length > 0) {
            const roomsWithId = roomTypesData.map(r => ({ ...r, departureId: dep.id }));
            await db.insert(roomTypes).values(roomsWithId);
        }

        return c.json({ departure: dep }, 201);
    } catch (error: any) {
        return c.json({ error: 'Failed to create departure: ' + error.message }, 500);
    }
});

api.post('/:id/rooms', authMiddleware, requireRole('pusat'), zValidator('json', z.array(roomTypeSchema)), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const values = body.map(r => ({ ...r, departureId: id }));
    const result = await db.insert(roomTypes).values(values).returning();
    return c.json({ roomTypes: result });
});

export default api;
