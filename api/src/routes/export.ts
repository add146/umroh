import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { bookings } from '../db/schema.js';
import { ExportService } from '../services/export.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// 1. Export Siskopatuh
api.get('/siskopatuh/:departureId', authMiddleware, requireRole('pusat'), async (c) => {
    const departureId = c.req.param('departureId');
    const db = getDb(c.env.DB);

    const data = await db.query.bookings.findMany({
        where: eq(bookings.departureId, departureId),
        with: {
            pilgrim: true
        }
    });

    const csv = await ExportService.generateSiskopatuhCSV(data);

    return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="siskopatuh_${departureId.substring(0, 8)}.csv"`
    });
});

// 2. Export Manifest
api.get('/manifest/:departureId', authMiddleware, requireRole('pusat'), async (c) => {
    const departureId = c.req.param('departureId');
    const db = getDb(c.env.DB);

    const data = await db.query.bookings.findMany({
        where: eq(bookings.departureId, departureId),
        with: {
            pilgrim: true,
            roomType: true
        }
    });

    const csv = await ExportService.generateManifestCSV(data);

    return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="manifest_${departureId.substring(0, 8)}.csv"`
    });
});

export default api;
