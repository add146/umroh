import { db } from './src/db/index.js';
import { users, hierarchyPaths, packages, departures, roomTypes, pilgrims, bookings } from './src/db/schema.js';
import { hashPassword } from './src/lib/password.js';

async function seed() {
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

        console.log('Seed successful. Agen: agen.test@umroh.com (password123). Cabang: cabang.test@umroh.com (password123)');
    } catch (err) {
        console.error('Seed error:', err);
    }
}
seed();
