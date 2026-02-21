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
    tripName: z.string().optional(),
    departureAirlineId: z.string().optional(),
    returnAirlineId: z.string().optional(),
    departureAirportId: z.string().optional(),
    arrivalAirportId: z.string().optional(),
    airport: z.string().default('CGK'), // Legacy
    totalSeats: z.number().int().positive(),
    status: z.enum(['available', 'last_call', 'full', 'departed']).default('available'),
    siskopatuhStatus: z.enum(['synced', 'pending', 'error']).default('pending')
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
        const data = await db.query.departures.findMany({
            where: eq(departures.packageId, packageId),
            with: {
                package: true,
                departureAirline: true,
                returnAirline: true,
                departureAirport: true,
                arrivalAirport: true,
                roomTypes: true,
            }
        });

        const summary = {
            totalDepartures: data.length,
            totalSeats: data.reduce((acc, d) => acc + d.totalSeats, 0),
            bookedSeats: data.reduce((acc, d) => acc + d.bookedSeats, 0),
            siskopatuh: {
                synced: data.filter(d => d.siskopatuhStatus === 'synced').length,
                pending: data.filter(d => d.siskopatuhStatus === 'pending').length,
                error: data.filter(d => d.siskopatuhStatus === 'error').length,
            }
        };

        return c.json({ summary, departures: data });
    }

    const data = await db.query.departures.findMany({
        with: {
            package: true,
            departureAirline: true,
            returnAirline: true,
            departureAirport: true,
            arrivalAirport: true,
            roomTypes: true,
        }
    });

    const summary = {
        totalDepartures: data.length,
        totalSeats: data.reduce((acc, d) => acc + d.totalSeats, 0),
        bookedSeats: data.reduce((acc, d) => acc + d.bookedSeats, 0),
        siskopatuh: {
            synced: data.filter(d => d.siskopatuhStatus === 'synced').length,
            pending: data.filter(d => d.siskopatuhStatus === 'pending').length,
            error: data.filter(d => d.siskopatuhStatus === 'error').length,
        }
    };

    return c.json({ summary, departures: data });
});

api.get('/:id', async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    const dep = await db.query.departures.findFirst({
        where: eq(departures.id, id),
        with: {
            package: true,
            departureAirline: true,
            returnAirline: true,
            departureAirport: true,
            arrivalAirport: true,
            roomTypes: true
        }
    });

    if (!dep) return c.json({ error: 'Departure not found' }, 404);

    return c.json({ departure: dep });
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

api.delete('/:id', authMiddleware, requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    try {
        // Hapus child (roomTypes) terlebih dahulu
        await db.delete(roomTypes).where(eq(roomTypes.departureId, id));
        // Hapus parent
        await db.delete(departures).where(eq(departures.id, id));
        return c.json({ message: 'Departure deleted' });
    } catch (error: any) {
        return c.json({ error: 'Failed to delete departure. It may have existing bookings.' }, 400);
    }
});

api.delete('/rooms/:roomId', authMiddleware, requireRole('pusat'), async (c) => {
    const roomId = c.req.param('roomId');
    const db = getDb(c.env.DB);

    try {
        await db.delete(roomTypes).where(eq(roomTypes.id, roomId));
        return c.json({ message: 'Room type deleted' });
    } catch (error: any) {
        return c.json({ error: 'Failed to delete room type. It may have existing bookings.' }, 400);
    }
});

export default api;
