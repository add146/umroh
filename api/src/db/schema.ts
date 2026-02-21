import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').unique().notNull(),
    password: text('password').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    role: text('role', { enum: ['pusat', 'cabang', 'mitra', 'agen', 'reseller'] }).notNull(),
    affiliateCode: text('affiliate_code').unique(),
    parentId: text('parent_id').references((): any => users.id),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),

    createdAt: text('created_at').default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const hierarchyPaths = sqliteTable('hierarchy_paths', {
    ancestorId: text('ancestor_id').notNull().references(() => users.id),
    descendantId: text('descendant_id').notNull().references(() => users.id),
    pathLength: integer('path_length').notNull().default(0),
}, (table) => ({
    pk: primaryKey({ columns: [table.ancestorId, table.descendantId] }),
}));

export const commissionRules = sqliteTable('commission_rules', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').notNull().references(() => users.id),
    targetRole: text('target_role', { enum: ['cabang', 'mitra', 'agen', 'reseller'] }).notNull(),
    packageId: text('package_id'), // nullable = berlaku global untuk semua paket
    commissionType: text('commission_type', { enum: ['flat', 'percentage'] }).notNull(),
    commissionValue: real('commission_value').notNull(),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// --- FASE 4: AFFILIATE ENGINE ---

export const commissionLedger = sqliteTable('commission_ledger', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    bookingId: text('booking_id').notNull().references(() => bookings.id),
    userId: text('user_id').notNull().references(() => users.id), // penerima komisi
    role: text('role').notNull(), // role penerima saat komisi dibuat
    amount: integer('amount').notNull(), // dalam Rupiah
    commissionType: text('commission_type', { enum: ['flat', 'percentage'] }).notNull(),
    status: text('status', { enum: ['pending', 'paid'] }).default('pending'),
    paidAt: text('paid_at'),
    paidBy: text('paid_by').references(() => users.id),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const affiliateClicks = sqliteTable('affiliate_clicks', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    affiliateCode: text('affiliate_code').notNull(),
    userId: text('user_id').references(() => users.id), // siapa pemilik kode ini
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    clickedAt: text('clicked_at').default(sql`(datetime('now'))`),
});

// --- FASE 2: KATALOG & BOOKING ---

// --- MASTER DATA ---
export const hotels = sqliteTable('hotels', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    city: text('city').notNull(), // e.g. Makkah, Madinah
    starRating: integer('star_rating').notNull().default(3),
    distanceToHaram: text('distance_to_haram'), // e.g. "50m to Haram"
    image: text('image'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const airlines = sqliteTable('airlines', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(), // e.g. "Saudi Airlines"
    code: text('code').notNull(), // e.g. "SV"
    icon: text('icon'), // URL logo/icon
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const airports = sqliteTable('airports', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(), // e.g. "Soekarno-Hatta"
    code: text('code').notNull(), // e.g. "CGK"
    city: text('city').notNull(), // e.g. "Jakarta"
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});


export const packages = sqliteTable('packages', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(), // e.g. "Premium Umrah 12 Days"
    slug: text('slug').unique().notNull(),
    description: text('description'),
    basePrice: integer('base_price').notNull(),
    image: text('image'), // Foto utama

    // -- Kolom Spesifik UI --
    packageType: text('package_type'), // e.g. "Premium", "Economy"
    starRating: integer('star_rating').default(3), // overall rating
    images: text('images'), // JSON array of gallery URLs
    isPromo: integer('is_promo', { mode: 'boolean' }).default(false),
    promoText: text('promo_text'), // e.g. "Limited Promo! Book before Sept 30"

    // Relasi Hotel
    makkahHotelId: text('makkah_hotel_id').references(() => hotels.id),
    madinahHotelId: text('madinah_hotel_id').references(() => hotels.id),

    // Komponen Terstruktur JSON
    itinerary: text('itinerary'),
    facilities: text('facilities'),
    termsConditions: text('terms_conditions'),
    requirements: text('requirements'),

    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const departures = sqliteTable('departures', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    packageId: text('package_id').notNull().references(() => packages.id),
    tripName: text('trip_name'), // e.g. "Umrah Plus Turkey - Oct Group A"
    departureDate: text('departure_date').notNull(),

    // Transportasi aktual
    departureAirlineId: text('departure_airline_id').references(() => airlines.id),
    returnAirlineId: text('return_airline_id').references(() => airlines.id),
    departureAirportId: text('departure_airport_id').references(() => airports.id),
    arrivalAirportId: text('arrival_airport_id').references(() => airports.id),

    // backward comp / temp string prop
    airport: text('airport').notNull(), // e.g. "CGK", "SUB"

    totalSeats: integer('total_seats').notNull(),
    bookedSeats: integer('booked_seats').notNull().default(0),
    status: text('status', { enum: ['available', 'last_call', 'full', 'departed'] }).default('available'),
    siskopatuhStatus: text('siskopatuh_status', { enum: ['synced', 'pending', 'error'] }).default('pending'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const roomTypes = sqliteTable('room_types', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    departureId: text('departure_id').notNull().references(() => departures.id),
    name: text('name').notNull(), // e.g. "Quad", "Triple", "Double"
    capacity: integer('capacity').notNull(),
    priceAdjustment: integer('price_adjustment').notNull().default(0), // added to basePrice
});

export const pilgrims = sqliteTable('pilgrims', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Section B: Data Pribadi
    name: text('name').notNull(),
    noKtp: text('no_ktp').notNull().unique(),
    sex: text('sex', { enum: ['L', 'P'] }).notNull(),
    born: text('born').notNull(), // format YYYY-MM-DD
    address: text('address').notNull(),
    fatherName: text('father_name').notNull(),

    // Section C: Data Paspor
    hasPassport: integer('has_passport', { mode: 'boolean' }).default(false),
    noPassport: text('no_passport'),
    passportFrom: text('passport_from'),
    passportReleaseDate: text('passport_release_date'),
    passportExpiry: text('passport_expiry'),

    // Section D: Kontak & Status
    maritalStatus: text('marital_status', { enum: ['Belum Menikah', 'Menikah', 'Cerai'] }).notNull(),
    phone: text('phone').notNull(),
    homePhone: text('home_phone'),
    lastEducation: text('last_education').notNull(),
    work: text('work').notNull(),
    diseaseHistory: text('disease_history'),

    // Section E: Data Keluarga & Sumber (Data Keluarga is simplified here as a JSON string for member list)
    famMember: text('fam_member'),
    famContactName: text('fam_contact_name').notNull(),
    famContact: text('fam_contact').notNull(),

    // Section F: Sumber Informasi
    sourceFrom: text('source_from').notNull(),

    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const bookings = sqliteTable('bookings', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    departureId: text('departure_id').notNull().references(() => departures.id),
    pilgrimId: text('pilgrim_id').notNull().references(() => pilgrims.id),
    affiliatorId: text('affiliator_id').references(() => users.id),
    roomTypeId: text('room_type_id').notNull().references(() => roomTypes.id),

    totalPrice: integer('total_price').notNull(),
    paymentStatus: text('payment_status', { enum: ['unpaid', 'partial', 'paid', 'cancelled'] }).default('unpaid'),
    bookingStatus: text('booking_status', { enum: ['pending', 'confirmed', 'cancelled'] }).default('pending'),

    bookedAt: text('booked_at').default(sql`(datetime('now'))`),
});

export const seatLocks = sqliteTable('seat_locks', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    departureId: text('departure_id').notNull().references(() => departures.id),
    lockKey: text('lock_key').notNull(), // e.g. session_id or temp_id
    expiresAt: integer('expires_at').notNull(), // Unix timestamp
});

// --- FASE 3: PAYMENT ---

export const bankAccounts = sqliteTable('bank_accounts', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    bankName: text('bank_name').notNull(), // e.g. "BCA", "Mandiri"
    accountNumber: text('account_number').notNull(),
    accountHolder: text('account_holder').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const paymentInvoices = sqliteTable('payment_invoices', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    bookingId: text('booking_id').notNull().references(() => bookings.id),
    invoiceCode: text('invoice_code').unique().notNull(), // BK-YYYYMMDD-XXX-DP
    invoiceType: text('invoice_type', { enum: ['dp', 'installment', 'final', 'full'] }).notNull(),
    amount: integer('amount').notNull(),
    dueDate: text('due_date'),
    status: text('status', { enum: ['unpaid', 'pending', 'paid', 'overdue', 'cancelled'] }).default('unpaid'),
    paymentMode: text('payment_mode', { enum: ['auto', 'manual'] }).notNull(),

    // Midtrans specific
    midtransOrderId: text('midtrans_order_id'),
    midtransSnapToken: text('midtrans_snap_token'),

    // Manual specific
    transferProofKey: text('transfer_proof_key'), // R2 Key
    verifiedBy: text('verified_by').references(() => users.id),
    verifiedAt: text('verified_at'),

    paidAt: text('paid_at'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const paymentTransactions = sqliteTable('payment_transactions', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    invoiceId: text('invoice_id').notNull().references(() => paymentInvoices.id),
    midtransTransactionId: text('midtrans_transaction_id'),
    paymentType: text('payment_type'), // e.g. bank_transfer, gopay
    grossAmount: integer('gross_amount').notNull(),
    transactionStatus: text('transaction_status').notNull(),
    rawPayload: text('raw_payload'), // Full JSON from webhook
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// --- FASE 5: OPERATIONS & OCR ---

export const documents = sqliteTable('documents', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    pilgrimId: text('pilgrim_id').notNull().references(() => pilgrims.id),
    docType: text('doc_type', { enum: ['ktp', 'passport', 'visa', 'other'] }).notNull(),
    r2Key: text('r2_key').notNull(),
    ocrResult: text('ocr_result'), // JSON string
    isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
    verifiedAt: text('verified_at'),
    verifiedBy: text('verified_by').references(() => users.id),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const equipmentItems = sqliteTable('equipment_items', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const equipmentChecklist = sqliteTable('equipment_checklist', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    bookingId: text('booking_id').notNull().references(() => bookings.id),
    equipmentItemId: text('equipment_item_id').notNull().references(() => equipmentItems.id),
    status: text('status', { enum: ['pending', 'received'] }).default('pending'),
    receivedAt: text('received_at'),
    receivedBy: text('received_by').references(() => users.id),
});

export const roomAssignments = sqliteTable('room_assignments', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    bookingId: text('booking_id').notNull().references(() => bookings.id),
    roomNumber: text('room_number').notNull(),
    notes: text('notes'),
    createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// relations.ts - merged into schema.ts for simplicity in this environment

import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many, one }) => ({
    descendants: many(hierarchyPaths, { relationName: 'ancestor' }),
    ancestors: many(hierarchyPaths, { relationName: 'descendant' }),
    bookings: many(bookings),
    verifiedInvoices: many(paymentInvoices),
    commissionRules: many(commissionRules),
    ledgerEntries: many(commissionLedger, { relationName: 'ledgerRecipient' }),
    disbursedEntries: many(commissionLedger, { relationName: 'ledgerPayer' }),
    affiliateClicks: many(affiliateClicks),
    parent: one(users, {
        fields: [users.parentId],
        references: [users.id],
    }),
    verifiedDocuments: many(documents),
    receivedEquipment: many(equipmentChecklist),
}));

export const packagesRelations = relations(packages, ({ many, one }) => ({
    departures: many(departures),
    makkahHotel: one(hotels, {
        fields: [packages.makkahHotelId],
        references: [hotels.id],
    }),
    madinahHotel: one(hotels, {
        fields: [packages.madinahHotelId],
        references: [hotels.id],
    }),
}));

export const departuresRelations = relations(departures, ({ one, many }) => ({
    package: one(packages, {
        fields: [departures.packageId],
        references: [packages.id],
    }),
    roomTypes: many(roomTypes),
    bookings: many(bookings),
    seatLocks: many(seatLocks),
    departureAirline: one(airlines, {
        fields: [departures.departureAirlineId],
        references: [airlines.id],
    }),
    returnAirline: one(airlines, {
        fields: [departures.returnAirlineId],
        references: [airlines.id],
    }),
    departureAirport: one(airports, {
        fields: [departures.departureAirportId],
        references: [airports.id],
    }),
    arrivalAirport: one(airports, {
        fields: [departures.arrivalAirportId],
        references: [airports.id],
    }),
}));


export const roomTypesRelations = relations(roomTypes, ({ one }) => ({
    departure: one(departures, {
        fields: [roomTypes.departureId],
        references: [departures.id],
    }),
}));

export const pilgrimsRelations = relations(pilgrims, ({ many }) => ({
    bookings: many(bookings),
    documents: many(documents),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
    departure: one(departures, {
        fields: [bookings.departureId],
        references: [departures.id],
    }),
    pilgrim: one(pilgrims, {
        fields: [bookings.pilgrimId],
        references: [pilgrims.id],
    }),
    roomType: one(roomTypes, {
        fields: [bookings.roomTypeId],
        references: [roomTypes.id],
    }),
    affiliator: one(users, {
        fields: [bookings.affiliatorId],
        references: [users.id],
    }),
    invoices: many(paymentInvoices),
    commissions: many(commissionLedger),
    equipmentChecklist: many(equipmentChecklist),
    roomAssignment: one(roomAssignments, {
        fields: [bookings.id],
        references: [roomAssignments.bookingId],
    }),
}));

export const hierarchyPathsRelations = relations(hierarchyPaths, ({ one }) => ({
    ancestor: one(users, {
        fields: [hierarchyPaths.ancestorId],
        references: [users.id],
        relationName: 'ancestor',
    }),
    descendant: one(users, {
        fields: [hierarchyPaths.descendantId],
        references: [users.id],
        relationName: 'descendant',
    }),
}));

export const seatLocksRelations = relations(seatLocks, ({ one }) => ({
    departure: one(departures, {
        fields: [seatLocks.departureId],
        references: [departures.id],
    }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ many }) => ({
    // reserved for future use
}));

export const paymentInvoicesRelations = relations(paymentInvoices, ({ one, many }) => ({
    booking: one(bookings, {
        fields: [paymentInvoices.bookingId],
        references: [bookings.id],
    }),
    verifier: one(users, {
        fields: [paymentInvoices.verifiedBy],
        references: [users.id],
    }),
    transactions: many(paymentTransactions),
}));

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
    invoice: one(paymentInvoices, {
        fields: [paymentTransactions.invoiceId],
        references: [paymentInvoices.id],
    }),
}));

export const commissionRulesRelations = relations(commissionRules, ({ one }) => ({
    user: one(users, {
        fields: [commissionRules.userId],
        references: [users.id],
    }),
}));

export const commissionLedgerRelations = relations(commissionLedger, ({ one }) => ({
    booking: one(bookings, {
        fields: [commissionLedger.bookingId],
        references: [bookings.id],
    }),
    user: one(users, {
        fields: [commissionLedger.userId],
        references: [users.id],
        relationName: 'ledgerRecipient',
    }),
    payer: one(users, {
        fields: [commissionLedger.paidBy],
        references: [users.id],
        relationName: 'ledgerPayer',
    }),
}));

export const affiliateClicksRelations = relations(affiliateClicks, ({ one }) => ({
    user: one(users, {
        fields: [affiliateClicks.userId],
        references: [users.id],
    }),
}));


export const documentsRelations = relations(documents, ({ one }) => ({
    pilgrim: one(pilgrims, {
        fields: [documents.pilgrimId],
        references: [pilgrims.id],
    }),
    verifier: one(users, {
        fields: [documents.verifiedBy],
        references: [users.id],
    }),
}));

export const equipmentItemsRelations = relations(equipmentItems, ({ many }) => ({
    checklists: many(equipmentChecklist),
}));

export const equipmentChecklistRelations = relations(equipmentChecklist, ({ one }) => ({
    booking: one(bookings, {
        fields: [equipmentChecklist.bookingId],
        references: [bookings.id],
    }),
    item: one(equipmentItems, {
        fields: [equipmentChecklist.equipmentItemId],
        references: [equipmentItems.id],
    }),
    receiver: one(users, {
        fields: [equipmentChecklist.receivedBy],
        references: [users.id],
    }),
}));

export const roomAssignmentsRelations = relations(roomAssignments, ({ one }) => ({
    booking: one(bookings, {
        fields: [roomAssignments.bookingId],
        references: [bookings.id],
    }),
}));
