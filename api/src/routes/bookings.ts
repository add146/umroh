import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, sql, inArray } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { bookings, pilgrims, departures, roomTypes, users, documents, departureBoardingPoints } from '../db/schema.js';
import { checkAvailability } from '../services/availability.js';
import { useLock } from '../services/seats.js';
import { authMiddleware } from '../middleware/auth.js';
import { getVisibleBookingIds, getOwnBookingIds, getDownlineStats } from '../services/hierarchy.js';
import { insertUserWithHierarchy } from '../services/hierarchy.js';
import { logAction } from '../services/audit.js';
import { checkDuplicatePilgrim } from '../services/pilgrim.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

const bookingSchema = z.object({
    departureId: z.string().uuid(),
    roomTypeId: z.string().uuid(),
    boardingPointId: z.string().uuid().optional(),
    lockKey: z.string().optional(),
    affiliatorId: z.string().optional(),

    pilgrimId: z.string().optional(),

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
    }).optional()
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

    // 2. Duplicate Detection - Allow repeat customers, do not block booking.

    // 3. Start Transaction (D1 batch)
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

        let bpPriceAdjustment = 0;
        if (body.boardingPointId) {
            const bp = await db.query.departureBoardingPoints.findFirst({
                where: eq(departureBoardingPoints.id, body.boardingPointId)
            });
            if (bp) {
                bpPriceAdjustment = bp.priceAdjustment;
            }
        }

        const totalPrice = dep.package.basePrice + room.priceAdjustment + bpPriceAdjustment;


        let finalPilgrimId = body.pilgrimId;
        const bookingId = crypto.randomUUID();

        // In a real D1/Drizzle env, we'd use db.batch()
        if (!finalPilgrimId) {
            if (!body.pilgrim) return c.json({ error: 'Pilgrim data required' }, 400);
            finalPilgrimId = crypto.randomUUID();
            await db.insert(pilgrims).values({
                id: finalPilgrimId,
                ...body.pilgrim
            });
        }

        await db.insert(bookings).values({
            id: bookingId,
            departureId: body.departureId,
            pilgrimId: finalPilgrimId,
            roomTypeId: body.roomTypeId,
            boardingPointId: body.boardingPointId || null,
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
            let phone = body.pilgrim?.phone;
            let name = body.pilgrim?.name;

            if (!phone || !name) {
                const existing = await db.query.pilgrims.findFirst({ where: eq(pilgrims.id, finalPilgrimId) });
                if (existing) {
                    phone = existing.phone;
                    name = existing.name;
                }
            }

            if (phone && name) {
                await WhatsAppService.sendBookingConfirmation(db, phone, {
                    name: name,
                    bookingId: bookingId,
                    packageName: dep.package.name,
                    amount: dpAmount.toLocaleString('id-ID')
                });
            }
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

    let data: any[] = [];
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
        data = await db.query.bookings.findMany({
            where: conditions,
            with: { pilgrim: true, departure: { with: { package: true } }, affiliator: true }
        });
    } else {
        // Non-pusat: only see OWN jamaah (direct affiliator) with full detail
        const ownIds = await getOwnBookingIds(c.env.DB, user.id);
        if (ownIds.length === 0) return c.json({ bookings: [] });
        data = await db.query.bookings.findMany({
            where: inArray(bookings.id, ownIds),
            with: { pilgrim: true, departure: { with: { package: true } }, affiliator: true }
        });
    }

    // Fetch documents
    const pilgrimIds = data.map(b => b.pilgrimId);
    const allDocs = pilgrimIds.length > 0 
        ? await db.query.documents.findMany({ where: inArray(documents.pilgrimId, pilgrimIds) })
        : [];
    const docTypes = ['ktp', 'passport', 'visa', 'other'];
    const bookingsWithDocs = data.map((b: any) => {
        const docs = allDocs.filter((d: any) => d.pilgrimId === b.pilgrimId);
        const status: any = {};
        docTypes.forEach(t => {
            const d = docs.find((doc: any) => doc.docType === t);
            status[t] = {
                uploaded: !!d,
                verified: d ? d.isVerified : false
            };
        });
        const uploadedCount = ['ktp', 'passport', 'visa'].filter(t => status[t].uploaded).length;
        return {
            ...b,
            documentStatus: status,
            documentCount: { uploaded: uploadedCount, total: 3 }
        };
    });

    return c.json({ bookings: bookingsWithDocs });
});

api.get('/agent/pilgrims', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);
    
    // Fetch all bookings for this agent
    const ownIds = await getOwnBookingIds(c.env.DB, user.id);
    if (ownIds.length === 0) return c.json({ pilgrims: [] });

    const agentBookings = await db.query.bookings.findMany({
        where: inArray(bookings.id, ownIds),
        with: { pilgrim: true, departure: { with: { package: true } } }
    });

    // Group by pilgrimId
    const pilgrimMap = new Map();
    for (const b of agentBookings) {
        if (!b.pilgrim) continue;
        if (!pilgrimMap.has(b.pilgrim.id)) {
            pilgrimMap.set(b.pilgrim.id, {
                ...b.pilgrim,
                history: []
            });
        }
        const p = pilgrimMap.get(b.pilgrim.id);
        p.history.push({
            bookingId: b.id,
            packageName: b.departure?.package?.name || '',
            departureDate: b.departure?.departureDate || '',
            bookingStatus: b.bookingStatus,
            paymentStatus: b.paymentStatus
        });
    }

    const uniquePilgrims = Array.from(pilgrimMap.values());
    return c.json({ pilgrims: uniquePilgrims });
});

