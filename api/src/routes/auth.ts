import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { users } from '../db/schema.js';
import { verifyPassword } from '../lib/password.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../lib/jwt.js';
import { setCookie, getCookie } from 'hono/cookie';
import { Env } from '../index.js';

type Variables = {
    user: {
        id: string;
        email: string;
        role: string;
    }
}

const auth = new Hono<{ Bindings: Env, Variables: Variables }>();


const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const db = getDb(c.env.DB);

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user || !user.isActive) {
        return c.json({ error: 'Invalid credentials or inactive account' }, 401);
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const jwtSecret = c.env.JWT_SECRET || 'fallback-secret-for-dev';

    const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = await signAccessToken(payload, jwtSecret);
    const refreshToken = await signRefreshToken({ sub: user.id }, jwtSecret);

    setCookie(c, 'refresh_token', refreshToken, {
        httpOnly: true,
        secure: c.env.ENVIRONMENT === 'production',
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return c.json({
        accessToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    });
});

auth.post('/refresh', async (c) => {
    const refreshToken = getCookie(c, 'refresh_token');
    if (!refreshToken) {
        return c.json({ error: 'No refresh token' }, 401);
    }

    const jwtSecret = c.env.JWT_SECRET || 'fallback-secret-for-dev';
    const payload = await verifyToken(refreshToken, jwtSecret);

    if (!payload || !payload.sub) {
        return c.json({ error: 'Invalid refresh token' }, 401);
    }

    const db = getDb(c.env.DB);
    const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub as string),
    });

    if (!user || !user.isActive) {
        return c.json({ error: 'User not found or inactive' }, 401);
    }

    const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = await signAccessToken(newPayload, jwtSecret);

    return c.json({ accessToken });
});

auth.get('/me', async (c) => {
    const user = c.get('user'); // Assuming auth middleware is used
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    return c.json({ user });
});

export default auth;
