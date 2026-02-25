import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { packages, roomTypes } from '../db/schema';
import type { Env } from '../index';

const api = new Hono<{ Bindings: Env }>();

const calculatorSchema = z.object({
    packageId: z.string().uuid(),
    departureId: z.string().uuid(), // Mainly for validation
    roomTypeId: z.string().uuid(),
    pax: z.number().min(1).default(1)
});

api.post('/', zValidator('json', calculatorSchema), async (c) => {
    const { packageId, roomTypeId, pax } = c.req.valid('json');
    const db = getDb(c.env.DB);

    const pkg = await db.query.packages.findFirst({
        where: eq(packages.id, packageId)
    });

    if (!pkg) {
        return c.json({ error: 'Package not found' }, 404);
    }

    const room = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.id, roomTypeId)
    });

    if (!room) {
        return c.json({ error: 'Room type not found' }, 404);
    }

    const basePrice = pkg.basePrice;
    const roomAdjustment = room.priceAdjustment || 0;
    const pricePerPax = basePrice + roomAdjustment;
    const totalPrice = pricePerPax * pax;

    // DP Logic: use package dpAmount if > 0, else 30% of total
    let dpPerPax = pkg.dpAmount && pkg.dpAmount > 0 ? pkg.dpAmount : Math.round(pricePerPax * 0.3);
    let totalDp = dpPerPax * pax;

    const remainingBalance = totalPrice - totalDp;

    // Simulate 3 installments
    const installmentAmount = Math.round(remainingBalance / 3);

    const today = new Date();
    const installments = [];

    for (let i = 1; i <= 3; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(today.getMonth() + i);

        // Handle uneven division
        const amount = i === 3 ? remainingBalance - (installmentAmount * 2) : installmentAmount;

        installments.push({
            term: i,
            amount,
            dueDate: dueDate.toISOString().split('T')[0] // YYYY-MM-DD
        });
    }

    return c.json({
        pricePerPax,
        totalPrice,
        pax,
        dpPerPax,
        totalDp,
        remainingBalance,
        installments
    });
});

export default api;
