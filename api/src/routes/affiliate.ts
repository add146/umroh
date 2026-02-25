import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import {
    commissionRules,
    commissionLedger,
    disbursementRequests,
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

// ─────────────────────────────────────────
// 8. PUBLIC AGENT PROFILE (No auth)
// ─────────────────────────────────────────
api.get('/agent/:code', async (c) => {
    const code = c.req.param('code');
    const db = getDb(c.env.DB);

    const [agent] = await db
        .select({
            id: users.id,
            name: users.name,
            role: users.role,
            affiliateCode: users.affiliateCode,
        })
        .from(users)
        .where(eq(users.affiliateCode, code))
        .limit(1);

    if (!agent) {
        return c.json({ error: 'Agent not found' }, 404);
    }

    return c.json({ agent: { id: agent.id, name: agent.name, affiliateCode: agent.affiliateCode, role: agent.role } });
});

// ─────────────────────────────────────────
// 9. CHECK NIK AVAILABILITY (No auth)
// ─────────────────────────────────────────
api.get('/check-nik/:nik', async (c) => {
    const nik = c.req.param('nik');
    const db = getDb(c.env.DB);

    const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.nik, nik))
        .limit(1);

    return c.json({ available: !existing });
});

// ─────────────────────────────────────────
// 10. PUBLIC RESELLER REGISTRATION (No auth)
// ─────────────────────────────────────────
api.post('/register-reseller', zValidator('json', z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
    nik: z.string().min(16).max(16),
    agentCode: z.string(),
})), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    // 1. Find agent by affiliate code
    const [agent] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.affiliateCode, body.agentCode))
        .limit(1);

    if (!agent || agent.role !== 'agen') {
        return c.json({ error: 'Kode agen tidak valid' }, 404);
    }

    // 2. Check NIK uniqueness
    const [existingNik] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.nik, body.nik))
        .limit(1);

    if (existingNik) {
        return c.json({ error: 'NIK sudah terdaftar di sistem' }, 400);
    }

    // 3. Check email uniqueness
    const [existingEmail] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

    if (existingEmail) {
        return c.json({ error: 'Email sudah terdaftar' }, 400);
    }

    // 4. Hash password & create reseller
    const { hashPassword } = await import('../lib/password.js');
    const hashedPassword = await hashPassword(body.password);
    const affiliateCode = `AFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
        const [newUser] = await db.insert(users).values({
            name: body.name,
            email: body.email,
            phone: body.phone,
            nik: body.nik,
            password: hashedPassword,
            role: 'reseller',
            parentId: agent.id,
            affiliateCode,
        }).returning({ id: users.id });

        // 5. Insert hierarchy paths
        const { insertUserWithHierarchy } = await import('../services/hierarchy.js');
        await insertUserWithHierarchy(c.env.DB, newUser.id, agent.id);

        return c.json({
            message: 'Pendaftaran reseller berhasil! Silakan login.',
            user: { id: newUser.id, affiliateCode }
        }, 201);
    } catch (error: any) {
        if (error.message?.includes('UNIQUE')) {
            return c.json({ error: 'Data sudah terdaftar' }, 400);
        }
        return c.json({ error: 'Gagal mendaftar' }, 500);
    }
});

// ─────────────────────────────────────────
// 11. MY RESELLERS (Agen only)
// ─────────────────────────────────────────
api.get('/my-resellers', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const resellers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            affiliateCode: users.affiliateCode,
            isActive: users.isActive,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(and(eq(users.parentId, user.id), eq(users.role, 'reseller')))
        .orderBy(desc(users.createdAt));

    return c.json({ resellers });
});

// ─────────────────────────────────────────
// 12. DISBURSEMENT REQUESTS
// ─────────────────────────────────────────

// A. Get list of requests (Admin see all, User see own)
api.get('/disbursement-requests', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    if (user.role === 'pusat') {
        const reqs = await db.query.disbursementRequests.findMany({
            with: { user: true },
            orderBy: (dr, { desc }) => [desc(dr.requestedAt)],
        });
        return c.json(reqs);
    } else {
        const reqs = await db.query.disbursementRequests.findMany({
            where: eq(disbursementRequests.userId, user.id),
            orderBy: (dr, { desc }) => [desc(dr.requestedAt)],
        });
        return c.json(reqs);
    }
});

// B. Request a new disbursement (Affiliator)
api.post('/request-disbursement', authMiddleware, zValidator('json', z.object({
    amount: z.number().min(10000),
    bankName: z.string().min(2),
    accountNumber: z.string().min(5),
    accountHolder: z.string().min(3),
})), async (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');
    const db = getDb(c.env.DB);

    // Verify balance first
    const myLedger = await db.select().from(commissionLedger).where(eq(commissionLedger.userId, user.id));
    const paidBalance = myLedger.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);

    // We need to also subtract the amount already requested/paid through disbursement
    const myRequests = await db.select().from(disbursementRequests).where(eq(disbursementRequests.userId, user.id));
    const usedBalance = myRequests.filter(e => ['pending', 'approved', 'paid'].includes(e.status!)).reduce((sum, e) => sum + e.amount, 0);

    const availableBalance = paidBalance - usedBalance;

    if (data.amount > availableBalance) {
        return c.json({ error: 'Insufficent available commission balance' }, 400);
    }

    const [req] = await db.insert(disbursementRequests).values({
        userId: user.id,
        amount: data.amount,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountHolder: data.accountHolder,
        status: 'pending',
    }).returning();

    return c.json(req, 201);
});

// C. Approve/Reject/Pay a request (Admin)
api.patch('/disbursement-requests/:id', authMiddleware, requireRole('pusat'), zValidator('json', z.object({
    status: z.enum(['approved', 'paid', 'rejected']),
    adminNotes: z.string().optional(),
})), async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const data = c.req.valid('json');
    const db = getDb(c.env.DB);

    const [updated] = await db.update(disbursementRequests)
        .set({
            status: data.status,
            adminNotes: data.adminNotes,
            processedAt: new Date().toISOString(),
            processedBy: user.id,
        })
        .where(eq(disbursementRequests.id, id))
        .returning();

    return c.json(updated);
});

export default api;
