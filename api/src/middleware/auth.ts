import { createMiddleware } from 'hono/factory';
import { verifyToken } from '../lib/jwt.js';
import { Env } from '../index.js';

export const authMiddleware = createMiddleware<{
    Bindings: Env,
    Variables: {
        user: { id: string; email: string; role: string; }
    }
}>(async (c, next) => {

    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized: No token provided' }, 401);
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = c.env.JWT_SECRET || 'fallback-secret-for-dev';

    console.log('Verifying token with secret length:', jwtSecret.length);
    const payload = await verifyToken(token, jwtSecret);

    if (!payload) {
        console.log('Token verification failed for token:', token.substring(0, 10) + '...');
        return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }


    c.set('user', {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string,
    });


    await next();
});
