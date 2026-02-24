import { eq, and, gt, sql, lt } from 'drizzle-orm';
import { departures, seatLocks } from '../db/schema.js';
import { getDb } from '../db/index.js';
import type { D1Database } from '@cloudflare/workers-types';

export async function checkAvailability(d1: D1Database, departureId: string) {
    const db = getDb(d1);
    const dep = await db.query.departures.findFirst({
        where: eq(departures.id, departureId),
    });

    if (!dep) return { available: false, error: 'Departure not found' };

    // Count active locks
    const now = Math.floor(Date.now() / 1000);
    const activeLocks = await db
        .select({ count: sql<number>`count(*)` })
        .from(seatLocks)
        .where(and(eq(seatLocks.departureId, departureId), gt(seatLocks.expiresAt, now)));

    const lockedCount = activeLocks[0].count;
    const availableSeats = dep.totalSeats - dep.bookedSeats - lockedCount;

    return {
        available: availableSeats > 0,
        remaining: availableSeats,
        total: dep.totalSeats,
        booked: dep.bookedSeats,
        locked: lockedCount
    };
}
