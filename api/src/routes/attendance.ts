import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { getDb } from '../db/index.js';
import * as s from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { Env } from '../index.js';

const attendanceRouter = new Hono<{
    Bindings: Env;
    Variables: {
        user: { id: string; email: string; role: string };
    };
}>();

attendanceRouter.use('*', authMiddleware);

// Helper: Auto create tables if not exists on D1
async function autoCreateAttendanceTables(d1: D1Database) {
    try {
        await d1.prepare(`
            CREATE TABLE IF NOT EXISTS attendance_locations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                radius_meters INTEGER NOT NULL DEFAULT 150,
                address TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        await d1.prepare(`
            CREATE TABLE IF NOT EXISTS attendances (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                location_id TEXT,
                type TEXT NOT NULL DEFAULT 'office',
                date TEXT NOT NULL,
                check_in_at TEXT NOT NULL,
                check_in_lat REAL,
                check_in_lng REAL,
                check_in_address TEXT,
                check_in_photo_url TEXT,
                check_in_notes TEXT,
                is_on_time INTEGER DEFAULT 1,
                check_out_at TEXT,
                check_out_lat REAL,
                check_out_lng REAL,
                check_out_address TEXT,
                check_out_notes TEXT,
                duration_minutes INTEGER DEFAULT 0,
                status TEXT DEFAULT 'present',
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        await d1.prepare(`
            CREATE TABLE IF NOT EXISTS sales_field_visits (
                id TEXT PRIMARY KEY,
                attendance_id TEXT,
                user_id TEXT NOT NULL,
                prospect_id TEXT,
                client_name TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                address TEXT,
                purpose TEXT NOT NULL,
                notes TEXT,
                photo_url TEXT,
                visited_at TEXT DEFAULT (datetime('now')),
                created_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        // Seed default Kantor Pusat if empty
        const locCount = await d1.prepare(`SELECT COUNT(*) as count FROM attendance_locations`).first<{ count: number }>();
        if (!locCount || locCount.count === 0) {
            await d1.prepare(`
                INSERT INTO attendance_locations (id, name, latitude, longitude, radius_meters, address)
                VALUES 
                ('loc-pusat', 'Kantor Pusat Al Madinah', -6.2088, 106.8456, 200, 'Jakarta Selatan'),
                ('loc-sby', 'Kantor Cabang Surabaya', -7.2575, 112.7521, 200, 'Surabaya Pusat')
            `).run();
        }
    } catch (e) {
        console.error('Error auto-creating attendance tables:', e);
    }
}

// Helper: Haversine distance in meters
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

// Helper: Get WIB date string (YYYY-MM-DD)
function getWibDate(date = new Date()) {
    const wib = new Date(date.getTime() + 7 * 3600 * 1000);
    return wib.toISOString().split('T')[0];
}

// ==========================================
// USER ATTENDANCE ENDPOINTS
// ==========================================

// GET /api/attendance/today - Get current user's today attendance status & field visits
attendanceRouter.get('/today', async (c) => {
    const authUser = c.get('user');
    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);
    const today = getWibDate();

    const todayRecord = await db.query.attendances.findFirst({
        where: and(eq(s.attendances.userId, authUser.id), eq(s.attendances.date, today)),
        with: {
            location: true,
            fieldVisits: true
        }
    });

    const userProfile = await db.query.users.findFirst({
        where: eq(s.users.id, authUser.id)
    });

    const locationsList = await db.query.attendanceLocations.findMany({
        where: eq(s.attendanceLocations.isActive, true)
    });

    return c.json({
        today,
        attendance: todayRecord || null,
        user: userProfile ? {
            id: userProfile.id,
            name: userProfile.name,
            role: userProfile.role,
            canFieldAttendance: !!userProfile.canFieldAttendance || ['agen', 'reseller', 'mitra'].includes(userProfile.role)
        } : null,
        locations: locationsList
    });
});

// GET /api/attendance/my-history - User's monthly attendance history
attendanceRouter.get('/my-history', async (c) => {
    const authUser = c.get('user');
    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);

    const monthParam = c.req.query('month') || getWibDate().substring(0, 7); // '2026-08'

    const logs = await db.query.attendances.findMany({
        where: and(
            eq(s.attendances.userId, authUser.id),
            sql`${s.attendances.date} LIKE ${monthParam + '%'}`
        ),
        with: {
            location: true,
            fieldVisits: true
        },
        orderBy: [desc(s.attendances.date)]
    });

    return c.json({
        month: monthParam,
        logs
    });
});

// POST /api/attendance/check-in - Clock In
attendanceRouter.post('/check-in', async (c) => {
    const authUser = c.get('user');
    const { latitude, longitude, photo_url, notes, address } = await c.req.json();
    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);
    const today = getWibDate();
    const now = new Date();

    // Check if already checked in today
    const existing = await db.query.attendances.findFirst({
        where: and(eq(s.attendances.userId, authUser.id), eq(s.attendances.date, today))
    });

    if (existing) {
        return c.json({ error: 'Anda sudah melakukan absensi masuk hari ini!' }, 400);
    }

    // Geofencing verification based on user's canFieldAttendance permission
    const userProfile = await db.query.users.findFirst({
        where: eq(s.users.id, authUser.id)
    });
    const canField = !!userProfile?.canFieldAttendance || ['agen', 'reseller', 'mitra'].includes(authUser.role);

    let isWithinRange = false;
    let assignedLocationId: string | null = null;
    let closestDistance: number | null = null;
    let closestRadius = 150;
    const finalType = canField ? 'field' : 'office';

    if (canField) {
        // Sales & authorized field staff can check-in anywhere
        isWithinRange = true;
    } else {
        // Office staff verification against active office geofences
        const activeLocations = await db.query.attendanceLocations.findMany({
            where: eq(s.attendanceLocations.isActive, true)
        });

        if (activeLocations.length === 0) {
            isWithinRange = true;
        } else if (typeof latitude === 'number' && typeof longitude === 'number') {
            for (const loc of activeLocations) {
                const dist = getHaversineDistance(latitude, longitude, loc.latitude, loc.longitude);
                if (closestDistance === null || dist < closestDistance) {
                    closestDistance = dist;
                    closestRadius = loc.radiusMeters || 150;
                }
                if (dist <= (loc.radiusMeters || 150)) {
                    isWithinRange = true;
                    assignedLocationId = loc.id;
                    break;
                }
            }
        }
    }

    if (!isWithinRange) {
        return c.json({
            error: `Anda berada di luar area kantor! Jarak terdekat: ${closestDistance !== null ? closestDistance + ' meter (Maksimum ' + closestRadius + ' meter)' : 'Lokasi GPS tidak valid'}. Silakan mendekat ke area kantor atau hubungi Admin jika Anda bertugas di lapangan.`
        }, 400);
    }

    // On-Time evaluation (08:15 WIB deadline)
    const nowWib = new Date(now.getTime() + 7 * 3600 * 1000);
    const hoursWib = nowWib.getUTCHours();
    const minsWib = nowWib.getUTCMinutes();
    const timeInMins = hoursWib * 60 + minsWib;
    const isOnTime = timeInMins <= (8 * 60 + 15);

    const recordId = crypto.randomUUID();
    const newRecord = {
        id: recordId,
        userId: authUser.id,
        locationId: assignedLocationId,
        type: finalType,
        date: today,
        checkInAt: now.toISOString(),
        checkInLat: typeof latitude === 'number' ? latitude : null,
        checkInLng: typeof longitude === 'number' ? longitude : null,
        checkInAddress: address || (canField ? 'Tugas Lapangan / Sales' : 'Kantor'),
        checkInPhotoUrl: photo_url || null,
        checkInNotes: notes || null,
        isOnTime: isOnTime,
        status: isOnTime ? 'present' : 'late'
    };

    await db.insert(s.attendances).values(newRecord as any);

    return c.json({
        success: true,
        message: `Absen masuk berhasil! (${isOnTime ? 'Tepat Waktu' : 'Terlambat'})`,
        attendance: newRecord
    });
});

// POST /api/attendance/check-out - Clock Out
attendanceRouter.post('/check-out', async (c) => {
    const authUser = c.get('user');
    const { latitude, longitude, notes, address } = await c.req.json();
    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);
    const today = getWibDate();
    const now = new Date();

    const current = await db.query.attendances.findFirst({
        where: and(eq(s.attendances.userId, authUser.id), eq(s.attendances.date, today))
    });

    if (!current) {
        return c.json({ error: 'Belum ada data check-in hari ini!' }, 400);
    }

    if (current.checkOutAt) {
        return c.json({ error: 'Anda sudah melakukan absensi pulang hari ini!' }, 400);
    }

    const checkInMs = new Date(current.checkInAt).getTime();
    const checkOutMs = now.getTime();
    const durationMinutes = Math.max(0, Math.floor((checkOutMs - checkInMs) / 60000));

    await db.update(s.attendances).set({
        checkOutAt: now.toISOString(),
        checkOutLat: typeof latitude === 'number' ? latitude : null,
        checkOutLng: typeof longitude === 'number' ? longitude : null,
        checkOutAddress: address || null,
        checkOutNotes: notes || null,
        durationMinutes: durationMinutes,
        updatedAt: now.toISOString()
    }).where(eq(s.attendances.id, current.id));

    return c.json({
        success: true,
        message: 'Absen pulang berhasil dicatat!',
        durationMinutes
    });
});

// POST /api/attendance/field-visit - Log Sales Visit
attendanceRouter.post('/field-visit', async (c) => {
    const authUser = c.get('user');
    const { clientName, prospectId, latitude, longitude, address, purpose, notes, photoUrl } = await c.req.json();

    if (!clientName || !purpose) {
        return c.json({ error: 'Nama klien/prospek dan keperluan kunjungan wajib diisi' }, 400);
    }

    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);
    const today = getWibDate();
    const now = new Date();

    // Find or link with today's attendance record
    const todayAttendance = await db.query.attendances.findFirst({
        where: and(eq(s.attendances.userId, authUser.id), eq(s.attendances.date, today))
    });

    const visitId = crypto.randomUUID();
    const newVisit = {
        id: visitId,
        attendanceId: todayAttendance?.id || null,
        userId: authUser.id,
        prospectId: prospectId || null,
        clientName: clientName.trim(),
        latitude: typeof latitude === 'number' ? latitude : 0,
        longitude: typeof longitude === 'number' ? longitude : 0,
        address: address || null,
        purpose: purpose.trim(),
        notes: notes || null,
        photoUrl: photoUrl || null,
        visitedAt: now.toISOString(),
        createdAt: now.toISOString()
    };

    await db.insert(s.salesFieldVisits).values(newVisit as any);

    return c.json({
        success: true,
        message: 'Kunjungan sales berhasil dicatat!',
        visit: newVisit
    });
});

// ==========================================
// ADMIN & RECAP ENDPOINTS (Role: pusat, cabang)
// ==========================================

// GET /api/attendance/admin/today-recap - Today recap of all staff
attendanceRouter.get('/admin/today-recap', async (c) => {
    const authUser = c.get('user');
    if (!['pusat', 'cabang'].includes(authUser.role)) {
        return c.json({ error: 'Akses ditolak' }, 403);
    }

    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);
    const today = getWibDate();

    const allUsers = await db.query.users.findMany({
        where: eq(s.users.isActive, true),
        orderBy: [desc(s.users.createdAt)]
    });

    const todayAttendances = await db.query.attendances.findMany({
        where: eq(s.attendances.date, today),
        with: {
            location: true,
            fieldVisits: true
        }
    });

    const recapList = allUsers.map(user => {
        const att = todayAttendances.find(a => a.userId === user.id);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            },
            attendance: att || null
        };
    });

    return c.json({
        date: today,
        recap: recapList
    });
});

// GET /api/attendance/admin/monthly-recap - Monthly recap with filters
attendanceRouter.get('/admin/monthly-recap', async (c) => {
    const authUser = c.get('user');
    if (!['pusat', 'cabang'].includes(authUser.role)) {
        return c.json({ error: 'Akses ditolak' }, 403);
    }

    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);

    const monthParam = c.req.query('month') || getWibDate().substring(0, 7); // '2026-08'
    const roleFilter = c.req.query('role'); // optional

    const logs = await db.query.attendances.findMany({
        where: sql`${s.attendances.date} LIKE ${monthParam + '%'}`,
        with: {
            user: true,
            location: true,
            fieldVisits: true
        },
        orderBy: [desc(s.attendances.date), desc(s.attendances.checkInAt)]
    });

    let filtered = logs;
    if (roleFilter && roleFilter !== 'all') {
        filtered = logs.filter(l => l.user?.role === roleFilter);
    }

    return c.json({
        month: monthParam,
        logs: filtered
    });
});

// GET /api/attendance/admin/export-excel - Download Excel recap
attendanceRouter.get('/admin/export-excel', async (c) => {
    const authUser = c.get('user');
    if (!['pusat', 'cabang'].includes(authUser.role)) {
        return c.json({ error: 'Akses ditolak' }, 403);
    }

    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);
    const monthParam = c.req.query('month') || getWibDate().substring(0, 7);

    const logs = await db.query.attendances.findMany({
        where: sql`${s.attendances.date} LIKE ${monthParam + '%'}`,
        with: {
            user: true,
            location: true,
            fieldVisits: true
        },
        orderBy: [desc(s.attendances.date), desc(s.attendances.checkInAt)]
    });

    // Build Excel Workbook
    const dataRows = logs.map((log, idx) => {
        const checkInTime = log.checkInAt ? new Date(log.checkInAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
        const checkOutTime = log.checkOutAt ? new Date(log.checkOutAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-';
        const durationHours = log.durationMinutes ? (log.durationMinutes / 60).toFixed(1) + ' Jam' : '-';

        return {
            'No': idx + 1,
            'Tanggal': log.date,
            'Nama Karyawan / Sales': log.user?.name || '-',
            'Role': log.user?.role?.toUpperCase() || '-',
            'Tipe Absen': log.type === 'office' ? 'Kantor' : 'Lapangan / Sales',
            'Jam Masuk (WIB)': checkInTime,
            'Jam Pulang (WIB)': checkOutTime,
            'Durasi Kerja': durationHours,
            'Status Kehadiran': log.isOnTime ? 'Tepat Waktu' : 'Terlambat',
            'Lokasi / Alamat': log.checkInAddress || log.location?.name || '-',
            'Koordinat GPS': log.checkInLat && log.checkInLng ? `${log.checkInLat}, ${log.checkInLng}` : '-',
            'Catatan Masuk': log.checkInNotes || '-',
            'Catatan Pulang': log.checkOutNotes || '-',
            'Jumlah Kunjungan Sales': log.fieldVisits?.length || 0
        };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataRows);
    XLSX.utils.book_append_sheet(wb, ws, `Rekap Absensi ${monthParam}`);

    const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    return c.body(new Uint8Array(excelBuffer) as any, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_Absensi_${monthParam}.xlsx"`
    });
});

// ==========================================
// MASTER LOKASI GEOFENCE (Role: pusat)
// ==========================================

// GET /api/attendance/locations - List locations
attendanceRouter.get('/locations', async (c) => {
    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);
    const list = await db.query.attendanceLocations.findMany({
        orderBy: [desc(s.attendanceLocations.createdAt)]
    });
    return c.json(list);
});

