import { Hono } from 'hono';
import { getDb } from '../db';
import { sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../index';

type Variables = {
    user: {
        id: string;
        email: string;
        role: string;
    };
};

const api = new Hono<{ Bindings: Env; Variables: Variables }>();

api.get('/commission-monthly', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);
    // userId is either the query param or from token
    const requestedUserId = c.req.query('userId') || user.id;

    // Wait, D1 SQLite syntax
    // Get last 12 months sum of commissions for user
    const query = sql`
        WITH RECURSIVE months(n, month_date) AS (
            SELECT 0, date('now', 'start of month')
            UNION ALL
            SELECT n+1, date(month_date, '-1 month')
            FROM months LIMIT 12
        )
        SELECT 
            strftime('%Y-%m', m.month_date) as month,
            IFNULL(SUM(cl.amount), 0) as commission
        FROM months m
        LEFT JOIN commission_ledger cl 
            ON cl.recipient_id = ${requestedUserId} 
            AND cl.status = 'confirmed'
            AND strftime('%Y-%m', cl.created_at) = strftime('%Y-%m', m.month_date)
        GROUP BY m.month_date
        ORDER BY m.month_date ASC;
    `;

    const result = await db.all(query);

    return c.json({ data: result });
});

api.get('/jamaah-monthly', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);
    const requestedUserId = c.req.query('userId') || user.id;

    const query = sql`
        WITH RECURSIVE months(n, month_date) AS (
            SELECT 0, date('now', 'start of month')
            UNION ALL
            SELECT n+1, date(month_date, '-1 month')
            FROM months LIMIT 12
        )
        SELECT 
            strftime('%Y-%m', m.month_date) as month,
            COUNT(b.id) as jamaah
        FROM months m
        LEFT JOIN bookings b 
            ON b.affiliator_id = ${requestedUserId}
            AND b.booking_status != 'cancelled'
            AND b.booking_status != 'rejected'
            AND strftime('%Y-%m', b.created_at) = strftime('%Y-%m', m.month_date)
        GROUP BY m.month_date
        ORDER BY m.month_date ASC;
    `;

    const result = await db.all(query);

    return c.json({ data: result });
});

export default api;
