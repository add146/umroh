import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { prospects, users, hierarchyPaths } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';
import { getDownlineTree } from '../services/hierarchy.js';

const api = new Hono<{ Bindings: Env, Variables: { user: any } }>();

const assignLeadSchema = z.object({
    targetAgentId: z.string().uuid(),
    fullName: z.string().min(2),
    phone: z.string().optional(),
    notes: z.string().optional(),
});

// 1. Cabang/Mitra assign lead ke Agen
api.post('/assign', authMiddleware, requireRole('cabang', 'mitra'), zValidator('json', assignLeadSchema), async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);
    const body = c.req.valid('json');

    // Verify targetAgentId is actually in their downline
    const isDownline = await db.select().from(hierarchyPaths)
        .where(and(
            eq(hierarchyPaths.ancestorId, user.id),
            eq(hierarchyPaths.descendantId, body.targetAgentId)
        )).limit(1);

    if (isDownline.length === 0) {
        return c.json({ error: 'Target agent must be in your downline' }, 403);
    }

    // Auto-create prospect for the target agent
    try {
        const newProspect = await db.insert(prospects).values({
            ownerId: body.targetAgentId,
            fullName: body.fullName,
            phone: body.phone,
            notes: body.notes ? `Assigned by ${user.role}: ${body.notes}` : `Assigned by ${user.role} ${user.name}`,
            source: 'assigned_lead',
            status: 'new',
        }).returning();

        // Integrate audit logger here later in Phase D

        return c.json({ message: 'Lead assigned successfully', prospect: newProspect[0] }, 201);
    } catch (e: any) {
        return c.json({ error: 'Failed to assign lead: ' + e.message }, 500);
    }
});

// 2. Agen lihat lead masuk
api.get('/incoming', authMiddleware, requireRole('agen'), async (c) => {
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const data = await db.select().from(prospects).where(
        and(
            eq(prospects.ownerId, user.id),
            eq(prospects.source, 'assigned_lead'),
            eq(prospects.status, 'new')
        )
    );

    return c.json({ incomingLeads: data });
});

export default api;