// POST /api/attendance/locations - Create / Update location
attendanceRouter.post('/locations', async (c) => {
    const authUser = c.get('user');
    if (authUser.role !== 'pusat') {
        return c.json({ error: 'Hanya Admin Pusat yang dapat mengatur master lokasi' }, 403);
    }

    const { id, name, latitude, longitude, radiusMeters = 150, address, isActive = true } = await c.req.json();

    if (!name || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return c.json({ error: 'Nama lokasi dan koordinat Latitude/Longitude wajib diisi' }, 400);
    }

    await autoCreateAttendanceTables(c.env.DB);
    const db = getDb(c.env.DB);

    if (id) {
        // Update
        await db.update(s.attendanceLocations).set({
            name: name.trim(),
            latitude,
            longitude,
            radiusMeters: Number(radiusMeters),
            address: address || null,
            isActive: Boolean(isActive)
        }).where(eq(s.attendanceLocations.id, id));

        return c.json({ success: true, message: 'Lokasi berhasil diperbarui' });
    } else {
        // Create
        const newLoc = {
            id: crypto.randomUUID(),
            name: name.trim(),
            latitude,
            longitude,
            radiusMeters: Number(radiusMeters),
            address: address || null,
            isActive: Boolean(isActive)
        };
        await db.insert(s.attendanceLocations).values(newLoc as any);
        return c.json({ success: true, message: 'Lokasi berhasil ditambahkan', location: newLoc });
    }
});

// DELETE /api/attendance/locations/:id - Delete location
attendanceRouter.delete('/locations/:id', async (c) => {
    const authUser = c.get('user');
    if (authUser.role !== 'pusat') {
        return c.json({ error: 'Hanya Admin Pusat yang dapat menghapus master lokasi' }, 403);
    }

    const locId = c.req.param('id');
    const db = getDb(c.env.DB);

    await db.delete(s.attendanceLocations).where(eq(s.attendanceLocations.id, locId));
    return c.json({ success: true, message: 'Lokasi berhasil dihapus' });
});

export default attendanceRouter;
