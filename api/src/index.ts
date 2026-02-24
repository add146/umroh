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
            // Jika request tidak memiliki origin (misal dari server to server atau curl testing backend), kembalikan default.
            if (!origin) return c.env.FRONTEND_URL || 'http://localhost:5173';

            const allowedOrigins = [
                'http://localhost:5173',
                'http://localhost:3000',
                c.env.FRONTEND_URL,
            ].filter(Boolean);

            // Jika origin cocok dgn yg di whitelist, izinkan. Termasuk domain preview pages.dev.
            if (
                allowedOrigins.includes(origin) ||
                /^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin) ||
                /^https:\/\/[a-z0-9-]+\.umroh-3vl\.pages\.dev$/.test(origin)
            ) {
                return origin;
            }

            // Jika tidak cocok, tolak dan fallback ke url production. Ini mungkin menyebabkan CORS error tapi aman dari sniffing.
            return c.env.FRONTEND_URL || 'https://umroh.khibroh.com';
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
import packageTypesRoutes from './routes/package-types.js';
import departureRoutes from './routes/departures.js';
import bookingRoutes from './routes/bookings.js';
import seatRoutes from './routes/seats.js';
import paymentRoutes from './routes/payments.js';
import affiliateRoutes from './routes/affiliate.js';
import documentRoutes from './routes/documents.js';
import operationRoutes from './routes/operations.js';
import communicationRoutes from './routes/communication.js';
import exportRoutes from './routes/export.js';
import mastersRoutes from './routes/masters.js';

import prospectRoutes from './routes/prospects.js';
import marketingKitRoutes from './routes/marketing-kit.js';
import leadsRoutes from './routes/leads.js';
import auditRoutes from './routes/audit.js';


