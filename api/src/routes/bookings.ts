import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { bookings, pilgrims, departures, roomTypes } from '../db/schema.js';
import { useLock, checkAvailability } from '../services/seats.js';
import { authMiddleware } from '../middleware/auth.js';
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


// Admin/Agent: List bookings
api.get('/', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    // In Fase 4, we will filter this by hierarchy/affiliatorId
    const data = await db.select().from(bookings);
    return c.json({ bookings: data });
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

export default api;

