import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { equipmentItems, equipmentChecklist, roomAssignments, bookings, packages } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { logAction } from '../services/audit.js';
import { WhatsAppService } from '../services/whatsapp.js';
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

// 2b. DELETE Master Equipment (Admin Pusat)
api.delete('/equipment/:id', authMiddleware, requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    await db.delete(equipmentItems).where(eq(equipmentItems.id, id));
    return c.json({ success: true });
});

// 3. GET Checklist for a Booking (filtered by package equipment)
api.get('/equipment/checklist/:bookingId', authMiddleware, async (c) => {
    const bookingId = c.req.param('bookingId');
    const db = getDb(c.env.DB);

    // Lookup the booking's package to get its equipmentIds
    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: { departure: { with: { package: true } } }
    });

    let packageEquipmentIds: string[] | null = null;
    if (booking?.departure?.package?.equipmentIds) {
        try { packageEquipmentIds = JSON.parse(booking.departure.package.equipmentIds); } catch { }
    }

    // Get all master items
    const allItems = await db.select().from(equipmentItems);
    const checkedItems = await db.select().from(equipmentChecklist).where(eq(equipmentChecklist.bookingId, bookingId));

    // Filter items: use package-specific list if available, otherwise show all
    const relevantItems = packageEquipmentIds
        ? allItems.filter(item => packageEquipmentIds!.includes(item.id))
        : allItems;

    // Merge: for each item, find if it's already in the checklist
    const result = relevantItems.map(item => {
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

// 7. GET Jamaah Overview with Equipment Status Summary (Teknisi)
api.get('/jamaah-overview/:departureId', authMiddleware, requireRole('teknisi', 'pusat'), async (c) => {
    const departureId = c.req.param('departureId');
    const db = getDb(c.env.DB);

    const departureBookings = await db.query.bookings.findMany({
        where: eq(bookings.departureId, departureId),
        with: { pilgrim: true, departure: { with: { package: true } } }
    });

    if (departureBookings.length === 0) return c.json([]);

    const bookingIds = departureBookings.map(b => b.id);
    const allChecklists = await db.select().from(equipmentChecklist).where(inArray(equipmentChecklist.bookingId, bookingIds));
    const allItems = await db.select().from(equipmentItems);

    const result = departureBookings.map(b => {
        let relevantItemIds: string[] | null = null;
        try { if (b.departure?.package?.equipmentIds) relevantItemIds = JSON.parse(b.departure.package.equipmentIds); } catch { }

        const relevantItems = relevantItemIds ? allItems.filter(i => relevantItemIds!.includes(i.id)) : allItems;
        const bookingChecklist = allChecklists.filter(cl => cl.bookingId === b.id);
        const totalItems = relevantItems.length;
        const receivedItems = bookingChecklist.filter(cl => cl.status === 'received').length;

        return {
            bookingId: b.id,
            pilgrim: b.pilgrim,
            totalItems,
            receivedItems,
            allAssigned: totalItems > 0 && receivedItems >= totalItems,
            allReceived: totalItems > 0 && receivedItems >= totalItems,
            equipmentDelivered: b.equipmentDelivered,
        };
    });

    return c.json(result);
});

// 8. TOGGLE equipment_delivered on a booking (manual "Diserahkan" action)
api.post('/deliver-equipment/:bookingId', authMiddleware, requireRole('teknisi', 'pusat'), async (c) => {
    const bookingId = c.req.param('bookingId');
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: { pilgrim: true, departure: { with: { package: true } } }
    });

    if (!booking) return c.json({ error: 'Not found' }, 404);

    const newVal = !booking.equipmentDelivered;

    await db.update(bookings).set({ equipmentDelivered: newVal }).where(eq(bookings.id, bookingId));

    if (newVal && booking.pilgrim && booking.departure?.package) {
        await WhatsAppService.sendEquipmentDeliveryNotification(db, booking.pilgrim.phone, {
            name: booking.pilgrim.name,
            packageName: booking.departure.package.name
        });
        await logAction(c.env.DB, user.id, 'deliver_equipment', 'booking', bookingId, { pilgrimId: booking.pilgrim.id, status: 'delivered' });
    } else if (!newVal && booking.pilgrim) {
        await logAction(c.env.DB, user.id, 'deliver_equipment', 'booking', bookingId, { pilgrimId: booking.pilgrim.id, status: 'revoked' });
    }

    return c.json({ bookingId, equipmentDelivered: newVal });
});

export default api;
