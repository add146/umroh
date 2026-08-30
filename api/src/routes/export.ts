import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { bookings, pilgrims, departures, roomTypes, roomAssignments, packages } from '../db/schema.js';
import { ExportService } from '../services/export.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { logAction } from '../services/audit.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// 1. Export Siskopatuh (CSV)
api.get('/siskopatuh/:departureId', authMiddleware, requireRole('pusat'), async (c) => {
    const departureId = c.req.param('departureId');
    const db = getDb(c.env.DB);

    const data = await db.query.bookings.findMany({
        where: eq(bookings.departureId, departureId),
        with: {
            pilgrim: true
        }
    });

    const csv = await ExportService.generateSiskopatuhCSV(data);

    return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="siskopatuh_${departureId.substring(0, 8)}.csv"`
    });
});

// 2. Export Manifest (CSV - Simple)
api.get('/manifest/:departureId', authMiddleware, requireRole('pusat'), async (c) => {
    const departureId = c.req.param('departureId');
    const db = getDb(c.env.DB);

    const data = await db.query.bookings.findMany({
        where: eq(bookings.departureId, departureId),
        with: {
            pilgrim: true,
            roomType: true
        }
    });

    const csv = await ExportService.generateManifestCSV(data);

    return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="manifest_${departureId.substring(0, 8)}.csv"`
    });
});

// 3. Export Manifest Excel (4 Sheets: Manifest, Roomlist L, Roomlist P, Ringkasan)
api.get('/manifest-excel/:departureId', authMiddleware, requireRole('pusat'), async (c) => {
    const departureId = c.req.param('departureId');
    const db = getDb(c.env.DB);

    const departure = await db.query.departures.findFirst({
        where: eq(departures.id, departureId),
        with: { package: true }
    });

    const departureBookings = await db.query.bookings.findMany({
        where: eq(bookings.departureId, departureId),
        with: {
            pilgrim: true,
            roomType: true,
            roomAssignment: true
        }
    });

    const excelBuffer = ExportService.generateManifestExcel(departureBookings, departure);

    const dateStr = departure?.departureDate || 'manifest';
    const pkgName = (departure?.package?.name || 'umroh').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Manifest_${pkgName}_${dateStr}.xlsx`;

    return c.body(excelBuffer as any, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
    });
});

// 4. Export Roomlist Excel Only (2 Sheets: Laki-laki, Perempuan)
api.get('/roomlist-excel/:departureId', authMiddleware, requireRole('pusat'), async (c) => {
    const departureId = c.req.param('departureId');
    const db = getDb(c.env.DB);

    const departure = await db.query.departures.findFirst({
        where: eq(departures.id, departureId),
        with: { package: true }
    });

    const departureBookings = await db.query.bookings.findMany({
        where: eq(bookings.departureId, departureId),
        with: {
            pilgrim: true,
            roomType: true,
            roomAssignment: true
        }
    });

    const excelBuffer = ExportService.generateRoomlistExcel(departureBookings);

    const dateStr = departure?.departureDate || 'roomlist';
    const pkgName = (departure?.package?.name || 'umroh').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Roomlist_${pkgName}_${dateStr}.xlsx`;

    return c.body(excelBuffer as any, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
    });
});

// 5. Download Template Excel for Manifest Import
api.get('/manifest-template', authMiddleware, requireRole('pusat'), async (c) => {
    const excelBuffer = ExportService.generateTemplateExcel();
    return c.body(excelBuffer as any, 200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Template_Import_Manifest_Umroh.xlsx"'
    });
});

