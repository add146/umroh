import { Hono } from 'hono';
import { desc } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { auditLog } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env, Variables: { user: any } }>();

// Pusat can view all audit logs
api.get('/', authMiddleware, requireRole('pusat'), async (c) => {
    const db = getDb(c.env.DB);

    // In production, add pagination and filtering
    const logs = await db.query.auditLog.findMany({
        orderBy: [desc(auditLog.createdAt)],
        limit: 100,
        with: {
            // we could relate to user if relation was explicitly named and configured,
            // but for simplicity we join manually or return raw
        }
    });

    return c.json({ logs });
});

export default api;
