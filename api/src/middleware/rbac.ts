import { createMiddleware } from 'hono/factory';
import { Env } from '../index.js';

export const requireRole = (...allowedRoles: string[]) => {
    return createMiddleware<{ Bindings: Env, Variables: { user: any } }>(async (c, next) => {
        const user = c.get('user');
        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        if (!allowedRoles.includes(user.role)) {
            return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
        }

        await next();
    });
};
