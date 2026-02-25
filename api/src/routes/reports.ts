import { Hono } from 'hono';
import { eq, inArray, count, sum, sql, and, ne } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { users, bookings, pilgrims, hierarchyPaths } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env, Variables: { user: any } }>();

// 1. Global KPI
api.get('/global-kpi', authMiddleware, requireRole('pusat'), async (c) => {
    const db = getDb(c.env.DB);

    // Total Jamaah (Confirmed / Ready Review Bookings)
    // Revenue (Sum of total_price where not cancelled)
    const stats = await db.select({
        totalJamaah: count(bookings.id),
        totalRevenue: sum(bookings.totalPrice),
    }).from(bookings)
        .where(ne(bookings.bookingStatus, 'cancelled'));

    // Conversion rate (all bookings vs confirmed)
    const allBookings = await db.select({ count: count(bookings.id) }).from(bookings);
    const totalAll = allBookings[0]?.count || 0;
    const totalActive = stats[0]?.totalJamaah || 0;

    let conversionRate = 0;
    if (totalAll > 0) {
        conversionRate = (totalActive / totalAll) * 100;
    }

    return c.json({
        totalJamaah: totalActive,
        totalRevenue: stats[0]?.totalRevenue || 0,
        conversionRate: Math.round(conversionRate * 10) / 10
    });
});

// 2. Cabang Comparison
api.get('/cabang-comparison', authMiddleware, requireRole('pusat'), async (c) => {
    const db = getDb(c.env.DB);

    // Get all Cabang
    const cabangList = await db.select({
        id: users.id,
        name: users.name
    }).from(users).where(eq(users.role, 'cabang'));

    const comparisonData = [];

    // For each cabang, calculate their stats
    for (const cabang of cabangList) {
        // Find all descendant IDs (including themselves if we do it logic-wise, 
        // but hierarchyPaths might only store strict descendants depending on setup.
        // Assuming affiliatorId could be the cabang or its agents.)

        const descendants = await db.select({ id: hierarchyPaths.descendantId })
            .from(hierarchyPaths)
            .where(eq(hierarchyPaths.ancestorId, cabang.id));

        const memberIds = descendants.map(d => d.id);
        memberIds.push(cabang.id); // include the cabang itself

        const bStats = await db.select({
            totalBookings: count(bookings.id),
            activeBookings: count(
                sql`CASE WHEN ${bookings.bookingStatus} != 'cancelled' THEN 1 ELSE NULL END`
            ),
            totalRevenue: sum(
                sql`CASE WHEN ${bookings.bookingStatus} != 'cancelled' THEN ${bookings.totalPrice} ELSE 0 END`
            )
        }).from(bookings)
            .where(inArray(bookings.affiliatorId, memberIds));

        const stat = bStats[0];
        const total = stat.totalBookings || 0;
        const active = stat.activeBookings || 0;
        const revenue = stat.totalRevenue || 0;

        let convRate = 0;
        if (total > 0) {
            convRate = (active / total) * 100;
        }

        comparisonData.push({
            id: cabang.id,
            name: cabang.name,
            totalJamaah: active,
            revenue: revenue,
            conversionRate: Math.round(convRate * 10) / 10
        });
    }

    // Sort by revenue descending
    comparisonData.sort((a, b) => (b.revenue as number) - (a.revenue as number));

    return c.json({ cabangComparison: comparisonData });
});

// 3. Repeat Customers
api.get('/repeat-customers', authMiddleware, requireRole('pusat'), async (c) => {
    const db = getDb(c.env.DB);

    // Group bookings by pilgrim to find > 1
    // We'll join pilgrims to bookings
    const repeatData = await db.select({
        pilgrimId: pilgrims.id,
        nik: pilgrims.noKtp,
        name: pilgrims.name,
        tripCount: count(bookings.id),
        lastTrip: sql<string>`MAX(${bookings.bookedAt})`
    })
        .from(pilgrims)
        .innerJoin(bookings, eq(bookings.pilgrimId, pilgrims.id))
        .where(ne(bookings.bookingStatus, 'cancelled'))
        .groupBy(pilgrims.id)
        .having(sql`${count(bookings.id)} > 1`);

    return c.json({ repeatCustomers: repeatData });
});

export default api;
