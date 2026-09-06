import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and, ne, or, desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { users, hierarchyPaths } from '../db/schema.js';
import { hashPassword } from '../lib/password.js';
import { authMiddleware } from '../middleware/auth.js';
import { getAllowedDownlineRoles } from '../lib/roleHierarchy.js';
import { insertUserWithHierarchy, getDirectDownlines } from '../services/hierarchy.js';
import { normalizePhone } from '../lib/phone.js';
import { Env } from '../index.js';

type Variables = {
    user: {
        id: string;
        email: string;
        role: string;
    }
}

const userStore = new Hono<{ Bindings: Env, Variables: Variables }>();

// ========================================================
// ADMIN USER MANAGEMENT (Role: pusat)
// ========================================================

// GET /api/users/all - Get all users for admin pusat
userStore.get('/all', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    if (currentUser.role !== 'pusat') {
        return c.json({ error: 'Akses khusus Admin Pusat' }, 403);
    }

    const db = getDb(c.env.DB);
    const allUsers = await db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
    });

    const safeUsers = allUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        nik: u.nik,
        role: u.role,
        affiliateCode: u.affiliateCode,
        isActive: u.isActive,
        canFieldAttendance: !!u.canFieldAttendance || ['agen', 'reseller', 'mitra'].includes(u.role),
        parentId: u.parentId,
        createdAt: u.createdAt,
    }));

    return c.json({ users: safeUsers });
});

// POST /api/users/admin-create - Admin pusat creates any user role
const adminCreateUserSchema = z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter'),
    email: z.string().email('Format email tidak valid').optional().nullable(),
    phone: z.string().min(8, 'Nomor HP/WA minimal 8 digit'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    role: z.enum(['pusat', 'cabang', 'mitra', 'agen', 'reseller', 'teknisi', 'pic_produk', 'pic_logistik', 'pic_jamaah', 'finance', 'marketing', 'staff']),
    nik: z.string().optional().nullable(),
    affiliateCode: z.string().optional().nullable(),
    canFieldAttendance: z.boolean().optional(),
});

