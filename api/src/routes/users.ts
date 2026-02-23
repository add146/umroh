import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword } from '../lib/password.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { canCreateRole, getAllowedDownlineRoles, getDefaultDownlineRole, UserRole } from '../lib/roleHierarchy.js';
import { insertUserWithHierarchy, getDownlineTree } from '../services/hierarchy.js';
import { Env } from '../index.js';

type Variables = {
    user: {
        id: string;
        email: string;
        role: string;
    }
}

const userStore = new Hono<{ Bindings: Env, Variables: Variables }>();

import { normalizePhone } from '../lib/phone.js';

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().min(10),
    password: z.string().min(6),
    affiliateCode: z.string().optional(),
    targetRole: z.string().optional(),
    nik: z.string().optional(),
});

// Any role except Reseller can create their direct downline
userStore.post('/', authMiddleware, zValidator('json', createUserSchema), async (c) => {
    const currentUser = c.get('user');
    const body = c.req.valid('json');

    const allowed = getAllowedDownlineRoles(currentUser.role);
    if (allowed.length === 0) {
        return c.json({ error: 'You cannot create downlines' }, 403);
    }

    let targetRole = body.targetRole;
    if (!targetRole || !allowed.includes(targetRole)) {
        targetRole = allowed[0];
    }

    const db = getDb(c.env.DB);
    const hashedPassword = await hashPassword(body.password);
    const normalizedPhone = normalizePhone(body.phone);

    try {
        const newUser = await db.insert(users).values({
            email: body.email || undefined,
            password: hashedPassword,
            name: body.name,
            phone: normalizedPhone,
            nik: body.nik || undefined,
            role: targetRole as 'pusat' | 'cabang' | 'mitra' | 'agen' | 'reseller',
            parentId: currentUser.id,
            affiliateCode: body.affiliateCode || `AFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        }).returning({ id: users.id });

        const newUserId = newUser[0].id;

        // Maintain closures
        await insertUserWithHierarchy(c.env.DB, newUserId, currentUser.id);

        return c.json({
            message: `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} created successfully`,
            user: { id: newUserId, role: targetRole }
        }, 201);
    } catch (error: any) {
        if (error.message?.includes('UNIQUE')) {
            return c.json({ error: 'Email, NIK, or Affiliate Code already exists' }, 400);
        }
        return c.json({ error: 'Failed to create user' }, 500);
    }
});

userStore.get('/downline', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    const { getDirectDownlines } = await import('../services/hierarchy.js');
    const downlines = await getDirectDownlines(c.env.DB, currentUser.id);
    return c.json({ downlines });
});

// GET /api/users — returns all users visible to current user (direct downlines only now)
// Used by AssignLead dropdown and other pages that need user lists
userStore.get('/', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    const { getDirectDownlines } = await import('../services/hierarchy.js');
    const downlines = await getDirectDownlines(c.env.DB, currentUser.id);
    return c.json({ users: downlines });
});

export default userStore;

const updateUserSchema = z.object({
    email: z.string().email().optional().nullable(),
    phone: z.string().min(10).optional(),
    password: z.string().min(6).optional().nullable(),
});

userStore.put('/me', authMiddleware, zValidator('json', updateUserSchema), async (c) => {
    const currentUser = c.get('user');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);
    const { eq, and, ne, or } = await import('drizzle-orm');

    try {
        // 1. Check uniqueness if email or phone is changing
        const conditions = [];
        if (body.email) conditions.push(eq(users.email, body.email));
        if (body.phone) conditions.push(eq(users.phone, normalizePhone(body.phone)));

        if (conditions.length > 0) {
            const existing = await db.select({ id: users.id })
                .from(users)
                .where(
                    and(
                        ne(users.id, currentUser.id),
                        or(...conditions)
                    )
                ).limit(1);

            if (existing.length > 0) {
                return c.json({ error: 'Email atau Nomor WhatsApp sudah digunakan oleh akun lain.' }, 400);
            }
        }

        // 2. Prepare update payload
        const updateData: any = {};
        if (body.email !== undefined) updateData.email = body.email || null;
        if (body.phone) updateData.phone = normalizePhone(body.phone);
        if (body.password) {
            updateData.password = await hashPassword(body.password);
        }

        if (Object.keys(updateData).length === 0) {
            return c.json({ message: 'Tidak ada perubahan data' });
        }

        // 3. Update DB
        await db.update(users)
            .set(updateData)
            .where(eq(users.id, currentUser.id));

        return c.json({ message: 'Profil berhasil diperbarui' });
    } catch (error: any) {
        console.error('Update profile error:', error);
        return c.json({ error: 'Gagal memperbarui profil' }, 500);
    }
});
