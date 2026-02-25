import { Hono } from 'hono';
import { eq, inArray, count, desc, and, sum } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { bookings, pilgrims, departures, users } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { getVisibleBookingIds, getOwnBookingIds } from '../services/hierarchy.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

api.get('/', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);
    const cabangId = c.req.query('cabang_id');

    let visibleBookingIds: string[] | null = null;

    if (user.role === 'pusat') {
        let targetUserId = user.id;
        let targetRole = user.role;
        if (cabangId) { targetUserId = cabangId; targetRole = 'cabang'; }
        visibleBookingIds = await getVisibleBookingIds(c.env.DB, targetUserId, targetRole);
    } else {
        visibleBookingIds = await getOwnBookingIds(c.env.DB, user.id);
    }

    if (visibleBookingIds !== null && visibleBookingIds.length === 0) {
        return c.json({ alumni: [] });
    }

    // Alumni are pilgrims whose bookings are departed or fully paid
    const data = await db.query.bookings.findMany({
        where: visibleBookingIds !== null
            ? and(
                inArray(bookings.id, visibleBookingIds),
                // simplistic alumni check: status confirmed/departed or payment paid
                // in real app this could be more strict
            )
            : undefined,
        with: { pilgrim: true, departure: { with: { package: true } } }
    });

    // Filter to act as alumni
    const alumniList = data.filter(b => b.bookingStatus === 'confirmed' || b.paymentStatus === 'paid' || b.departure?.status === 'departed');

    // Aggregate by pilgrim NIK to get trip counts
    const pilgrimMap = new Map<string, any>();

    for (const b of alumniList) {
        if (!b.pilgrim) continue;
        const nik = b.pilgrim.noKtp;
        if (!pilgrimMap.has(nik)) {
            pilgrimMap.set(nik, {
                pilgrim: b.pilgrim,
                tripCount: 1,
                lastTrip: b.departure,
                lastBooking: b
            });
        } else {
            const existing = pilgrimMap.get(nik);
            existing.tripCount++;
            // Assuming newer dates, could compare departureDate here
            pilgrimMap.set(nik, existing);
        }
    }

    return c.json({ alumni: Array.from(pilgrimMap.values()) });
});


api.get('/stats', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);
    const cabangId = c.req.query('cabang_id');

    let visibleBookingIds: string[] | null = null;

    if (user.role === 'pusat') {
        let targetUserId = user.id;
        let targetRole = user.role;
        if (cabangId) { targetUserId = cabangId; targetRole = 'cabang'; }
        visibleBookingIds = await getVisibleBookingIds(c.env.DB, targetUserId, targetRole);
    } else {
        visibleBookingIds = await getOwnBookingIds(c.env.DB, user.id);
    }

    if (visibleBookingIds !== null && visibleBookingIds.length === 0) {
        return c.json({ stats: { totalAlumni: 0, repeatRate: 0, topAlumni: [] } });
    }

    const data = await db.query.bookings.findMany({
        where: visibleBookingIds !== null ? inArray(bookings.id, visibleBookingIds) : undefined,
        with: { pilgrim: true, departure: { with: { package: true } } }
    });

    const alumniList = data.filter(b => b.bookingStatus === 'confirmed' || b.paymentStatus === 'paid' || b.departure?.status === 'departed');

    const nikCounts: Record<string, number> = {};
    for (const b of alumniList) {
        if (!b.pilgrim) continue;
        nikCounts[b.pilgrim.noKtp] = (nikCounts[b.pilgrim.noKtp] || 0) + 1;
    }

    const uniquePilgrims = Object.keys(nikCounts).length;
    let repeaters = 0;

    for (const nik in nikCounts) {
        if (nikCounts[nik] > 1) repeaters++;
    }

    return c.json({
        stats: {
            totalAlumni: uniquePilgrims,
            repeatRate: uniquePilgrims > 0 ? (repeaters / uniquePilgrims) * 100 : 0
        }
    });
});

export default api;
