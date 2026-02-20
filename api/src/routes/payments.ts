import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { paymentInvoices, paymentTransactions, bookings, bankAccounts } from '../db/schema.js';
import { getPaymentMode, verifyMidtransSignature } from '../services/payment.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// 1. GET Payment Mode & Bank Accounts
api.get('/mode', async (c) => {
    const db = getDb(c.env.DB);
    const mode = getPaymentMode(c.env);

    const banks = await db.select().from(bankAccounts).where(eq(bankAccounts.isActive, true));

    return c.json({
        mode: mode.mode,
        clientKey: mode.clientKey,
        banks: banks
    });
});

// 1.0 GET ALL INVOICES (Admin)
api.get('/invoices', authMiddleware, requireRole('pusat'), async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.query.paymentInvoices.findMany({
        with: {
            booking: {
                with: {
                    pilgrim: true
                }
            }
        },
        orderBy: (invoices, { desc }) => [desc(invoices.createdAt)]
    });
    return c.json(data);
});


// 1.1 CREATE INVOICE (Manual Trigger)
api.post('/create-invoice', authMiddleware, zValidator('json', z.object({
    bookingId: z.string()
})), async (c) => {
    const { bookingId } = c.req.valid('json');
    const db = getDb(c.env.DB);

    // Get booking to get amount (usually DP amount)
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
    if (!booking) return c.json({ error: 'Booking not found' }, 404);

    // For now, let's assume DP is Rp 5.000.000 or 30%? 
    // Let's use Rp 5.000.000 as constant for POC, or total_price if less.
    const dpAmount = Math.min(5000000, booking.totalPrice);

    const { createInitialInvoice } = await import('../services/payment.js');
    const invoice = await createInitialInvoice(c.env.DB, c.env, bookingId, dpAmount);

    return c.json(invoice);
});

// 1.2 GET SNAP TOKEN
api.post('/:invoiceId/snap-token', authMiddleware, async (c) => {
    const invoiceId = c.req.param('invoiceId');
    const db = getDb(c.env.DB);
    const serverKey = c.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) return c.json({ error: 'Midtrans not configured' }, 400);

    const [invoice] = await db.select().from(paymentInvoices).where(eq(paymentInvoices.id, invoiceId)).limit(1);
    if (!invoice) return c.json({ error: 'Invoice not found' }, 404);

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, invoice.bookingId)).limit(1);

    // Call Midtrans API
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(serverKey + ':')
        },
        body: JSON.stringify({
            transaction_details: {
                order_id: invoice.id,
                gross_amount: invoice.amount
            },
            credit_card: {
                secure: true
            }
        })
    });

    const data: any = await response.json();

    if (data.token) {
        await db.update(paymentInvoices)
            .set({
                midtransSnapToken: data.token,
                midtransOrderId: invoice.id
            })
            .where(eq(paymentInvoices.id, invoiceId));

        return c.json({ token: data.token });
    }

    return c.json({ error: 'Failed to get snap token', details: data }, 500);
});

// 2. MIDTRANS WEBHOOK
api.post('/webhook', async (c) => {
    const body = await c.req.json();
    const db = getDb(c.env.DB);
    const serverKey = c.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) return c.json({ error: 'Midtrans not configured' }, 400);

    // Verify Signature
    const isValid = await verifyMidtransSignature(
        body.order_id,
        body.status_code,
        body.gross_amount,
        body.signature_key,
        serverKey
    );

    if (!isValid) {
        return c.json({ error: 'Invalid signature' }, 403);
    }

    // Process Transaction
    const transactionStatus = body.transaction_status;
    const fraudStatus = body.fraud_status;

    let status: 'unpaid' | 'pending' | 'paid' | 'cancelled' = 'pending';

    if (transactionStatus === 'capture') {
        if (fraudStatus === 'accept') status = 'paid';
    } else if (transactionStatus === 'settlement') {
        status = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
        status = 'cancelled';
    } else if (transactionStatus === 'pending') {
        status = 'pending';
    }

    // Update Invoice
    const [invoice] = await db.select().from(paymentInvoices).where(eq(paymentInvoices.midtransOrderId, body.order_id)).limit(1);

    if (invoice) {
        await db.batch([
            db.update(paymentInvoices)
                .set({
                    status: status === 'paid' ? 'paid' : (status === 'cancelled' ? 'cancelled' : 'pending'),
                    paidAt: status === 'paid' ? new Date().toISOString() : null
                })
                .where(eq(paymentInvoices.id, invoice.id)),

            db.insert(paymentTransactions).values({
                invoiceId: invoice.id,
                midtransTransactionId: body.transaction_id,
                paymentType: body.payment_type,
                grossAmount: parseInt(body.gross_amount),
                transactionStatus: body.transaction_status,
                rawPayload: JSON.stringify(body)
            })
        ]);

        // Trigger commission calculation if payment is confirmed
        if (status === 'paid') {
            try {
                const { triggerCommissions } = await import('../services/commission.js');
                const [booking] = await db.select().from(bookings).where(eq(bookings.id, invoice.bookingId)).limit(1);
                if (booking) {
                    await triggerCommissions(c.env.DB, invoice.bookingId, booking.totalPrice);

                    // Send WA Success - Need to fetch pilgrim specifically
                    const [p] = await db.select().from({ ...await import('../db/schema.js') }.pilgrims).where(eq({ ...await import('../db/schema.js') }.pilgrims.id, booking.pilgrimId)).limit(1);
                    if (p) {
                        const { WhatsAppService } = await import('../services/whatsapp.js');
                        await WhatsAppService.sendPaymentReceipt(p.phone, {
                            name: p.name,
                            amount: invoice.amount.toLocaleString('id-ID'),
                            invoiceId: invoice.id
                        });
                    }
                }
            } catch (commErr) {
                console.error('Commission trigger failed (webhook):', commErr);
            }
        }
    }

    return c.json({ status: 'OK' });
});