// Opsi A: Downline stats (aggregate only, no contact data)
api.get('/stats/downline', authMiddleware, async (c) => {
    const user = c.get('user');
    const stats = await getDownlineStats(c.env.DB, user.id);
    return c.json({ stats });
});

api.get('/check-duplicate', async (c) => {
    const nik = c.req.query('nik');
    if (!nik || nik.length !== 16) return c.json({ isDuplicate: false });

    const db = getDb(c.env.DB);
    
    // Cari all pilgrims with this NIK first
    const pilgrimRecords = await db.select({ id: pilgrims.id })
        .from(pilgrims)
        .where(eq(pilgrims.noKtp, nik));
        
    if (pilgrimRecords.length === 0) return c.json({ isDuplicate: false });
    
    const pilgrimIds = pilgrimRecords.map((p: any) => p.id);
    
    // Cari semua booking dengan NIK ini
    const existingBookings = await db.query.bookings.findMany({
        where: inArray(bookings.pilgrimId, pilgrimIds),
        with: {
            pilgrim: true,
            affiliator: true,  // INFO AGEN
            departure: { with: { package: true } }
        }
    });

    if (existingBookings.length > 0) {
        const latest = existingBookings[existingBookings.length - 1];
        return c.json({
            isDuplicate: true,
            pilgrimName: latest.pilgrim?.name,
            agent: latest.affiliator ? {
                name: latest.affiliator.name,
                phone: latest.affiliator.phone,
                role: latest.affiliator.role
            } : null,
            bookingCount: existingBookings.length,
            lastPackage: latest.departure?.package?.name,
            message: 'Jamaah ini sudah terdaftar. Silakan hubungi agen terkait.'
        });
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
            invoices: true,
            affiliator: true
        }
    });

    if (!data) return c.json({ error: 'Booking not found' }, 404);

    const docs = await db.query.documents.findMany({
        where: eq(documents.pilgrimId, data.pilgrimId)
    });
    const docTypes = ['ktp', 'passport', 'visa', 'other'];
    const status: any = {};
    docTypes.forEach(t => {
        const d = docs.find((doc: any) => doc.docType === t);
        status[t] = {
            uploaded: !!d,
            verified: d ? d.isVerified : false
        };
    });
    const uploadedCount = ['ktp', 'passport', 'visa'].filter(t => status[t].uploaded).length;

    return c.json({
        ...data,
        documentStatus: status,
        documentCount: { uploaded: uploadedCount, total: 3 }
    });
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
    await db.update(bookings).set({ bookingStatus: 'ready_review' }).where(eq(bookings.id, id));
    await logAction(c.env.DB, user.id, 'MARK_READY_REVIEW', 'booking', id);

    return c.json({ message: 'Marked ready for review' });
});

// Cabang rejecting booking
api.post('/:id/reject', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    if (user.role !== 'cabang' && user.role !== 'pusat') {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    const { reason } = await c.req.json().catch(() => ({ reason: '' }));
    const db = getDb(c.env.DB);

    // Return status to pending so Agent can edit/resubmit
    await db.update(bookings).set({ bookingStatus: 'pending' }).where(eq(bookings.id, id));
    await logAction(c.env.DB, user.id, `REJECT_BOOKING: ${reason || 'No reason'} `, 'booking', id);

    return c.json({ message: 'Booking rejected' });
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
                const affiliateCode = `AFF - ${Math.random().toString(36).substring(2, 8).toUpperCase()} `;
                const tempPassword = Math.random().toString(36).substring(2, 10); // Temporary password

                await db.insert(users).values({
                    id: newUserId,
                    email: `${booking.pilgrim.noKtp} @jamaah.local`,
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

api.patch('/:id/pipeline-stage', authMiddleware, zValidator('json', z.object({
    stage: z.enum(['lead', 'terdaftar', 'dp_bayar', 'cicilan', 'lunas', 'berangkat'])
})), async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const { stage } = c.req.valid('json');
    const db = getDb(c.env.DB);

    // Quick verify user owns this booking
    const ownIds = await getOwnBookingIds(c.env.DB, user.id);
    if (!ownIds.includes(id) && user.role !== 'pusat' && user.role !== 'cabang') {
        return c.json({ error: 'Unauthorized to change stage' }, 403);
    }

    // Map stage to bookingStatus / paymentStatus logically
    let bookingUpdate: any = {};

    switch (stage) {
        case 'terdaftar':
            bookingUpdate = { bookingStatus: 'pending', paymentStatus: 'unpaid' };
            break;
        case 'dp_bayar':
            bookingUpdate = { paymentStatus: 'partial' };
            break;
        case 'cicilan':
            bookingUpdate = { paymentStatus: 'partial' };
            break;
        case 'lunas':
            bookingUpdate = { paymentStatus: 'paid' };
            break;
        case 'berangkat':
            bookingUpdate = { bookingStatus: 'confirmed' };
            break;
    }

    if (Object.keys(bookingUpdate).length > 0) {
        await db.update(bookings).set(bookingUpdate).where(eq(bookings.id, id));
        await logAction(c.env.DB, user.id, `PIPELINE_STAGE_UPDATE: ${stage}`, 'booking', id);
    }

    return c.json({ message: 'Pipeline stage updated', stage });
});

export default api;
