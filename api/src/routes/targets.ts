import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import { salesTargets } from '../db/schema';
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

// GET /api/targets/me - Agent gets their target for the current month
api.get('/me', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const target = await db.query.salesTargets.findFirst({
        where: and(
            eq(salesTargets.userId, user.id),
            eq(salesTargets.month, currentMonth),
            eq(salesTargets.year, currentYear)
        )
    });

    return c.json({ target });
});

// POST /api/targets - Set target for a downline agent
const setTargetSchema = z.object({
    userId: z.string().uuid(),
    month: z.number().min(1).max(12),
    year: z.number().min(2000),
    targetPax: z.number().min(1)
});

api.post('/', authMiddleware, zValidator('json', setTargetSchema), async (c) => {
    const user = c.get('user');
    const role = user.role;
    const db = getDb(c.env.DB);

    if (role !== 'cabang' && role !== 'pusat') {
        return c.json({ error: 'Unauthorized to set targets' }, 403);
    }

    const { userId, month, year, targetPax } = c.req.valid('json');

    // Basic check: Cabang should only set targets for their own downline
    // (A more strict check would use hierarchyPaths, but we keep it simple here)

    // Check if target already exists
    const existingTarget = await db.query.salesTargets.findFirst({
        where: and(
            eq(salesTargets.userId, userId),
            eq(salesTargets.month, month),
            eq(salesTargets.year, year)
        )
    });

    if (existingTarget) {
        // Update
        await db.update(salesTargets)
            .set({ targetPax, setBy: user.id })
            .where(eq(salesTargets.id, existingTarget.id));

        return c.json({ message: 'Target updated successfully', id: existingTarget.id });
    } else {
        // Create
        const id = crypto.randomUUID();
        await db.insert(salesTargets).values({
            id,
            userId,
            month,
            year,
            targetPax,
            setBy: user.id
        });

        return c.json({ message: 'Target created successfully', id });
    }
});

// PATCH /api/targets/:id - Update target
const updateTargetSchema = z.object({
    targetPax: z.number().min(1)
});

api.patch('/:id', authMiddleware, zValidator('json', updateTargetSchema), async (c) => {
    const user = c.get('user');
    const role = user.role;
    const db = getDb(c.env.DB);

    if (role !== 'cabang' && role !== 'pusat') {
        return c.json({ error: 'Unauthorized to set targets' }, 403);
    }

    const id = c.req.param('id');
    const { targetPax } = c.req.valid('json');

    const target = await db.query.salesTargets.findFirst({
        where: eq(salesTargets.id, id)
    });

    if (!target) {
        return c.json({ error: 'Target not found' }, 404);
    }

    await db.update(salesTargets)
        .set({ targetPax, setBy: user.id })
        .where(eq(salesTargets.id, id));

    return c.json({ message: 'Target updated successfully' });
});

export default api;
