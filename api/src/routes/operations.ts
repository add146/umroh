import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { equipmentItems, equipmentChecklist, roomAssignments, bookings, packages, equipmentSets, bookingCustomEquipment } from '../db/schema.js';
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

// 3. GET Checklist for a Booking (filtered by set or package equipment, plus custom items)
api.get('/equipment/checklist/:bookingId', authMiddleware, async (c) => {
    const bookingId = c.req.param('bookingId');
    const db = getDb(c.env.DB);

    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: { 
            departure: { with: { package: true } },
            equipmentSet: true
        }
    });

    let relevantItemIds: string[] | null = null;

    if (booking?.equipmentSet?.equipmentItemIds) {
        try { relevantItemIds = JSON.parse(booking.equipmentSet.equipmentItemIds); } catch { }
    } else if (booking?.departure?.package?.equipmentIds) {
        try { relevantItemIds = JSON.parse(booking.departure.package.equipmentIds); } catch { }
    }

    // Get all master items
    const allItems = await db.select().from(equipmentItems);
    const checkedItems = await db.select().from(equipmentChecklist).where(eq(equipmentChecklist.bookingId, bookingId));
    
    // Filter master items: use set/package list if available, otherwise show all
    const relevantItems = relevantItemIds
        ? allItems.filter(item => relevantItemIds!.includes(item.id))
        : allItems;

    // Merge master items with check status
    const masterResult = relevantItems.map(item => {
        const found = checkedItems.find(ci => ci.equipmentItemId === item.id);
        return {
            id: item.id,
            name: item.name,
            description: item.description,
            status: found ? found.status : 'pending',
            receivedAt: found ? found.receivedAt : null,
            receivedBy: found ? found.receivedBy : null,
            checklistId: found ? found.id : null,
            isCustom: false
        };
    });

    // Get custom items
    const customItems = await db.select().from(bookingCustomEquipment).where(eq(bookingCustomEquipment.bookingId, bookingId));
    const customResult = customItems.map(item => ({
        id: item.id,
        name: item.itemName,
        description: item.notes,
        status: item.status || 'pending',
        receivedAt: item.receivedAt,
        receivedBy: item.addedBy,
        checklistId: item.id,
        isCustom: true
    }));

    return c.json([...masterResult, ...customResult]);
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
        with: { 
            pilgrim: true, 
            departure: { with: { package: true } },
            equipmentSet: true
        }
    });

    if (departureBookings.length === 0) return c.json([]);

    const bookingIds = departureBookings.map(b => b.id);
    const allChecklists = await db.select().from(equipmentChecklist).where(inArray(equipmentChecklist.bookingId, bookingIds));
    const allItems = await db.select().from(equipmentItems);
    
    // Fetch all custom items for these bookings
    const allCustomItems = await db.select().from(bookingCustomEquipment).where(inArray(bookingCustomEquipment.bookingId, bookingIds));

    const result = departureBookings.map(b => {
        let relevantItemIds: string[] | null = null;
        if (b.equipmentSet?.equipmentItemIds) {
            try { relevantItemIds = JSON.parse(b.equipmentSet.equipmentItemIds); } catch { }
        } else if (b.departure?.package?.equipmentIds) {
            try { relevantItemIds = JSON.parse(b.departure.package.equipmentIds); } catch { }
        }

        const relevantItems = relevantItemIds ? allItems.filter(i => relevantItemIds!.includes(i.id)) : allItems;
        const bookingChecklist = allChecklists.filter(cl => cl.bookingId === b.id);
        const bookingCustomItems = allCustomItems.filter(ci => ci.bookingId === b.id);

        const totalItems = relevantItems.length + bookingCustomItems.length;
        
        // Count received items from master items checklist
        const receivedMasterItems = bookingChecklist.filter(cl => cl.status === 'received' && relevantItems.some(ri => ri.id === cl.equipmentItemId)).length;
        
        // Count received custom items
        const receivedCustomItems = bookingCustomItems.filter(ci => ci.status === 'received').length;

        const receivedItems = receivedMasterItems + receivedCustomItems;

        return {
            bookingId: b.id,
            pilgrim: b.pilgrim,
            totalItems,
            receivedItems,
            allAssigned: totalItems > 0 && receivedItems >= totalItems,
            allReceived: totalItems > 0 && receivedItems >= totalItems,
            equipmentDelivered: b.equipmentDelivered,
            equipmentSetName: b.equipmentSet?.name || 'Default'
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

// --- EQUIPMENT SETS MANAGEMENT ---

api.get('/equipment-sets', authMiddleware, async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.select().from(equipmentSets);
    return c.json(data);
});

api.post('/equipment-sets', authMiddleware, requireRole('pusat'), zValidator('json', z.object({
    name: z.string(),
    description: z.string().optional(),
    equipmentItemIds: z.string() // JSON string array
})), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);
    const [set] = await db.insert(equipmentSets).values(body).returning();
    return c.json(set);
});

api.put('/equipment-sets/:id', authMiddleware, requireRole('pusat'), zValidator('json', z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    equipmentItemIds: z.string().optional(),
    isActive: z.boolean().optional()
})), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);
    const [updated] = await db.update(equipmentSets).set(body).where(eq(equipmentSets.id, id)).returning();
    return c.json(updated);
});

api.delete('/equipment-sets/:id', authMiddleware, requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    await db.delete(equipmentSets).where(eq(equipmentSets.id, id));
    return c.json({ success: true });
});

// Update/assign set on booking
api.patch('/booking/:bookingId/equipment-set', authMiddleware, zValidator('json', z.object({
    equipmentSetId: z.string().nullable()
})), async (c) => {
    const bookingId = c.req.param('bookingId');
    const { equipmentSetId } = c.req.valid('json');
    const db = getDb(c.env.DB);
    await db.update(bookings).set({ equipmentSetId }).where(eq(bookings.id, bookingId));
    return c.json({ success: true });
});

// --- CUSTOM BOOKING EQUIPMENT ---

api.post('/equipment/custom', authMiddleware, zValidator('json', z.object({
    bookingId: z.string(),
    itemName: z.string().min(1),
    notes: z.string().optional()
})), async (c) => {
    const { bookingId, itemName, notes } = c.req.valid('json');
    const user = c.get('user');
    const db = getDb(c.env.DB);
    const [item] = await db.insert(bookingCustomEquipment).values({
        bookingId,
        itemName,
        addedBy: user.id,
        status: 'pending',
        notes: notes || null
    }).returning();
    return c.json(item);
});

api.patch('/equipment/custom/:id', authMiddleware, zValidator('json', z.object({
    status: z.enum(['pending', 'received'])
})), async (c) => {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');
    const db = getDb(c.env.DB);
    const [updated] = await db.update(bookingCustomEquipment).set({
        status,
        receivedAt: status === 'received' ? new Date().toISOString() : null
    }).where(eq(bookingCustomEquipment.id, id)).returning();
    return c.json(updated);
});

api.delete('/equipment/custom/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    await db.delete(bookingCustomEquipment).where(eq(bookingCustomEquipment.id, id));
    return c.json({ success: true });
});

export default api;
