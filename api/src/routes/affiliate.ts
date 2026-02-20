import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import {
    commissionRules,
    commissionLedger,
    bookings,
    users,
    affiliateClicks,
} from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// ─────────────────────────────────────────
// 1. TRACK AFFILIATE CLICK (Public)
// ─────────────────────────────────────────
api.post('/track-click', zValidator('json', z.object({
    affiliateCode: z.string(),
})), async (c) => {
    const { affiliateCode } = c.req.valid('json');
    const db = getDb(c.env.DB);

    // Cari user pemilik kode
    const [owner] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.affiliateCode, affiliateCode))
        .limit(1);

    await db.insert(affiliateClicks).values({
        affiliateCode,
        userId: owner?.id || null,
        ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
        userAgent: c.req.header('user-agent') || null,
    });

    return c.json({ message: 'Click tracked' });
});

// ─────────────────────────────────────────
// 2. AFFILIATOR DASHBOARD (Login required)
// ─────────────────────────────────────────
api.get('/dashboard', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    // Ambil data user (untuk affiliate code)
    const [userData] = await db
        .select({ affiliateCode: users.affiliateCode, role: users.role })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

    // Total referral (bookings yang dibuat via affiliatorId = user.id)
    const myBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.affiliatorId, user.id));

    // Komisi dari ledger
    const myLedger = await db
        .select()
        .from(commissionLedger)
        .where(eq(commissionLedger.userId, user.id));

    const totalPending = myLedger
        .filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + e.amount, 0);

    const totalPaid = myLedger
        .filter(e => e.status === 'paid')
        .reduce((sum, e) => sum + e.amount, 0);

    // Klik affiliate
    const clicks = await db
        .select()
        .from(affiliateClicks)
        .where(eq(affiliateClicks.userId, user.id));

    return c.json({
        affiliateCode: userData?.affiliateCode,
        role: userData?.role,
        stats: {
            totalReferrals: myBookings.length,
            totalClicks: clicks.length,
            totalCommissionPending: totalPending,
            totalCommissionPaid: totalPaid,
        }
    });
});

// ─────────────────────────────────────────
// 3. MY BOOKINGS via affiliate link
// ─────────────────────────────────────────
api.get('/my-bookings', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const data = await db.query.bookings.findMany({
        where: eq(bookings.affiliatorId, user.id),
        with: {
            pilgrim: true,
            departure: {
                with: { package: true }
            },
            invoices: true,
        },
        orderBy: (b, { desc }) => [desc(b.bookedAt)],
    });

    return c.json(data);
});

// ─────────────────────────────────────────
// 4. COMMISSION HISTORY (Login required)
// ─────────────────────────────────────────
api.get('/commission-history', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const history = await db.query.commissionLedger.findMany({
        where: eq(commissionLedger.userId, user.id),
        with: {
            booking: {
                with: { pilgrim: true }
            }
        },
        orderBy: (l, { desc }) => [desc(l.createdAt)],
    });

    return c.json(history);
});

// ─────────────────────────────────────────
// 5. COMMISSION RULES — CRUD (pusat only)
// ─────────────────────────────────────────
api.get('/commission-rules', authMiddleware, requireRole('pusat'), async (c) => {
    const db = getDb(c.env.DB);
    const rules = await db.query.commissionRules.findMany({
        with: { user: true },
        orderBy: (r, { asc }) => [asc(r.createdAt)],
    });
    return c.json(rules);
});

api.post('/commission-rules', authMiddleware, requireRole('pusat'),
    zValidator('json', z.object({
        userId: z.string(),
        targetRole: z.enum(['cabang', 'mitra', 'agen', 'reseller']),
        packageId: z.string().optional(),
        commissionType: z.enum(['flat', 'percentage']),
        commissionValue: z.number().min(0),
    })),
    async (c) => {
        const data = c.req.valid('json');
        const db = getDb(c.env.DB);
        const [rule] = await db.insert(commissionRules).values(data).returning();
        return c.json(rule, 201);
    }
);

api.patch('/commission-rules/:id', authMiddleware, requireRole('pusat'),
    zValidator('json', z.object({
        commissionType: z.enum(['flat', 'percentage']).optional(),
        commissionValue: z.number().min(0).optional(),
    })),
    async (c) => {
        const id = c.req.param('id');
        const data = c.req.valid('json');
        const db = getDb(c.env.DB);
        const [rule] = await db.update(commissionRules).set(data).where(eq(commissionRules.id, id)).returning();
        return c.json(rule);
    }
);

api.delete('/commission-rules/:id', authMiddleware, requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    await db.delete(commissionRules).where(eq(commissionRules.id, id));
    return c.json({ message: 'Rule deleted' });
});

// ─────────────────────────────────────────
// 6. ALL LEDGER ENTRIES (pusat only)
// ─────────────────────────────────────────
api.get('/ledger', authMiddleware, requireRole('pusat'), async (c) => {
    const db = getDb(c.env.DB);

    const ledger = await db.query.commissionLedger.findMany({
        with: {
            user: true,
            booking: {
                with: { pilgrim: true }
            }
        },
        orderBy: (l, { desc }) => [desc(l.createdAt)],
    });

    return c.json(ledger);
});

// ─────────────────────────────────────────
// 7. DISBURSE COMMISSION (pusat only)
// ─────────────────────────────────────────
api.post('/ledger/:id/disburse', authMiddleware, requireRole('pusat'), async (c) => {
    const ledgerId = c.req.param('id');
    const adminUser = c.get('user');
    const db = getDb(c.env.DB);

    const [entry] = await db.select().from(commissionLedger).where(eq(commissionLedger.id, ledgerId)).limit(1);
    if (!entry) return c.json({ error: 'Ledger entry not found' }, 404);
    if (entry.status === 'paid') return c.json({ error: 'Already paid' }, 400);

    const [updated] = await db.update(commissionLedger)
        .set({
            status: 'paid',
            paidAt: new Date().toISOString(),
            paidBy: adminUser.id,
        })
        .where(eq(commissionLedger.id, ledgerId))
        .returning();

    return c.json(updated);
});

export default api;
