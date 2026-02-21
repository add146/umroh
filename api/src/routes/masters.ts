import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { hotels, airlines, airports } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// Gunakan middleware auth dan require 'pusat' role untuk sebagian besar aksi admin
api.use('/*', authMiddleware);

// --- HOTELS ---
const hotelSchema = z.object({
    name: z.string().min(1),
    city: z.string().min(1),
    starRating: z.number().min(1).max(5).default(3),
    distanceToHaram: z.string().optional(),
    image: z.string().optional(),
});

api.get('/hotels', async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.query.hotels.findMany({
        where: eq(hotels.isActive, true),
        orderBy: [desc(hotels.createdAt)],
    });
    return c.json({ hotels: data });
});

api.post('/hotels', requireRole('pusat'), zValidator('json', hotelSchema), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const result = await db.insert(hotels).values(body).returning();
    return c.json({ hotel: result[0] }, 201);
});

api.delete('/hotels/:id', requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    // Soft delete
    await db.update(hotels).set({ isActive: false }).where(eq(hotels.id, id));
    return c.json({ message: 'Hotel deactivated successfully' });
});


// --- AIRLINES ---
const airlineSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    icon: z.string().optional(),
});

api.get('/airlines', async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.query.airlines.findMany({
        where: eq(airlines.isActive, true),
        orderBy: [desc(airlines.createdAt)],
    });
    return c.json({ airlines: data });
});

api.post('/airlines', requireRole('pusat'), zValidator('json', airlineSchema), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const result = await db.insert(airlines).values(body).returning();
    return c.json({ airline: result[0] }, 201);
});

api.delete('/airlines/:id', requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    // Soft delete
    await db.update(airlines).set({ isActive: false }).where(eq(airlines.id, id));
    return c.json({ message: 'Airline deactivated successfully' });
});


// --- AIRPORTS ---
const airportSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    city: z.string().min(1),
});

api.get('/airports', async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.query.airports.findMany({
        where: eq(airports.isActive, true),
        orderBy: [desc(airports.createdAt)],
    });
    return c.json({ airports: data });
});

api.post('/airports', requireRole('pusat'), zValidator('json', airportSchema), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const result = await db.insert(airports).values(body).returning();
    return c.json({ airport: result[0] }, 201);
});

api.delete('/airports/:id', requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    // Soft delete
    await db.update(airports).set({ isActive: false }).where(eq(airports.id, id));
    return c.json({ message: 'Airport deactivated successfully' });
});

export default api;
