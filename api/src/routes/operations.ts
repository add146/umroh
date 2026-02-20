import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { equipmentItems, equipmentChecklist, roomAssignments, bookings } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// --- EQUIPMENT MANAGEMENT ---

// 1. GET Master Equipment Items
api.get('/equipment', authMiddleware, async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.select().from(equipmentItems);
    return c.json(data);
});

// 2. CREATE Master Equipment (Admin Pusat)
api.post('/equipment', authMiddleware, requireRole('pusat'), zValidator('json', z.object({
    name: z.string(),
    description: z.string().optional()
})), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);
    const [item] = await db.insert(equipmentItems).values(body).returning();
    return c.json(item);
});

// 3. GET Checklist for a Booking
api.get('/equipment/checklist/:bookingId', authMiddleware, async (c) => {
    const bookingId = c.req.param('bookingId');
    const db = getDb(c.env.DB);

    // Initial check: get all master items and join with their status for this booking
    const allItems = await db.select().from(equipmentItems);
    const checkedItems = await db.select().from(equipmentChecklist).where(eq(equipmentChecklist.bookingId, bookingId));

    // Merge: for each master item, find if it's already in the checklist
    const result = allItems.map(item => {
        const found = checkedItems.find(ci => ci.equipmentItemId === item.id);
        return {
            ...item,
            status: found ? found.status : 'pending',
            receivedAt: found ? found.receivedAt : null,
            receivedBy: found ? found.receivedBy : null,
            checklistId: found ? found.id : null
        };
    });

    return c.json(result);
});

// 4. UPDATE Checklist Status (Mark as received)
api.post('/equipment/checklist', authMiddleware, zValidator('json', z.object({
    bookingId: z.string(),
    equipmentItemId: z.string(),
    status: z.enum(['pending', 'received'])
})), async (c) => {
    const { bookingId, equipmentItemId, status } = c.req.valid('json');
    const user = c.get('user');
    const db = getDb(c.env.DB);

    // Check if exists
    const [existing] = await db.select()
        .from(equipmentChecklist)
        .where(and(
            eq(equipmentChecklist.bookingId, bookingId),
            eq(equipmentChecklist.equipmentItemId, equipmentItemId)
        ))
        .limit(1);

    if (existing) {
        const [updated] = await db.update(equipmentChecklist).set({
            status,
            receivedAt: status === 'received' ? new Date().toISOString() : null,
            receivedBy: status === 'received' ? user.id : null
        }).where(eq(equipmentChecklist.id, existing.id)).returning();
        return c.json(updated);
    } else {
        const [inserted] = await db.insert(equipmentChecklist).values({
            bookingId,
            equipmentItemId,
            status,
            receivedAt: status === 'received' ? new Date().toISOString() : null,
            receivedBy: status === 'received' ? user.id : null
        }).returning();
        return c.json(inserted);
    }
});

// --- ROOMING MANAGEMENT ---

// 5. GET Rooming Board for a Departure
api.get('/rooming/:departureId', authMiddleware, async (c) => {
    const departureId = c.req.param('departureId');
    const db = getDb(c.env.DB);

    // Get all bookings for this departure
    const departureBookings = await db.query.bookings.findMany({
        where: eq(bookings.departureId, departureId),
        with: {
            pilgrim: true,
            roomType: true,
            roomAssignment: true
        }
    });

    return c.json(departureBookings);
});

// 6. ASSIGN Room Number
api.post('/rooming/assign', authMiddleware, zValidator('json', z.object({
    bookingId: z.string(),
    roomNumber: z.string(),
    notes: z.string().optional()
})), async (c) => {
    const { bookingId, roomNumber, notes } = c.req.valid('json');
    const db = getDb(c.env.DB);

    // Check if assignment exists
    const [existing] = await db.select().from(roomAssignments).where(eq(roomAssignments.bookingId, bookingId)).limit(1);

    if (existing) {
        const [updated] = await db.update(roomAssignments).set({
            roomNumber,
            notes
        }).where(eq(roomAssignments.id, existing.id)).returning();
        return c.json(updated);
    } else {
        const [inserted] = await db.insert(roomAssignments).values({
            bookingId,
            roomNumber,
            notes
        }).returning();
        return c.json(inserted);
    }
});

export default api;