userStore.post('/admin-create', authMiddleware, zValidator('json', adminCreateUserSchema), async (c) => {
    const currentUser = c.get('user');
    if (currentUser.role !== 'pusat') {
        return c.json({ error: 'Akses khusus Admin Pusat' }, 403);
    }

    const body = c.req.valid('json');
    const db = getDb(c.env.DB);
    const hashedPassword = await hashPassword(body.password);
    const normalizedPhone = normalizePhone(body.phone);

    try {
        const newUserId = crypto.randomUUID();
        const autoAffCode = body.affiliateCode || `USR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        await db.insert(users).values({
            id: newUserId,
            email: body.email || null,
            password: hashedPassword,
            name: body.name.trim(),
            phone: normalizedPhone,
            nik: body.nik || null,
            role: body.role,
            parentId: currentUser.id,
            affiliateCode: autoAffCode,
            isActive: true,
            canFieldAttendance: body.canFieldAttendance ?? false,
        });

        // Maintain closure hierarchy
        await insertUserWithHierarchy(c.env.DB, newUserId, currentUser.id);

        return c.json({
            success: true,
            message: `User ${body.name} (${body.role}) berhasil dibuat`,
            user: { id: newUserId, name: body.name, role: body.role, phone: normalizedPhone, email: body.email }
        }, 201);
    } catch (error: any) {
        console.error('Admin create user error:', error);
        if (error.message?.includes('UNIQUE')) {
            if (error.message?.includes('phone')) return c.json({ error: 'Nomor telepon/WA sudah terdaftar' }, 400);
            if (error.message?.includes('email')) return c.json({ error: 'Email sudah terdaftar' }, 400);
            if (error.message?.includes('nik')) return c.json({ error: 'NIK sudah terdaftar di sistem' }, 400);
            return c.json({ error: 'Email, Telepon, NIK, atau Kode Afiliasi sudah digunakan akun lain' }, 400);
        }
        return c.json({ error: 'Gagal membuat user' }, 500);
    }
});

// PUT /api/users/admin-update/:id - Update user details by admin pusat
const adminUpdateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().min(8).optional(),
    role: z.enum(['pusat', 'cabang', 'mitra', 'agen', 'reseller', 'teknisi', 'pic_produk', 'pic_logistik', 'pic_jamaah', 'finance', 'marketing', 'staff']).optional(),
    nik: z.string().optional().nullable(),
    affiliateCode: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    canFieldAttendance: z.boolean().optional(),
    password: z.string().min(6).optional().nullable(),
});

userStore.put('/admin-update/:id', authMiddleware, zValidator('json', adminUpdateUserSchema), async (c) => {
    const currentUser = c.get('user');
    if (currentUser.role !== 'pusat') {
        return c.json({ error: 'Akses khusus Admin Pusat' }, 403);
    }

    const targetId = c.req.param('id');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.phone) updateData.phone = normalizePhone(body.phone);
    if (body.role) updateData.role = body.role;
    if (body.nik !== undefined) updateData.nik = body.nik || null;
    if (body.affiliateCode !== undefined) updateData.affiliateCode = body.affiliateCode || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.canFieldAttendance !== undefined) updateData.canFieldAttendance = body.canFieldAttendance;
    if (body.password) updateData.password = await hashPassword(body.password);

    try {
        await db.update(users).set(updateData).where(eq(users.id, targetId));
        return c.json({ success: true, message: 'Data user berhasil diperbarui' });
    } catch (error: any) {
        console.error('Admin update user error:', error);
        return c.json({ error: 'Gagal memperbarui data user' }, 500);
    }
});

// DELETE /api/users/admin-delete/:id - Delete user
userStore.delete('/admin-delete/:id', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    if (currentUser.role !== 'pusat') {
        return c.json({ error: 'Akses khusus Admin Pusat' }, 403);
    }

    const targetId = c.req.param('id');
    if (targetId === currentUser.id) {
        return c.json({ error: 'Tidak dapat menghapus akun Anda sendiri' }, 400);
    }

    const db = getDb(c.env.DB);
    try {
        await db.delete(hierarchyPaths).where(or(eq(hierarchyPaths.ancestorId, targetId), eq(hierarchyPaths.descendantId, targetId)));
        await db.delete(users).where(eq(users.id, targetId));
        return c.json({ success: true, message: 'User berhasil dihapus' });
    } catch (error: any) {
        console.error('Admin delete user error:', error);
        return c.json({ error: 'Gagal menghapus user' }, 500);
    }
});

// ========================================================
// DOWNLINE & GENERAL USER ENDPOINTS
// ========================================================

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().min(10),
    password: z.string().min(6),
    affiliateCode: z.string().optional(),
    targetRole: z.string().optional(),
    nik: z.string().length(16, 'NIK harus tepat 16 digit'),
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
            if (error.message?.includes('nik')) {
                return c.json({ error: 'NIK sudah terdaftar di sistem' }, 400);
            }
            return c.json({ error: 'Email, NIK, atau Kode Afiliasi sudah terdaftar' }, 400);
        }
        return c.json({ error: 'Failed to create user' }, 500);
    }
});

userStore.get('/downline', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    const downlines = await getDirectDownlines(c.env.DB, currentUser.id);
    return c.json({ downlines });
});

userStore.get('/', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    const downlines = await getDirectDownlines(c.env.DB, currentUser.id);
    return c.json({ users: downlines });
});

userStore.get('/check-nik', authMiddleware, async (c) => {
    const nik = c.req.query('nik');
    if (!nik || nik.length !== 16) {
        return c.json({ valid: false, error: 'NIK harus 16 digit' });
    }
    const db = getDb(c.env.DB);
    const existing = await db.select({ id: users.id, name: users.name, role: users.role })
        .from(users).where(eq(users.nik, nik)).limit(1);
    if (existing.length > 0) {
        return c.json({ exists: true, user: existing[0] });
    }
    return c.json({ exists: false });
});

const updateUserSchema = z.object({
    email: z.string().email().optional().nullable(),
    phone: z.string().min(10).optional(),
    password: z.string().min(6).optional().nullable(),
    wahaApiUrl: z.string().optional().nullable(),
    wahaApiKey: z.string().optional().nullable(),
    wahaSession: z.string().optional().nullable(),
});

userStore.get('/profile', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    const db = getDb(c.env.DB);
    const user = await db.query.users.findFirst({
        where: eq(users.id, currentUser.id),
    });
    if (!user) return c.json({ error: 'Not found' }, 404);
    return c.json({
        email: user.email,
        phone: user.phone,
        wahaApiUrl: user.wahaApiUrl,
        wahaApiKey: user.wahaApiKey,
        wahaSession: user.wahaSession
    });
});

userStore.put('/me', authMiddleware, zValidator('json', updateUserSchema), async (c) => {
    const currentUser = c.get('user');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    try {
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

        const updateData: any = {};
        if (body.email !== undefined) updateData.email = body.email || null;
        if (body.phone) updateData.phone = normalizePhone(body.phone);
        if (body.password) {
            updateData.password = await hashPassword(body.password);
        }

        if (currentUser.role === 'pusat') {
            if (body.wahaApiUrl !== undefined) updateData.wahaApiUrl = body.wahaApiUrl;
            if (body.wahaApiKey !== undefined) updateData.wahaApiKey = body.wahaApiKey;
            if (body.wahaSession !== undefined) updateData.wahaSession = body.wahaSession || 'default';
        }

        if (Object.keys(updateData).length === 0) {
            return c.json({ message: 'Tidak ada perubahan data' });
        }

        await db.update(users)
            .set(updateData)
            .where(eq(users.id, currentUser.id));

        return c.json({ message: 'Profil berhasil diperbarui' });
    } catch (error: any) {
        console.error('Update profile error:', error);
        return c.json({ error: 'Gagal memperbarui profil' }, 500);
    }
});

export default userStore;