// 6. Import Manifest Excel for a Departure
api.post('/import-manifest/:departureId', authMiddleware, requireRole('pusat'), async (c) => {
    const departureId = c.req.param('departureId');
    const db = getDb(c.env.DB);
    const user = c.get('user');

    const departure = await db.query.departures.findFirst({
        where: eq(departures.id, departureId),
        with: {
            package: true,
            roomTypes: true
        }
    });

    if (!departure) {
        return c.json({ error: 'Data keberangkatan tidak ditemukan' }, 404);
    }

    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
        return c.json({ error: 'File Excel (.xlsx) wajib diunggah' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const { validRows, errors } = ExportService.parseManifestExcel(arrayBuffer);

    if (validRows.length === 0 && errors.length > 0) {
        return c.json({
            success: false,
            message: 'Tidak ada baris data valid yang dapat diproses',
            imported: 0,
            updated: 0,
            skipped: 0,
            errors
        }, 400);
    }

    // Default room type
    const defaultRoomType = departure.roomTypes?.[0];
    const basePrice = departure.package?.basePrice || 25000000;

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const processErrors: { row: number; field: string; message: string }[] = [...errors];

    for (const row of validRows) {
        try {
            // 1. Find matching room type for this departure
            let matchedRoomType = departure.roomTypes?.find(rt =>
                rt.name.toLowerCase().includes(row.roomTypeName.toLowerCase()) ||
                row.roomTypeName.toLowerCase().includes(rt.name.toLowerCase())
            );
            if (!matchedRoomType) {
                matchedRoomType = defaultRoomType;
            }

            // 2. Check if pilgrim already exists by NIK
            const [existingPilgrim] = await db.select().from(pilgrims).where(eq(pilgrims.noKtp, row.noKtp)).limit(1);

            let pilgrimId = '';

            if (existingPilgrim) {
                // Update pilgrim
                await db.update(pilgrims).set({
                    name: row.name,
                    sex: row.sex,
                    born: row.born,
                    address: row.address,
                    fatherName: row.fatherName,
                    phone: row.phone,
                    maritalStatus: row.maritalStatus,
                    work: row.work,
                    lastEducation: row.lastEducation,
                    hasPassport: row.hasPassport,
                    noPassport: row.noPassport,
                    passportFrom: row.passportFrom,
                    passportReleaseDate: row.passportReleaseDate,
                    passportExpiry: row.passportExpiry,
                }).where(eq(pilgrims.id, existingPilgrim.id));

                pilgrimId = existingPilgrim.id;

                // Check if booking exists for this departure
                const [existingBooking] = await db.select().from(bookings).where(
                    and(
                        eq(bookings.departureId, departureId),
                        eq(bookings.pilgrimId, pilgrimId)
                    )
                ).limit(1);

                if (existingBooking) {
                    // Update booking room type if specified
                    if (matchedRoomType && existingBooking.roomTypeId !== matchedRoomType.id) {
                        await db.update(bookings).set({
                            roomTypeId: matchedRoomType.id
                        }).where(eq(bookings.id, existingBooking.id));
                    }

                    // Assign room if specified in excel
                    if (row.roomNumber) {
                        const [existingAssign] = await db.select().from(roomAssignments).where(eq(roomAssignments.bookingId, existingBooking.id)).limit(1);
                        if (existingAssign) {
                            await db.update(roomAssignments).set({ roomNumber: row.roomNumber }).where(eq(roomAssignments.id, existingAssign.id));
                        } else {
                            await db.insert(roomAssignments).values({
                                bookingId: existingBooking.id,
                                roomNumber: row.roomNumber
                            });
                        }
                    }

                    updated++;
                } else {
                    // Create new booking for existing pilgrim
                    const totalPrice = basePrice + (matchedRoomType?.priceAdjustment || 0);
                    const [newBooking] = await db.insert(bookings).values({
                        departureId,
                        pilgrimId,
                        roomTypeId: matchedRoomType?.id || '',
                        totalPrice,
                        paymentStatus: 'unpaid',
                        bookingStatus: 'pending',
                        paymentMode: 'manual'
                    }).returning();

                    if (row.roomNumber && newBooking) {
                        await db.insert(roomAssignments).values({
                            bookingId: newBooking.id,
                            roomNumber: row.roomNumber
                        });
                    }

                    imported++;
                }
            } else {
                // Insert new pilgrim
                const [newPilgrim] = await db.insert(pilgrims).values({
                    name: row.name,
                    noKtp: row.noKtp,
                    sex: row.sex,
                    born: row.born,
                    address: row.address,
                    fatherName: row.fatherName,
                    phone: row.phone,
                    maritalStatus: row.maritalStatus,
                    work: row.work,
                    lastEducation: row.lastEducation,
                    hasPassport: row.hasPassport,
                    noPassport: row.noPassport,
                    passportFrom: row.passportFrom,
                    passportReleaseDate: row.passportReleaseDate,
                    passportExpiry: row.passportExpiry,
                    famContactName: row.famContactName,
                    famContact: row.famContact,
                    sourceFrom: row.sourceFrom
                }).returning();

                pilgrimId = newPilgrim.id;

                // Create new booking
                const totalPrice = basePrice + (matchedRoomType?.priceAdjustment || 0);
                const [newBooking] = await db.insert(bookings).values({
                    departureId,
                    pilgrimId,
                    roomTypeId: matchedRoomType?.id || '',
                    totalPrice,
                    paymentStatus: 'unpaid',
                    bookingStatus: 'pending',
                    paymentMode: 'manual'
                }).returning();

                if (row.roomNumber && newBooking) {
                    await db.insert(roomAssignments).values({
                        bookingId: newBooking.id,
                        roomNumber: row.roomNumber
                    });
                }

                imported++;
            }
        } catch (err: any) {
            console.error('Error importing row:', row.rowNumber, err);
            processErrors.push({
                row: row.rowNumber,
                field: 'general',
                message: err.message || 'Gagal memproses baris data'
            });
            skipped++;
        }
    }

    // Update booked seats count in departures
    const totalBookings = await db.select().from(bookings).where(eq(bookings.departureId, departureId));
    await db.update(departures).set({
        bookedSeats: totalBookings.length
    }).where(eq(departures.id, departureId));

    // Log action
    await logAction(
        c.env.DB,
        user?.id || 'system',
        'IMPORT_MANIFEST_EXCEL',
        'departure',
        departureId,
        `Imported ${imported} new pilgrims, updated ${updated} existing records for departure ${departureId}`
    );

    return c.json({
        success: true,
        message: `Berhasil memproses manifest: ${imported} data baru, ${updated} diperbarui${skipped > 0 ? `, ${skipped} dilewati` : ''}.`,
        imported,
        updated,
        skipped,
        errors: processErrors,
        totalProcessed: validRows.length
    });
});

export default api;

