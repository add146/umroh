import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, sql, inArray } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { bookings, pilgrims, departures, roomTypes, users } from '../db/schema.js';
import { useLock, checkAvailability } from '../services/seats.js';
import { authMiddleware } from '../middleware/auth.js';
import { getVisibleBookingIds, getOwnBookingIds, getDownlineStats, checkDuplicatePilgrim } from '../services/hierarchy.js';
import { insertUserWithHierarchy } from '../services/hierarchy.js';
import { logAction } from '../services/audit.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

const bookingSchema = z.object({
    departureId: z.string().uuid(),
    roomTypeId: z.string().uuid(),
    lockKey: z.string().optional(),
    affiliatorId: z.string().optional(),

    // Section B-F: Pilgrim Data (27 fields)
    pilgrim: z.object({
        name: z.string().min(3),
        noKtp: z.string().length(16),
        sex: z.enum(['L', 'P']),
        born: z.string(), // YYYY-MM-DD
        address: z.string(),
        fatherName: z.string(),

        hasPassport: z.boolean().default(false),
        noPassport: z.string().optional(),
        passportFrom: z.string().optional(),
        passportReleaseDate: z.string().optional(),
        passportExpiry: z.string().optional(),

        maritalStatus: z.enum(['Belum Menikah', 'Menikah', 'Cerai']),
        phone: z.string(),
        homePhone: z.string().optional(),
        lastEducation: z.string(),
        work: z.string(),
        diseaseHistory: z.string().optional(),

        famMember: z.string().optional(), // JSON encoded or simplified
        famContactName: z.string(),
        famContact: z.string(),

        sourceFrom: z.string(),
    })
});

api.post('/', zValidator('json', bookingSchema), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    // 1. Verify Seat Lock or Availability
    let lockResolved = false;
    if (body.lockKey) {
        lockResolved = await useLock(c.env.DB, body.lockKey);
    }

    if (!lockResolved) {
        const avail = await checkAvailability(c.env.DB, body.departureId);
        if (!avail.available) {
            return c.json({ error: 'No seats available' }, 400);
        }
    }

    // 2. Start Transaction (D1 batch)
    try {
        // Note: Drizzle D1 transaction helper is used via batch
        const dep = await db.query.departures.findFirst({
            where: eq(departures.id, body.departureId),
            with: {
                package: true
            }
        });
        const room = await db.query.roomTypes.findFirst({
            where: eq(roomTypes.id, body.roomTypeId)
        });

        if (!dep || !dep.package || !room) return c.json({ error: 'Departure, Package or Room Type invalid' }, 400);

        const totalPrice = dep.package.basePrice + room.priceAdjustment;


        // Use a manual batch/transaction approach for D1
        const pilgrimId = crypto.randomUUID();
        const bookingId = crypto.randomUUID();

        // In a real D1/Drizzle env, we'd use db.batch()
        await db.insert(pilgrims).values({
            id: pilgrimId,
            ...body.pilgrim
        });

        await db.insert(bookings).values({
            id: bookingId,
            departureId: body.departureId,
            pilgrimId: pilgrimId,
            roomTypeId: body.roomTypeId,
            affiliatorId: body.affiliatorId || null,
            totalPrice: totalPrice,
            paymentStatus: 'unpaid',
            bookingStatus: 'pending'
        });

        // Update booked seats and automatically close quota if full
        await db.update(departures)
            .set({
                bookedSeats: sql`${departures.bookedSeats} + 1`,
                status: sql`CASE WHEN ${departures.bookedSeats} + 1 >= ${departures.totalSeats} THEN 'full' ELSE ${departures.status} END`
            })
            .where(eq(departures.id, body.departureId));


        // 6. Create Initial Invoice (DP)
        const { createInitialInvoice } = await import('../services/payment.js');
        const dpAmount = Math.min(5000000, totalPrice); // Rp 5.000.000 or full if less
        const invoice = await createInitialInvoice(c.env.DB, c.env, bookingId, dpAmount);

        // 7. Send WhatsApp Notification
        try {
            const { WhatsAppService } = await import('../services/whatsapp.js');
            await WhatsAppService.sendBookingConfirmation(body.pilgrim.phone, {
                name: body.pilgrim.name,
                bookingId: bookingId,
                packageName: dep.package.name,
                amount: dpAmount.toLocaleString('id-ID')
            });
        } catch (waError) {
            console.error('Failed to send WA notification:', waError);
        }

        return c.json({
            message: 'Booking successful',
            bookingId,
            totalPrice,
            invoiceId: invoice.id,
            invoiceCode: invoice.invoiceCode
        }, 201);


    } catch (error: any) {
        console.error(error);
        return c.json({ error: 'Booking failed: ' + error.message }, 500);
    }
});


