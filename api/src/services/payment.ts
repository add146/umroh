import { D1Database } from '@cloudflare/workers-types';
import { getDb } from '../db/index.js';
import { paymentInvoices, bookings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface PaymentMode {
    mode: 'auto' | 'manual';
    clientKey?: string;
}

export function getPaymentMode(env: any): PaymentMode {
    const serverKey = env.MIDTRANS_SERVER_KEY;
    const clientKey = env.MIDTRANS_CLIENT_KEY;

    if (serverKey && clientKey && serverKey !== '' && clientKey !== '') {
        return { mode: 'auto', clientKey };
    }
    return { mode: 'manual' };
}

/**
 * Generates the initial DP invoice for a booking
 */
export async function createInitialInvoice(d1: D1Database, env: any, bookingId: string, amount: number) {
    const db = getDb(d1);
    const mode = getPaymentMode(env).mode;

    const invoiceCode = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [invoice] = await db.insert(paymentInvoices).values({
        bookingId,
        invoiceCode,
        invoiceType: 'dp',
        amount: amount,
        paymentMode: mode,
        status: 'unpaid',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h due date
    }).returning();

    return invoice;
}

/**
 * Handle Midtrans Signature Verification
 */
export async function verifyMidtransSignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string, serverKey: string) {
    // Standard Midtrans Signature: SHA512(order_id + status_code + gross_amount + server_key)
    const rawString = orderId + statusCode + grossAmount + serverKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex === signatureKey;
}