app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/packages', packageRoutes);
app.route('/api/package-types', packageTypesRoutes);
app.route('/api/departures', departureRoutes);
app.route('/api/masters', mastersRoutes);
app.route('/api/bookings', bookingRoutes);
app.route('/api/seats', seatRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/affiliate', affiliateRoutes);
app.route('/api/documents', documentRoutes);
app.route('/api/operations', operationRoutes);
app.route('/api/comm', communicationRoutes);
app.route('/api/export', exportRoutes);

app.route('/api/prospects', prospectRoutes);
app.route('/api/marketing-kit', marketingKitRoutes);
app.route('/api/leads', leadsRoutes);
app.route('/api/audit-log', auditRoutes);

app.get('/api/seed-test', async (c) => {
    const { getDb } = await import('./db/index.js');
    const { users, hierarchyPaths, packages, departures, roomTypes, pilgrims, bookings } = await import('./db/schema.js');
    const { hashPassword } = await import('./lib/password.js');
    const db = getDb(c.env.DB);
    try {
        const hp = await hashPassword('password123');

        // 1. Create Cabang
        const cabangId = 'cabang-test-123';
        await db.insert(users).values({
            id: cabangId,
            email: 'cabang.test@umroh.com',
            name: 'Cabang Test',
            password: hp,
            role: 'cabang',
            phone: '0811111111'
        }).onConflictDoNothing();

        // 2. Create Agen (under Cabang)
        const agenId = 'agen-test-123';
        await db.insert(users).values({
            id: agenId,
            email: 'agen.test@umroh.com',
            name: 'Agen Test',
            password: hp,
            role: 'agen',
            phone: '0822222222',
            parentId: cabangId
        }).onConflictDoNothing();

        await db.insert(hierarchyPaths).values([
            { ancestorId: cabangId, descendantId: cabangId, pathLength: 0 },
            { ancestorId: agenId, descendantId: agenId, pathLength: 0 },
            { ancestorId: cabangId, descendantId: agenId, pathLength: 1 }
        ]).onConflictDoNothing();

        // 3. Create Package & Departure
        const pkgId = 'pkg-test-123';
        await db.insert(packages).values({
            id: pkgId,
            name: 'Testing Package',
            slug: 'test-pkg-123',
            basePrice: 20000000
        }).onConflictDoNothing();

        const depId = 'dep-test-123';
        await db.insert(departures).values({
            id: depId,
            packageId: pkgId,
            departureDate: '2026-10-10',
            airport: 'CGK',
            totalSeats: 45
        }).onConflictDoNothing();

        const roomId = 'room-test-123';
        await db.insert(roomTypes).values({
            id: roomId,
            departureId: depId,
            name: 'Quad',
            capacity: 4
        }).onConflictDoNothing();

        // 4. Create Pilgrim & Booking
        const pilId = 'pilgrim-test-123';
        await db.insert(pilgrims).values({
            id: pilId,
            name: 'Fulan bin Fulan',
            noKtp: '1234567812345678',
            sex: 'L',
            born: '1990-01-01',
            address: 'Jakarta',
            fatherName: 'Bapak Fulan',
            maritalStatus: 'Belum Menikah',
            phone: '0833333333',
            lastEducation: 'S1',
            work: 'Swasta',
            famContactName: 'Istri',
            famContact: '0844444444',
            sourceFrom: 'Brosur'
        }).onConflictDoNothing();

        const bookId = 'book-test-123';
        await db.insert(bookings).values({
            id: bookId,
            departureId: depId,
            pilgrimId: pilId,
            roomTypeId: roomId,
            affiliatorId: agenId,
            totalPrice: 20000000,
            paymentStatus: 'unpaid',
            bookingStatus: 'pending' // READY FOR AGENT TO REVIEW
        }).onConflictDoNothing();

        return c.json({ success: true, message: 'Seed successful. Agen: agen.test@umroh.com (password123). Cabang: cabang.test@umroh.com (password123)' });
    } catch (err: any) {
        return c.json({ success: false, error: err.message });
    }
});

app.get('/api/seed-dummy', async (c) => {
    const { getDb } = await import('./db/index.js');
    const { pilgrims, bookings } = await import('./db/schema.js');
    const db = getDb(c.env.DB);
    try {
        const depId = 'dep-test-123';
        const roomId = 'room-test-123';
        const agenId = 'agen-test-123';

        const dummies = [
            { id: 'pil-dummy-1', name: 'Budi Santoso', ktp: '3512345678900001', sex: 'L' },
            { id: 'pil-dummy-2', name: 'Siti Aminah', ktp: '3512345678900002', sex: 'P' },
            { id: 'pil-dummy-3', name: 'Ahmad Fauzi', ktp: '3512345678900003', sex: 'L' }
        ];

        for (const pt of dummies) {
            await db.insert(pilgrims).values({
                id: pt.id,
                name: pt.name,
                noKtp: pt.ktp,
                sex: pt.sex as any,
                born: '1985-05-15',
                address: 'Jl. Merdeka No. 10, Jakarta',
                fatherName: 'Bapak ' + pt.name.split(' ')[0],
                maritalStatus: 'Menikah',
                phone: '08500000000' + pt.id.slice(-1),
                lastEducation: 'SMA',
                work: 'Wiraswasta',
                famContactName: 'Keluarga ' + pt.name.split(' ')[0],
                famContact: '0860000000' + pt.id.slice(-1),
                sourceFrom: 'Sosial Media'
            }).onConflictDoNothing();

            await db.insert(bookings).values({
                id: 'book-' + pt.id,
                departureId: depId,
                pilgrimId: pt.id,
                roomTypeId: roomId,
                affiliatorId: agenId,
                totalPrice: 20000000,
                paymentStatus: 'unpaid',
                bookingStatus: 'pending'
            }).onConflictDoNothing();
        }

        return c.json({ success: true, message: '3 Dummy jamaah created successfully' });
    } catch (err: any) {
        return c.json({ success: false, error: err.message });
    }
});

export default app;


