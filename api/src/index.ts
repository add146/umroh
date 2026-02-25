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
    IMGBB_API_KEY?: string;
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
                'http://localhost:5174',
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
import leaderboardRoutes from './routes/leaderboard.js';
import alumniRoutes from './routes/alumni.js';
import targetsRoutes from './routes/targets.js';
import chartsRoutes from './routes/charts.js';
import priceCalculatorRoutes from './routes/price-calculator.js';
import reportsRoutes from './routes/reports.js';
import testimonialsRoutes from './routes/testimonials.js';
import uploadRoutes from './routes/upload.js';

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
app.route('/api/leaderboard', leaderboardRoutes);
app.route('/api/alumni', alumniRoutes);
app.route('/api/targets', targetsRoutes);
app.route('/api/charts', chartsRoutes);
app.route('/api/price-calculator', priceCalculatorRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/testimonials', testimonialsRoutes);
app.route('/api/upload', uploadRoutes);

app.get('/api/seed-full', async (c) => {
    const { getDb } = await import('./db/index.js');
    const s = await import('./db/schema.js');
    const { hashPassword } = await import('./lib/password.js');
    const db = getDb(c.env.DB);

    try {
        const hp = await hashPassword('password123');

        // ============ STEP 0: CREATE MISSING TABLES & CLEAR ALL DATA ============
        // Some tables may not have been migrated yet — create them if missing
        const createSql = [
            `CREATE TABLE IF NOT EXISTS testimonials (id text PRIMARY KEY, pilgrim_name text NOT NULL, departure_info text, content text NOT NULL, photo_r2_key text, video_url text, rating integer NOT NULL DEFAULT 5, is_published integer DEFAULT 0, created_at text DEFAULT (datetime('now')))`,
            `CREATE TABLE IF NOT EXISTS equipment_items (id text PRIMARY KEY, name text NOT NULL, description text, created_at text DEFAULT (datetime('now')))`,
            `CREATE TABLE IF NOT EXISTS equipment_checklist (id text PRIMARY KEY, booking_id text NOT NULL, equipment_item_id text NOT NULL, status text DEFAULT 'pending', received_at text, received_by text)`,
            `CREATE TABLE IF NOT EXISTS bank_accounts (id text PRIMARY KEY, bank_name text NOT NULL, account_number text NOT NULL, account_holder text NOT NULL, is_active integer DEFAULT 1, created_at text DEFAULT (datetime('now')))`,
            `CREATE TABLE IF NOT EXISTS package_types (id text PRIMARY KEY, name text NOT NULL, description text, is_active integer DEFAULT 1)`,
            `CREATE TABLE IF NOT EXISTS room_assignments (id text PRIMARY KEY, booking_id text NOT NULL, room_number text NOT NULL, notes text, created_at text DEFAULT (datetime('now')))`,
            `CREATE TABLE IF NOT EXISTS disbursement_requests (id text PRIMARY KEY, user_id text NOT NULL, amount integer NOT NULL, bank_name text NOT NULL, account_number text NOT NULL, account_holder text NOT NULL, status text DEFAULT 'pending', admin_notes text, requested_at text DEFAULT (datetime('now')), processed_at text, processed_by text)`,
            `CREATE TABLE IF NOT EXISTS sales_targets (id text PRIMARY KEY, user_id text NOT NULL, month integer NOT NULL, year integer NOT NULL, target_pax integer NOT NULL, set_by text, created_at text DEFAULT (datetime('now')))`,
        ];
        for (const sql of createSql) {
            try { await c.env.DB.prepare(sql).run(); } catch (_) { /* ignore */ }
        }

        const tables = [
            'equipment_checklist', 'room_assignments', 'documents',
            'payment_transactions', 'payment_invoices', 'commission_ledger',
            'disbursement_requests', 'affiliate_clicks', 'commission_rules',
            'bookings', 'seat_locks', 'pilgrims',
            'room_types', 'departures', 'packages',
            'marketing_materials', 'prospects', 'audit_log', 'sales_targets',
            'testimonials', 'equipment_items', 'bank_accounts',
            'package_types', 'airports', 'airlines', 'hotels',
            'hierarchy_paths', 'users'
        ];
        for (const t of tables) {
            try { await c.env.DB.prepare(`DELETE FROM ${t}`).run(); } catch (_) { /* table may not exist */ }
        }

        // ============ STEP 1: USERS & HIERARCHY ============
        const pusatId = 'usr-pusat-001';
        const cabangJktId = 'usr-cabang-jkt';
        const cabangSbyId = 'usr-cabang-sby';
        const mitraId = 'usr-mitra-001';
        const agenAId = 'usr-agen-001';
        const agenBId = 'usr-agen-002';
        const resellerId = 'usr-reseller-001';
        const teknisiId = 'usr-teknisi-001';

        await db.insert(s.users).values([
            { id: pusatId, email: 'admin@almadinah.co.id', name: 'H. Muhammad Rizki', password: hp, role: 'pusat', phone: '08118889900', affiliateCode: 'PUSAT001' },
            { id: cabangJktId, email: 'jakarta@almadinah.co.id', name: 'Cabang Jakarta Selatan', password: hp, role: 'cabang', phone: '08111000001', parentId: pusatId, affiliateCode: 'CJKT001' },
            { id: cabangSbyId, email: 'surabaya@almadinah.co.id', name: 'Cabang Surabaya', password: hp, role: 'cabang', phone: '08111000002', parentId: pusatId, affiliateCode: 'CSBY001' },
            { id: mitraId, email: 'mitra.ahmad@gmail.com', name: 'H. Ahmad Syafii', password: hp, role: 'mitra', phone: '08122000001', parentId: cabangJktId, affiliateCode: 'MTR001' },
            { id: agenAId, email: 'agen.fatimah@gmail.com', name: 'Fatimah Zahra', password: hp, role: 'agen', phone: '08133000001', parentId: mitraId, affiliateCode: 'AGN001' },
            { id: agenBId, email: 'agen.usman@gmail.com', name: 'Usman Hakim', password: hp, role: 'agen', phone: '08133000002', parentId: cabangSbyId, affiliateCode: 'AGN002' },
            { id: resellerId, email: 'reseller.ayu@gmail.com', name: 'Ayu Lestari', password: hp, role: 'reseller', phone: '08155000001', parentId: agenAId, affiliateCode: 'RSL001' },
            { id: teknisiId, email: 'teknisi@almadinah.co.id', name: 'Budi Teknisi', password: hp, role: 'teknisi', phone: '08166000001' },
        ]);

        // Hierarchy paths (self + upline chains)
        await db.insert(s.hierarchyPaths).values([
            { ancestorId: pusatId, descendantId: pusatId, pathLength: 0 },
            { ancestorId: cabangJktId, descendantId: cabangJktId, pathLength: 0 },
            { ancestorId: cabangSbyId, descendantId: cabangSbyId, pathLength: 0 },
            { ancestorId: mitraId, descendantId: mitraId, pathLength: 0 },
            { ancestorId: agenAId, descendantId: agenAId, pathLength: 0 },
            { ancestorId: agenBId, descendantId: agenBId, pathLength: 0 },
            { ancestorId: resellerId, descendantId: resellerId, pathLength: 0 },
            // Chains
            { ancestorId: pusatId, descendantId: cabangJktId, pathLength: 1 },
            { ancestorId: pusatId, descendantId: cabangSbyId, pathLength: 1 },
            { ancestorId: cabangJktId, descendantId: mitraId, pathLength: 1 },
            { ancestorId: pusatId, descendantId: mitraId, pathLength: 2 },
            { ancestorId: mitraId, descendantId: agenAId, pathLength: 1 },
            { ancestorId: cabangJktId, descendantId: agenAId, pathLength: 2 },
            { ancestorId: pusatId, descendantId: agenAId, pathLength: 3 },
            { ancestorId: cabangSbyId, descendantId: agenBId, pathLength: 1 },
            { ancestorId: pusatId, descendantId: agenBId, pathLength: 2 },
            { ancestorId: agenAId, descendantId: resellerId, pathLength: 1 },
            { ancestorId: mitraId, descendantId: resellerId, pathLength: 2 },
            { ancestorId: cabangJktId, descendantId: resellerId, pathLength: 3 },
            { ancestorId: pusatId, descendantId: resellerId, pathLength: 4 },
        ]);

        // ============ STEP 2: MASTER DATA ============

        // Hotels
        const hotelIds = {
            mkPullman: 'hotel-mk-pullman',
            mkHilton: 'hotel-mk-hilton',
            mkSwissotel: 'hotel-mk-swissotel',
            mdOberoi: 'hotel-md-oberoi',
            mdAnwar: 'hotel-md-anwar',
            mdPullman: 'hotel-md-pullman',
        };
        await db.insert(s.hotels).values([
            { id: hotelIds.mkPullman, name: 'Pullman ZamZam Makkah', city: 'Makkah', starRating: 5, distanceToHaram: '50m ke Masjidil Haram', image: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=400&q=80' },
            { id: hotelIds.mkHilton, name: 'Hilton Suites Makkah', city: 'Makkah', starRating: 5, distanceToHaram: '200m ke Masjidil Haram', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80' },
            { id: hotelIds.mkSwissotel, name: 'Swissôtel Al Maqam', city: 'Makkah', starRating: 4, distanceToHaram: '300m ke Masjidil Haram', image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&q=80' },
            { id: hotelIds.mdOberoi, name: 'The Oberoi Madinah', city: 'Madinah', starRating: 5, distanceToHaram: '100m ke Masjid Nabawi', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80' },
            { id: hotelIds.mdAnwar, name: 'Anwar Al Madinah Mövenpick', city: 'Madinah', starRating: 4, distanceToHaram: '200m ke Masjid Nabawi', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80' },
            { id: hotelIds.mdPullman, name: 'Pullman Madinah', city: 'Madinah', starRating: 4, distanceToHaram: '500m ke Masjid Nabawi', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80' },
        ]);

        // Airlines
        const airlineIds = { sv: 'airline-sv', ga: 'airline-ga', ey: 'airline-ey' };
        await db.insert(s.airlines).values([
            { id: airlineIds.sv, name: 'Saudi Airlines (Saudia)', code: 'SV' },
            { id: airlineIds.ga, name: 'Garuda Indonesia', code: 'GA' },
            { id: airlineIds.ey, name: 'Etihad Airways', code: 'EY' },
        ]);

        // Airports
        const airportIds = { cgk: 'apt-cgk', sub: 'apt-sub', jed: 'apt-jed', med: 'apt-med' };
        await db.insert(s.airports).values([
            { id: airportIds.cgk, name: 'Soekarno-Hatta International', code: 'CGK', city: 'Jakarta' },
            { id: airportIds.sub, name: 'Juanda International', code: 'SUB', city: 'Surabaya' },
            { id: airportIds.jed, name: 'King Abdulaziz International', code: 'JED', city: 'Jeddah' },
            { id: airportIds.med, name: 'Prince Mohammad bin Abdulaziz', code: 'MED', city: 'Madinah' },
        ]);

        // Package Types
        const ptIds = { reg: 'pt-reguler', plus: 'pt-plus', vip: 'pt-vip', haji: 'pt-haji' };
        await db.insert(s.packageTypes).values([
            { id: ptIds.reg, name: 'Umroh Reguler', description: 'Paket umroh standar 9-12 hari' },
            { id: ptIds.plus, name: 'Umroh Plus', description: 'Umroh + wisata Turki/Dubai/Mesir' },
            { id: ptIds.vip, name: 'Umroh VIP', description: 'Paket premium hotel bintang 5, pesawat bisnis' },
            { id: ptIds.haji, name: 'Haji Khusus', description: 'Program haji khusus non-kuota reguler' },
        ]);

        // Equipment Items
        const equipIds = ['eq-1', 'eq-2', 'eq-3', 'eq-4', 'eq-5', 'eq-6', 'eq-7'];
        await db.insert(s.equipmentItems).values([
            { id: 'eq-1', name: 'Koper Cabin 20"', description: 'Koper kabin ukuran 20 inch warna hitam' },
            { id: 'eq-2', name: 'Koper Bagasi 28"', description: 'Koper bagasi besar 28 inch' },
            { id: 'eq-3', name: 'Tas Sandal & Ibadah', description: 'Tas kecil untuk perlengkapan ibadah' },
            { id: 'eq-4', name: 'Buku Manasik', description: 'Panduan lengkap manasik haji/umroh' },
            { id: 'eq-5', name: 'Seragam Batik', description: 'Batik seragam Al Madinah' },
            { id: 'eq-6', name: 'ID Card & Lanyard', description: 'Kartu identitas jamaah + tali lanyard' },
            { id: 'eq-7', name: 'Travel Pouch', description: 'Pouch dokumen perjalanan' },
        ]);

        // Bank Accounts
        await db.insert(s.bankAccounts).values([
            { id: 'bank-1', bankName: 'Bank Central Asia (BCA)', accountNumber: '6780123456', accountHolder: 'PT Al Madinah Tour & Travel' },
            { id: 'bank-2', bankName: 'Bank Syariah Indonesia (BSI)', accountNumber: '7012345678', accountHolder: 'PT Al Madinah Tour & Travel' },
            { id: 'bank-3', bankName: 'Bank Mandiri', accountNumber: '1280001234567', accountHolder: 'PT Al Madinah Tour & Travel' },
        ]);

        // ============ STEP 3: PACKAGES ============
        const pkgIds = { premium: 'pkg-premium', ekonomi: 'pkg-ekonomi', plusTurki: 'pkg-plus-turki', hajiKhusus: 'pkg-haji', ramadhan: 'pkg-ramadhan' };

        await db.insert(s.packages).values([
            {
                id: pkgIds.premium,
                name: 'Umroh Premium 12 Hari',
                slug: 'umroh-premium-12h',
                description: 'Paket premium dengan hotel bintang 5 tepat di depan Masjidil Haram. Termasuk city tour, makan 3x sehari, dan muthowif berpengalaman.',
                basePrice: 45000000,
                packageType: 'Umroh VIP',
                starRating: 5,
                image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80',
                images: JSON.stringify([
                    'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600&q=80',
                    'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=600&q=80',
                    'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=600&q=80',
                ]),
                makkahHotelId: hotelIds.mkPullman,
                madinahHotelId: hotelIds.mdOberoi,
                duration: '12 Hari 11 Malam',
                facilities: 'Pesawat Garuda Indonesia,Hotel Bintang 5,Makan 3x Sehari,City Tour Makkah & Madinah,Muthowif Berpengalaman,Handling Bandara,Visa Umroh,Asuransi Perjalanan',
                isPromo: true,
                promoText: 'Early Bird! Diskon Rp 5 Juta untuk pendaftaran sebelum April 2026',
                currency: 'IDR',
                dpAmount: 10000000,
                equipmentIds: JSON.stringify(equipIds),
            },
            {
                id: pkgIds.ekonomi,
                name: 'Umroh Ekonomi 9 Hari',
                slug: 'umroh-ekonomi-9h',
                description: 'Paket umroh terjangkau dengan kualitas terbaik. Hotel bintang 4, dekat Haram, cocok untuk jamaah pertama kali.',
                basePrice: 28000000,
                packageType: 'Umroh Reguler',
                starRating: 4,
                image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80',
                images: JSON.stringify([
                    'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&q=80',
                    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&q=80',
                ]),
                makkahHotelId: hotelIds.mkSwissotel,
                madinahHotelId: hotelIds.mdAnwar,
                duration: '9 Hari 8 Malam',
                facilities: 'Pesawat Saudi Airlines,Hotel Bintang 4,Makan 3x Sehari,Muthowif,Handling Bandara,Visa Umroh,Asuransi',
                currency: 'IDR',
                dpAmount: 5000000,
                equipmentIds: JSON.stringify(['eq-1', 'eq-3', 'eq-4', 'eq-6']),
            },
            {
                id: pkgIds.plusTurki,
                name: 'Umroh Plus Turki 15 Hari',
                slug: 'umroh-plus-turki-15h',
                description: 'Ibadah umroh dilanjutkan wisata Istanbul, Cappadocia, dan Pamukkale. Pengalaman spiritual sekaligus wisata bersejarah.',
                basePrice: 55000000,
                packageType: 'Umroh Plus',
                starRating: 5,
                image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80',
                images: JSON.stringify([
                    'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&q=80',
                    'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
                    'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600&q=80',
                ]),
                makkahHotelId: hotelIds.mkHilton,
                madinahHotelId: hotelIds.mdPullman,
                duration: '15 Hari 14 Malam',
                facilities: 'Pesawat Etihad Airways,Hotel Bintang 5,Full Board Meals,City Tour Makkah-Madinah-Istanbul-Cappadocia,Guide Lokal Turki,Visa Umroh + Turki,Asuransi',
                isPromo: false,
                currency: 'IDR',
                dpAmount: 15000000,
            },
            {
                id: pkgIds.hajiKhusus,
                name: 'Haji Khusus 2026',
                slug: 'haji-khusus-2026',
                description: 'Program haji khusus tanpa antrian panjang. Berangkat tahun ini dengan fasilitas VIP dan bimbingan ustadz.',
                basePrice: 9800,
                packageType: 'Haji Khusus',
                starRating: 5,
                image: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?w=800&q=80',
                images: JSON.stringify([
                    'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?w=600&q=80',
                ]),
                makkahHotelId: hotelIds.mkPullman,
                madinahHotelId: hotelIds.mdOberoi,
                duration: '26 Hari',
                facilities: 'Pesawat Garuda Indonesia,Hotel Bintang 5 dekat Haram,Full Board Meals,Bimbingan Ustadz,Perlengkapan Haji Lengkap,Asuransi,Visa Haji',
                currency: 'USD',
                dpAmount: 3000,
            },
            {
                id: pkgIds.ramadhan,
                name: 'Umroh Ramadhan 2026',
                slug: 'umroh-ramadhan-2026',
                description: 'Spesial ibadah di bulan suci Ramadhan. Rasakan kekhusyukan beribadah di Masjidil Haram saat bulan penuh berkah.',
                basePrice: 38000000,
                packageType: 'Umroh Reguler',
                starRating: 4,
                image: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=800&q=80',
                images: JSON.stringify([
                    'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?w=600&q=80',
                ]),
                makkahHotelId: hotelIds.mkHilton,
                madinahHotelId: hotelIds.mdAnwar,
                duration: '12 Hari',
                facilities: 'Pesawat Saudi Airlines,Hotel Bintang 4-5,Makan Sahur & Buka,Muthowif,Visa,Asuransi',
                isPromo: true,
                promoText: 'LAST SEAT! Tersisa 8 kursi untuk Ramadhan 2026',
                currency: 'IDR',
                dpAmount: 8000000,
            },
        ]);

        // ============ STEP 4: DEPARTURES & ROOM TYPES ============
        const depData = [
            { id: 'dep-001', pkgId: pkgIds.premium, trip: 'Premium Group A - Oktober', date: '2026-10-15', airline: airlineIds.ga, apt: airportIds.cgk, seats: 45, booked: 32 },
            { id: 'dep-002', pkgId: pkgIds.premium, trip: 'Premium Group B - November', date: '2026-11-20', airline: airlineIds.ga, apt: airportIds.sub, seats: 45, booked: 12 },
            { id: 'dep-003', pkgId: pkgIds.ekonomi, trip: 'Ekonomi Group A - September', date: '2026-09-05', airline: airlineIds.sv, apt: airportIds.cgk, seats: 45, booked: 40 },
            { id: 'dep-004', pkgId: pkgIds.plusTurki, trip: 'Plus Turki - Oktober', date: '2026-10-01', airline: airlineIds.ey, apt: airportIds.cgk, seats: 30, booked: 18 },
            { id: 'dep-005', pkgId: pkgIds.ramadhan, trip: 'Ramadhan 10 Hari Terakhir', date: '2026-03-10', airline: airlineIds.sv, apt: airportIds.cgk, seats: 45, booked: 37 },
            { id: 'dep-006', pkgId: pkgIds.hajiKhusus, trip: 'Haji Khusus 2026', date: '2026-06-01', airline: airlineIds.ga, apt: airportIds.cgk, seats: 40, booked: 25 },
        ];

        for (const d of depData) {
            await db.insert(s.departures).values({
                id: d.id, packageId: d.pkgId, tripName: d.trip, departureDate: d.date,
                departureAirlineId: d.airline, departureAirportId: d.apt,
                airport: d.apt === airportIds.cgk ? 'CGK' : 'SUB',
                totalSeats: d.seats, bookedSeats: d.booked,
                status: d.booked >= d.seats ? 'full' : d.booked > d.seats * 0.8 ? 'last_call' : 'available',
            });

            // Room types for each departure
            await db.insert(s.roomTypes).values([
                { id: `rt-${d.id}-quad`, departureId: d.id, name: 'Quad (4 Orang)', capacity: 4, priceAdjustment: 0 },
                { id: `rt-${d.id}-triple`, departureId: d.id, name: 'Triple (3 Orang)', capacity: 3, priceAdjustment: 2000000 },
                { id: `rt-${d.id}-double`, departureId: d.id, name: 'Double (2 Orang)', capacity: 2, priceAdjustment: 5000000 },
            ]);
        }

        // ============ STEP 5: PILGRIMS & BOOKINGS ============
        const pilgrimData = [
            { id: 'pil-001', name: 'Ahmad Hidayatullah', ktp: '3201120501850001', sex: 'L', born: '1985-01-05', addr: 'Jl. Mawar No. 12, Bogor', father: 'H. Abdullah', status: 'Menikah', phone: '081234567001', work: 'Pengusaha' },
            { id: 'pil-002', name: 'Siti Nurhaliza', ktp: '3201120801900002', sex: 'P', born: '1990-08-01', addr: 'Jl. Melati No. 5, Depok', father: 'H. Sulaiman', status: 'Menikah', phone: '081234567002', work: 'Guru' },
            { id: 'pil-003', name: 'Muhammad Faisal', ktp: '3201121203780003', sex: 'L', born: '1978-03-12', addr: 'Jl. Kenanga RT 05/03, Bekasi', father: 'Ismail', status: 'Menikah', phone: '081234567003', work: 'PNS' },
            { id: 'pil-004', name: 'Rahmawati Putri', ktp: '3201122506950004', sex: 'P', born: '1995-06-25', addr: 'Perumahan Griya Indah Blok C-7', father: 'Drs. Hasan', status: 'Belum Menikah', phone: '081234567004', work: 'Dokter' },
            { id: 'pil-005', name: 'H. Bambang Suryadi', ktp: '3201120107700005', sex: 'L', born: '1970-07-01', addr: 'Jl. Raya Cibubur No. 88', father: 'Surya', status: 'Menikah', phone: '081234567005', work: 'Pensiunan' },
            { id: 'pil-006', name: 'Hj. Aminah Sari', ktp: '3201121512680006', sex: 'P', born: '1968-12-15', addr: 'Jl. Flamboyan No. 3, Tangerang', father: 'Abdul Karim', status: 'Menikah', phone: '081234567006', work: 'Ibu Rumah Tangga' },
            { id: 'pil-007', name: 'Irfan Maulana', ktp: '3201120209880007', sex: 'L', born: '1988-09-02', addr: 'Apt. Green Bay Tower H Lt.15', father: 'Maulana', status: 'Menikah', phone: '081234567007', work: 'Software Engineer' },
            { id: 'pil-008', name: 'Dewi Safitri', ktp: '3201121811920008', sex: 'P', born: '1992-11-18', addr: 'Jl. Pahlawan No. 45, Surabaya', father: 'Syarif', status: 'Menikah', phone: '081234567008', work: 'Apoteker' },
        ];

        for (const p of pilgrimData) {
            await db.insert(s.pilgrims).values({
                id: p.id, name: p.name, noKtp: p.ktp, sex: p.sex as any, born: p.born,
                address: p.addr, fatherName: p.father, maritalStatus: p.status as any,
                phone: p.phone, lastEducation: 'S1', work: p.work,
                famContactName: 'Keluarga ' + p.name.split(' ')[0],
                famContact: '0856' + p.phone.slice(-7),
                sourceFrom: ['Instagram', 'Referensi Teman', 'Website', 'Brosur', 'WhatsApp'][Math.floor(Math.random() * 5)],
            });
        }

        // Bookings with various statuses
        const bookingData = [
            { id: 'bk-001', depId: 'dep-001', pilId: 'pil-001', roomId: 'rt-dep-001-double', affId: agenAId, price: 50000000, payStatus: 'paid', bookStatus: 'confirmed' },
            { id: 'bk-002', depId: 'dep-001', pilId: 'pil-002', roomId: 'rt-dep-001-quad', affId: agenAId, price: 45000000, payStatus: 'partial', bookStatus: 'confirmed' },
            { id: 'bk-003', depId: 'dep-003', pilId: 'pil-003', roomId: 'rt-dep-003-triple', affId: agenBId, price: 30000000, payStatus: 'paid', bookStatus: 'confirmed' },
            { id: 'bk-004', depId: 'dep-003', pilId: 'pil-004', roomId: 'rt-dep-003-quad', affId: resellerId, price: 28000000, payStatus: 'unpaid', bookStatus: 'pending' },
            { id: 'bk-005', depId: 'dep-004', pilId: 'pil-005', roomId: 'rt-dep-004-double', affId: agenAId, price: 60000000, payStatus: 'partial', bookStatus: 'confirmed' },
            { id: 'bk-006', depId: 'dep-005', pilId: 'pil-006', roomId: 'rt-dep-005-triple', affId: agenBId, price: 40000000, payStatus: 'paid', bookStatus: 'confirmed' },
            { id: 'bk-007', depId: 'dep-001', pilId: 'pil-007', roomId: 'rt-dep-001-triple', affId: agenAId, price: 47000000, payStatus: 'unpaid', bookStatus: 'pending' },
            { id: 'bk-008', depId: 'dep-006', pilId: 'pil-008', roomId: 'rt-dep-006-quad', affId: agenBId, price: 9800, payStatus: 'partial', bookStatus: 'ready_review' },
        ];

        for (const b of bookingData) {
            await db.insert(s.bookings).values({
                id: b.id, departureId: b.depId, pilgrimId: b.pilId, roomTypeId: b.roomId,
                affiliatorId: b.affId, totalPrice: b.price,
                paymentStatus: b.payStatus as any, bookingStatus: b.bookStatus as any,
            });
        }

        // ============ STEP 6: INVOICES ============
        const invoiceData = [
            { id: 'inv-001', bookId: 'bk-001', code: 'BK-20260101-001-DP', type: 'dp', amount: 10000000, status: 'paid', paidAt: '2026-01-15' },
            { id: 'inv-002', bookId: 'bk-001', code: 'BK-20260101-001-F', type: 'final', amount: 40000000, status: 'paid', paidAt: '2026-08-01' },
            { id: 'inv-003', bookId: 'bk-002', code: 'BK-20260102-002-DP', type: 'dp', amount: 10000000, status: 'paid', paidAt: '2026-02-01' },
            { id: 'inv-004', bookId: 'bk-002', code: 'BK-20260102-002-I1', type: 'installment', amount: 15000000, status: 'unpaid', paidAt: null },
            { id: 'inv-005', bookId: 'bk-003', code: 'BK-20260103-003-FULL', type: 'full', amount: 30000000, status: 'paid', paidAt: '2026-03-10' },
            { id: 'inv-006', bookId: 'bk-005', code: 'BK-20260105-005-DP', type: 'dp', amount: 15000000, status: 'paid', paidAt: '2026-04-01' },
            { id: 'inv-007', bookId: 'bk-006', code: 'BK-20260106-006-FULL', type: 'full', amount: 40000000, status: 'paid', paidAt: '2026-01-20' },
        ];

        for (const inv of invoiceData) {
            await db.insert(s.paymentInvoices).values({
                id: inv.id, bookingId: inv.bookId, invoiceCode: inv.code,
                invoiceType: inv.type as any, amount: inv.amount,
                status: inv.status as any, paymentMode: 'manual',
                paidAt: inv.paidAt,
            });
        }

        // ============ STEP 7: TESTIMONIALS ============
        const testiData = [
            { id: 'testi-1', pilgrimName: 'H. Ahmad Hidayatullah', departureInfo: 'Umroh Premium - Oktober 2025', content: 'Alhamdulillah, pelayanan sangat memuaskan. Hotel tepat di depan Masjidil Haram, muthowif sabar dan sangat membantu. Insya Allah akan berangkat lagi tahun depan bersama keluarga besar.', rating: 5, isPublished: true, photoR2Key: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' },
            { id: 'testi-2', pilgrimName: 'Hj. Siti Nurhaliza', departureInfo: 'Umroh Ramadhan 2025', content: 'Subhanallah, beribadah di bulan Ramadhan di depan Kabah adalah pengalaman yang tak terlupakan. Tim Al Madinah sangat profesional, semua kebutuhan jamaah terpenuhi dengan baik.', rating: 5, isPublished: true, photoR2Key: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' },
            { id: 'testi-3', pilgrimName: 'Irfan dan Dewi Safitri', departureInfo: 'Umroh Plus Turki - Maret 2025', content: 'Perjalanan umroh plus Turki benar-benar luar biasa. Dari ibadah di Tanah Suci hingga menikmati keindahan Istanbul dan Cappadocia. Paket sangat worth it!', rating: 5, isPublished: true, photoR2Key: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80' },
            { id: 'testi-4', pilgrimName: 'H. Bambang Suryadi', departureInfo: 'Umroh Ekonomi - Januari 2025', content: 'Walaupun paket ekonomi, kualitas pelayanannya tetap prima. Hotel dekat Haram, makanan enak, dan guide sangat informatif. Recommended!', rating: 4, isPublished: true, photoR2Key: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80' },
        ];
        for (const t of testiData) {
            await db.insert(s.testimonials).values(t);
        }

        // ============ STEP 8: COMMISSION RULES ============
        await db.insert(s.commissionRules).values([
            { id: 'cr-1', userId: pusatId, targetRole: 'cabang', commissionType: 'flat', commissionValue: 2000000 },
            { id: 'cr-2', userId: pusatId, targetRole: 'mitra', commissionType: 'flat', commissionValue: 1500000 },
            { id: 'cr-3', userId: pusatId, targetRole: 'agen', commissionType: 'flat', commissionValue: 1000000 },
            { id: 'cr-4', userId: pusatId, targetRole: 'reseller', commissionType: 'flat', commissionValue: 500000 },
        ]);

        // Commission Ledger
        await db.insert(s.commissionLedger).values([
            { id: 'cl-1', bookingId: 'bk-001', userId: agenAId, role: 'agen', amount: 1000000, commissionType: 'flat', status: 'paid', paidAt: '2026-02-01' },
            { id: 'cl-2', bookingId: 'bk-001', userId: mitraId, role: 'mitra', amount: 1500000, commissionType: 'flat', status: 'paid', paidAt: '2026-02-01' },
            { id: 'cl-3', bookingId: 'bk-001', userId: cabangJktId, role: 'cabang', amount: 2000000, commissionType: 'flat', status: 'pending' },
            { id: 'cl-4', bookingId: 'bk-003', userId: agenBId, role: 'agen', amount: 1000000, commissionType: 'flat', status: 'pending' },
            { id: 'cl-5', bookingId: 'bk-005', userId: agenAId, role: 'agen', amount: 1000000, commissionType: 'flat', status: 'pending' },
        ]);

        // ============ STEP 9: PROSPECTS ============
        await db.insert(s.prospects).values([
            { id: 'prsp-1', ownerId: agenAId, fullName: 'Yusuf Habibi', phone: '081299990001', address: 'Jl. Sudirman No. 10, Jakarta', notes: 'Tertarik paket premium, budget sekitar 50jt', source: 'Instagram', status: 'interested', followUpDate: '2026-03-01' },
            { id: 'prsp-2', ownerId: agenAId, fullName: 'Kartini Wulandari', phone: '081299990002', address: 'BSD City, Tangerang', notes: 'Ingin berangkat bersama suami, tanya soal cicilan', source: 'Referral', status: 'contacted', followUpDate: '2026-03-05' },
            { id: 'prsp-3', ownerId: agenBId, fullName: 'Ir. Surya Darmawan', phone: '081299990003', address: 'Jl. Raya Darmo, Surabaya', notes: 'Pengusaha, tertarik Haji Khusus', source: 'WhatsApp', status: 'new' },
            { id: 'prsp-4', ownerId: resellerId, fullName: 'Nurul Hidayah', phone: '081299990004', address: 'Jl. Ahmad Yani, Bandung', notes: 'Ibu rumah tangga, tanya paket ekonomi', source: 'Facebook', status: 'contacted' },
        ]);

        // ============ STEP 10: SALES TARGETS ============
        await db.insert(s.salesTargets).values([
            { id: 'st-1', userId: cabangJktId, month: 2, year: 2026, targetPax: 20, setBy: pusatId },
            { id: 'st-2', userId: cabangSbyId, month: 2, year: 2026, targetPax: 15, setBy: pusatId },
            { id: 'st-3', userId: agenAId, month: 2, year: 2026, targetPax: 8, setBy: cabangJktId },
            { id: 'st-4', userId: agenBId, month: 2, year: 2026, targetPax: 6, setBy: cabangSbyId },
        ]);

        // ============ STEP 11: AUDIT LOG ============
        await db.insert(s.auditLog).values([
            { id: 'audit-1', userId: pusatId, action: 'create_package', targetType: 'package', targetId: pkgIds.premium, details: 'Paket Umroh Premium 12 Hari dibuat' },
            { id: 'audit-2', userId: agenAId, action: 'create_booking', targetType: 'booking', targetId: 'bk-001', details: 'Booking baru untuk Ahmad Hidayatullah - Premium Group A' },
            { id: 'audit-3', userId: pusatId, action: 'verify_payment', targetType: 'invoice', targetId: 'inv-001', details: 'Pembayaran DP Rp 10.000.000 diverifikasi' },
            { id: 'audit-4', userId: agenBId, action: 'create_booking', targetType: 'booking', targetId: 'bk-003', details: 'Booking baru untuk Muhammad Faisal - Ekonomi Group A' },
            { id: 'audit-5', userId: pusatId, action: 'update_departure', targetType: 'departure', targetId: 'dep-005', details: 'Status Ramadhan diubah ke last_call' },
        ]);

        return c.json({
            success: true,
            message: 'Full seed completed! All data cleared and populated.',
            credentials: {
                pusat: 'admin@almadinah.co.id / password123',
                cabangJkt: 'jakarta@almadinah.co.id / password123',
                cabangSby: 'surabaya@almadinah.co.id / password123',
                mitra: 'mitra.ahmad@gmail.com / password123',
                agenA: 'agen.fatimah@gmail.com / password123',
                agenB: 'agen.usman@gmail.com / password123',
                reseller: 'reseller.ayu@gmail.com / password123',
                teknisi: 'teknisi@almadinah.co.id / password123',
            },
            summary: {
                users: 8,
                hotels: 6,
                airlines: 3,
                airports: 4,
                packages: 5,
                departures: 6,
                pilgrims: 8,
                bookings: 8,
                invoices: 7,
                testimonials: 4,
                prospects: 4,
                bankAccounts: 3,
                equipmentItems: 7,
            }
        });
    } catch (err: any) {
        return c.json({ success: false, error: err.message, stack: err.stack }, 500);
    }
});

export default app;