// Admin/Agent: List bookings (Opsi A: non-pusat only sees own jamaah)
api.get('/', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);
    const cabangId = c.req.query('cabang_id');

    if (user.role === 'pusat') {
        // Pusat sees all bookings with pilgrim data
        let targetUserId = user.id;
        let targetRole = user.role;
        if (cabangId) { targetUserId = cabangId; targetRole = 'cabang'; }

        const visibleBookingIds = await getVisibleBookingIds(c.env.DB, targetUserId, targetRole);
        let conditions = undefined;
        if (visibleBookingIds !== null) {
            if (visibleBookingIds.length === 0) return c.json({ bookings: [] });
            conditions = inArray(bookings.id, visibleBookingIds);
        }
        const data = await db.query.bookings.findMany({
            where: conditions,
            with: { pilgrim: true, departure: { with: { package: true } } }
        });
        return c.json({ bookings: data });
    } else {
        // Non-pusat: only see OWN jamaah (direct affiliator) with full detail
        const ownIds = await getOwnBookingIds(c.env.DB, user.id);
        if (ownIds.length === 0) return c.json({ bookings: [] });
        const data = await db.query.bookings.findMany({
            where: inArray(bookings.id, ownIds),
            with: { pilgrim: true, departure: { with: { package: true } } }
        });
        return c.json({ bookings: data });
    }
});

// Opsi A: Downline stats (aggregate only, no contact data)
api.get('/stats/downline', authMiddleware, async (c) => {
    const user = c.get('user');
    const stats = await getDownlineStats(c.env.DB, user.id);
    return c.json({ stats });
});

api.get('/check-duplicate', async (c) => {
    const nik = c.req.query('nik');
    const phone = c.req.query('phone');
    const passport = c.req.query('passport');

    if (!nik && !phone && !passport) {
        return c.json({ isDuplicate: false });
    }

    const existing = await checkDuplicatePilgrim(c.env.DB, nik, phone, passport);
    if (existing) {
        return c.json({ isDuplicate: true, pilgrim: existing });
    }
    return c.json({ isDuplicate: false });
});

// 3. GET BOOKING STATUS (Public)
api.get('/:id/status', async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    const data = await db.query.bookings.findFirst({
        where: eq(bookings.id, id),
        with: {
            pilgrim: true,
            departure: {
                with: {
                    package: true
                }
            },
            invoices: true
        }
    });

    if (!data) return c.json({ error: 'Booking not found' }, 404);
    return c.json(data);
});

// Follow up WA action
api.post('/:id/follow-up', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    await logAction(c.env.DB, user.id, 'FOLLOW_UP_WA', 'booking', id);
    return c.json({ message: 'Follow up logged' });
});

// Agent marking ready for review
api.post('/:id/ready-for-review', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const db = getDb(c.env.DB);

    // Can optionally check if payment is at least partially paid and docs are complete
    await db.update(bookings).set({ bookingStatus: 'pending' }).where(eq(bookings.id, id));
    await logAction(c.env.DB, user.id, 'MARK_READY_REVIEW', 'booking', id);

    return c.json({ message: 'Marked ready for review' });
});

// Cabang approving booking
api.post('/:id/approve', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    if (user.role !== 'cabang' && user.role !== 'pusat') {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    const db = getDb(c.env.DB);

    // Update booking status
    await db.update(bookings).set({ bookingStatus: 'confirmed' }).where(eq(bookings.id, id));
    await logAction(c.env.DB, user.id, 'APPROVE_BOOKING', 'booking', id);

    // Auto-create reseller account for jamaah if booking has an affiliator
    try {
        const booking = await db.query.bookings.findFirst({
            where: eq(bookings.id, id),
            with: { pilgrim: true }
        });

        if (booking?.affiliatorId && booking.pilgrim) {
            // Check if user account already exists for this NIK
            const existingUser = booking.pilgrim.noKtp
                ? await db.select().from(users).where(eq(users.nik, booking.pilgrim.noKtp)).limit(1)
                : [];

            if (existingUser.length === 0) {
                // Auto-create reseller account
                const newUserId = crypto.randomUUID();
                const affiliateCode = `AFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                const tempPassword = Math.random().toString(36).substring(2, 10); // Temporary password

                await db.insert(users).values({
                    id: newUserId,
                    email: `${booking.pilgrim.noKtp}@jamaah.local`,
                    name: booking.pilgrim.name,
                    phone: booking.pilgrim.phone,
                    nik: booking.pilgrim.noKtp,
                    password: tempPassword, // Should be hashed in production
                    role: 'reseller',
                    affiliateCode,
                    parentId: booking.affiliatorId,
                    isActive: true,
                });

                // Insert hierarchy path
                await insertUserWithHierarchy(c.env.DB, newUserId, booking.affiliatorId);
                await logAction(c.env.DB, user.id, 'AUTO_CREATE_RESELLER', 'user', newUserId);
            }
        }
    } catch (err) {
        // Don't fail the approval if auto-reseller creation fails
        console.error('Auto-reseller creation failed:', err);
    }

    return c.json({ message: 'Booking approved' });
});

export default api;

