import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, or } from 'drizzle-orm';
import { getDb } from '../db/index.js';

import { packages } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

const packageSchema = z.object({
    name: z.string().min(3),
    slug: z.string().optional(), // auto-generated if not provided
    description: z.string().optional(),
    basePrice: z.number().positive(),
    image: z.string().optional(),

    packageType: z.string().optional(),
    starRating: z.number().optional(),
    images: z.string().optional(), // JSON
    isPromo: z.boolean().optional(),
    promoText: z.string().optional(),

    makkahHotelId: z.string().optional().nullable(),
    madinahHotelId: z.string().optional().nullable(),

    itinerary: z.string().optional(), // JSON or rich text HTML
    facilities: z.string().optional(), // JSON or rich text HTML
    termsConditions: z.string().optional(),
    requirements: z.string().optional(),

    duration: z.string().optional(), // e.g. "12 Hari + Turki"
    serviceType: z.string().optional(), // jenis layanan

    isActive: z.boolean().default(true),
});


// Public: List all active packages
api.get('/', async (c) => {
    const db = getDb(c.env.DB);
    const data = await db.query.packages.findMany({
        where: eq(packages.isActive, true),
        with: {
            makkahHotel: true,
            madinahHotel: true,
        }
    });
    return c.json({ packages: data });
});

// Public: Get single package by ID or slug
api.get('/:id', async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);
    const pkg = await db.query.packages.findFirst({
        where: or(eq(packages.id, id), eq(packages.slug, id)),
        with: {
            makkahHotel: true,
            madinahHotel: true,
            departures: {
                with: {
                    roomTypes: true,
                    departureAirline: true,
                    returnAirline: true,
                    departureAirport: true,
                    arrivalAirport: true,
                }
            }
        }
    });

    if (!pkg) return c.json({ error: 'Package not found' }, 404);
    return c.json({ package: pkg });
});

// Admin: Create package
api.post('/', authMiddleware, requireRole('pusat'), zValidator('json', packageSchema), async (c) => {
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    // Auto-generate slug from name if not provided
    const slug = body.slug || (slugify(body.name) + '-' + Date.now().toString(36));

    // Clean empty strings to null for FK fields
    const values = {
        ...body,
        slug,
        makkahHotelId: body.makkahHotelId || null,
        madinahHotelId: body.madinahHotelId || null,
    };

    const result = await db.insert(packages).values(values).returning();
    return c.json({ package: result[0] }, 201);
});

// Admin: Update package
api.put('/:id', authMiddleware, requireRole('pusat'), zValidator('json', packageSchema.partial()), async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const db = getDb(c.env.DB);

    // Clean empty strings to null for FK fields
    const values: any = { ...body };
    if ('makkahHotelId' in values) values.makkahHotelId = values.makkahHotelId || null;
    if ('madinahHotelId' in values) values.madinahHotelId = values.madinahHotelId || null;

    const result = await db.update(packages).set(values).where(eq(packages.id, id)).returning();
    if (result.length === 0) return c.json({ error: 'Package not found' }, 404);
    return c.json({ package: result[0] });
});

// Admin: Soft-delete package
api.delete('/:id', authMiddleware, requireRole('pusat'), async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    await db.update(packages).set({ isActive: false }).where(eq(packages.id, id));
    return c.json({ message: 'Package deactivated' });
});

export default api;
