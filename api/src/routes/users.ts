import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword } from '../lib/password.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { canCreateRole, getDownlineRole, UserRole } from '../lib/roleHierarchy.js';
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

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
    affiliateCode: z.string().optional(),
});

// Any role except Reseller can create their direct downline
userStore.post('/', authMiddleware, zValidator('json', createUserSchema), async (c) => {
    const currentUser = c.get('user');
    const body = c.req.valid('json');

    const targetRole = getDownlineRole(currentUser.role as UserRole);
    if (!targetRole) {
        return c.json({ error: 'You cannot create downlines' }, 403);
    }

    const db = getDb(c.env.DB);
    const hashedPassword = await hashPassword(body.password);

    try {
        const newUser = await db.insert(users).values({
            email: body.email,
            password: hashedPassword,
            name: body.name,
            phone: body.phone,
            role: targetRole,
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
            return c.json({ error: 'Email or Affiliate Code already exists' }, 400);
        }
        return c.json({ error: 'Failed to create user' }, 500);
    }
});

userStore.get('/downline', authMiddleware, async (c) => {
    const currentUser = c.get('user');
    const downlines = await getDownlineTree(c.env.DB, currentUser.id);
    return c.json({ downlines });
});

export default userStore;
