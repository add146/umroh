import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export type Env = {
    DB: D1Database;
    R2_DOCUMENTS: R2Bucket;
    ENVIRONMENT: string;
    FRONTEND_URL: string;
    JWT_SECRET: string;
    MIDTRANS_SERVER_KEY?: string;
    MIDTRANS_CLIENT_KEY?: string;
    WAHA_URL?: string;
    WAHA_TOKEN?: string;
};


const app = new Hono<{
    Bindings: Env,

    Variables: {
        user: {
            id: string;
            email: string;
            role: string;
        }
    }
}>();

// Global middleware
app.use('*', logger());
app.use(
    '/api/*',
    cors({
        origin: (origin, c) => {
            // Allow: localhost dev, all Cloudflare Pages subdomains, and custom FRONTEND_URL
            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:3000',
                c.env.FRONTEND_URL,
            ].filter(Boolean);

            // Also allow any *.pages.dev subdomain (Cloudflare Pages previews)
            if (origin && (
                allowedOrigins.includes(origin) ||
                /^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin) ||
                /^https:\/\/[a-z0-9-]+\.umroh-3vl\.pages\.dev$/.test(origin)
            )) {
                return origin;
            }
            return allowedOrigins[0] || 'http://localhost:5173';
        },
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
    })
);

// Security headers middleware
app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (c.env.ENVIRONMENT === 'production') {
        c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
});

// Simple rate limiter (60 req/min per IP)
const rateLimitMap = new Map<string, { count: number; window: number }>();
app.use('/api/*', async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const now = Math.floor(Date.now() / 60000); // 1-minute window
    const key = `${ip}:${now}`;
    const entry = rateLimitMap.get(key) || { count: 0, window: now };

    if (entry.window !== now) {
        rateLimitMap.set(key, { count: 1, window: now });
    } else {
        entry.count++;
        rateLimitMap.set(key, entry);
        if (entry.count > 60) {
            return c.json({ error: 'Too Many Requests' }, 429);
        }
    }
    await next();
});


// Health check
app.get('/', (c) => c.json({ status: 'ok', app: 'Umroh API', version: '1.0.0' }));

// Auth routes
import authRoutes from './routes/auth.js';


import userRoutes from './routes/users.js';
import packageRoutes from './routes/packages.js';
import departureRoutes from './routes/departures.js';
import bookingRoutes from './routes/bookings.js';
import seatRoutes from './routes/seats.js';
import paymentRoutes from './routes/payments.js';
import affiliateRoutes from './routes/affiliate.js';
import documentRoutes from './routes/documents.js';
import operationRoutes from './routes/operations.js';
import communicationRoutes from './routes/communication.js';
import exportRoutes from './routes/export.js';

app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/packages', packageRoutes);
app.route('/api/departures', departureRoutes);
app.route('/api/bookings', bookingRoutes);
app.route('/api/seats', seatRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/affiliate', affiliateRoutes);
app.route('/api/documents', documentRoutes);
app.route('/api/operations', operationRoutes);
app.route('/api/comm', communicationRoutes);
app.route('/api/export', exportRoutes);

export default app;


