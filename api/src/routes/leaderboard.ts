import { Hono } from 'hono';
import { getDb } from '../db/index.js';
import { bookings, users } from '../db/schema.js';
import { eq, desc, and, sql, gte, lte } from 'drizzle-orm';
import { Env } from '../index.js';

type Variables = {
    user: {
        id: string;
        email: string;
        role: string;
    }
}

const leaderboard = new Hono<{ Bindings: Env, Variables: Variables }>();

// GET /api/leaderboard - Get top affiliates by sales volume (pax)
leaderboard.get('/', async (c) => {
    try {
        const db = getDb(c.env.DB);
        const timeframe = c.req.query('timeframe') || 'all_time';
        let dateFilter = undefined;

        if (timeframe === 'current_month') {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

            dateFilter = and(
                gte(bookings.bookedAt, startOfMonth),
                lte(bookings.bookedAt, endOfMonth)
            );
        }

        // Aggregate bookings by affiliatorId
        const baseQuery = db
            .select({
                affiliatorId: bookings.affiliatorId,
                name: users.name,
                role: users.role,
                affiliateCode: users.affiliateCode,
                totalPax: sql<number>`count(${bookings.id})`.mapWith(Number),
                totalOmset: sql<number>`sum(${bookings.totalPrice})`.mapWith(Number)
            })
            .from(bookings)
            .innerJoin(users, eq(bookings.affiliatorId, users.id))
            .where(
                and(
                    eq(bookings.paymentStatus, 'paid'), // Only count paid bookings
                    ...((dateFilter ? [dateFilter] : []) as any)
                )
            )
            .groupBy(bookings.affiliatorId)
            .orderBy(desc(sql`count(${bookings.id})`))
            .limit(20);

        const ranks = await baseQuery;

        return c.json({ ranks });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return c.json({ error: 'Internal server error while building leaderboard' }, 500);
    }
});

// GET /api/leaderboard/me - Get current user's rank
leaderboard.get('/me', async (c) => {
    // Requires auth middleware which sets user info but we're keeping it simple for now
    // In a real app we'd extract c.get('jwtPayload').userid
    const db = getDb(c.env.DB);
    const userId = c.req.query('userId');
    const timeframe = c.req.query('timeframe') || 'all_time';

    if (!userId) {
        return c.json({ error: 'userId query param required for /me' }, 400);
    }

    let dateFilter = undefined;
    if (timeframe === 'current_month') {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();
        dateFilter = and(
            gte(bookings.bookedAt, startOfMonth),
            lte(bookings.bookedAt, endOfMonth)
        );
    }

    // We would fetch all ranks and find the user's index or use a WINDOW function.
    // Given sqlite restrictions on some window functions, fetching the ordered list is easiest for small scale.
    try {
        const allRanks = await db
            .select({
                affiliatorId: bookings.affiliatorId,
                totalPax: sql<number>`count(${bookings.id})`.mapWith(Number),
                totalOmset: sql<number>`sum(${bookings.totalPrice})`.mapWith(Number)
            })
            .from(bookings)
            .where(
                and(
                    eq(bookings.paymentStatus, 'paid'),
                    ...((dateFilter ? [dateFilter] : []) as any)
                )
            )
            .groupBy(bookings.affiliatorId)
            .orderBy(desc(sql`count(${bookings.id})`));
        const userIndex = allRanks.findIndex((r: any) => r.affiliatorId === userId);

        if (userIndex === -1) {
            return c.json({ rank: 0, totalPax: 0, totalOmset: 0 });
        }

        return c.json({
            rank: userIndex + 1,
            ...allRanks[userIndex]
        });
    } catch (error) {
        return c.json({ error: 'Failed to fetch user rank' }, 500);
    }
});

export default leaderboard;