// 3. UPLOAD PROOF (Manual Transfer)
api.post('/:invoiceId/upload-proof', authMiddleware, async (c) => {
    const invoiceId = c.req.param('invoiceId');
    const body = await c.req.parseBody();
    const file = body['proof'] as File;

    if (!file) return c.json({ error: 'No proof file' }, 400);

    const db = getDb(c.env.DB);
    const key = `proofs/${invoiceId}-${Date.now()}-${file.name}`;

    // Upload to R2
    await c.env.R2_DOCUMENTS.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
    });

    await db.update(paymentInvoices)
        .set({
            transferProofKey: key,
            status: 'pending'
        })
        .where(eq(paymentInvoices.id, invoiceId));

    return c.json({ message: 'Proof uploaded', key });
});

// 4. ADMIN: VERIFY PAYMENT
api.patch('/:invoiceId/verify', authMiddleware, requireRole('pusat'), zValidator('json', z.object({
    status: z.enum(['paid', 'cancelled']),
    notes: z.string().optional()
})), async (c) => {
    const invoiceId = c.req.param('invoiceId');
    const { status } = c.req.valid('json');
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const [invoice] = await db.select().from(paymentInvoices).where(eq(paymentInvoices.id, invoiceId)).limit(1);
    if (!invoice) return c.json({ error: 'Invoice not found' }, 404);

    await db.update(paymentInvoices)
        .set({
            status: status,
            verifiedBy: user.id,
            verifiedAt: new Date().toISOString(),
            paidAt: status === 'paid' ? new Date().toISOString() : null
        })
        .where(eq(paymentInvoices.id, invoiceId));

    // Trigger commission calculation if payment approved as paid
    if (status === 'paid') {
        try {
            const { triggerCommissions } = await import('../services/commission.js');
            const [booking] = await db.select().from(bookings).where(eq(bookings.id, invoice.bookingId)).limit(1);
            if (booking) {
                await triggerCommissions(c.env.DB, invoice.bookingId, booking.totalPrice);

                // Send WA Success
                const [p] = await db.select().from({ ...await import('../db/schema.js') }.pilgrims).where(eq({ ...await import('../db/schema.js') }.pilgrims.id, booking.pilgrimId)).limit(1);
                if (p) {
                    const { WhatsAppService } = await import('../services/whatsapp.js');
                    await WhatsAppService.sendPaymentReceipt(p.phone, {
                        name: p.name,
                        amount: invoice.amount.toLocaleString('id-ID'),
                        invoiceId: invoice.id
                    });
                }
            }
        } catch (commErr) {
            console.error('Commission trigger failed (verify):', commErr);
        }
    }

    return c.json({ message: 'Verification updated' });
});

// 5. ADMIN: BANK ACCOUNTS CRUD
api.get('/banks', authMiddleware, requireRole('pusat'), async (c) => {
    const db = getDb(c.env.DB);
    const banks = await db.select().from(bankAccounts);
    return c.json(banks);
});

api.post('/banks', authMiddleware, requireRole('pusat'), zValidator('json', z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    accountHolder: z.string()
})), async (c) => {
    const data = c.req.valid('json');
    const db = getDb(c.env.DB);
    const [bank] = await db.insert(bankAccounts).values(data).returning();
    return c.json(bank);
});

api.patch('/banks/:id', authMiddleware, requireRole('pusat'), zValidator('json', z.object({
    isActive: z.boolean().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional()
})), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const db = getDb(c.env.DB);

    const [bank] = await db.update(bankAccounts).set(data).where(eq(bankAccounts.id, id)).returning();
    return c.json(bank);
});

// 6. SERVE PROOF IMAGE
api.get('/proof/:key', async (c) => {
    const key = `proofs/${c.req.param('key')}`;
    const object = await c.env.R2_DOCUMENTS.get(key);

    if (!object) return c.json({ error: 'File not found' }, 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    return new Response(object.body, { headers });
});

export default api;


