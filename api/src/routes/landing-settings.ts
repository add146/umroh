import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

type Env = {
    Bindings: {
        DB: D1Database;
        JWT_SECRET: string;
    };
    Variables: {
        user: { id: string; email: string; role: string };
    };
};

const app = new Hono<Env>();

// GET /api/landing-settings — Public: fetch all settings as {key: value}
app.get('/', async (c) => {
    try {
        const results = await c.env.DB.prepare(
            'SELECT key, value FROM landing_settings'
        ).all();

        const settings: Record<string, any> = {};
        for (const row of (results.results || []) as any[]) {
            // Try to parse JSON values; fallback to raw string
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch {
                settings[row.key] = row.value;
            }
        }

        return c.json({ settings });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

// PUT /api/landing-settings — Admin only: bulk update settings
app.put('/', authMiddleware, async (c) => {
    // Auth check — must be pusat or cabang
    const user = c.get('user' as any) as any;
    if (!user || !['pusat', 'cabang'].includes(user.role)) {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    try {
        const body = await c.req.json();
        const { settings } = body as { settings: { key: string; value: any }[] };

        if (!settings || !Array.isArray(settings)) {
            return c.json({ error: 'settings array is required' }, 400);
        }

        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

        // Use batch for atomic updates
        const stmts = settings.map(({ key, value }) => {
            const strValue = typeof value === 'string' ? value : JSON.stringify(value);
            return c.env.DB.prepare(
                `INSERT INTO landing_settings (key, value, updated_at) VALUES (?, ?, ?)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
            ).bind(key, strValue, now);
        });

        await c.env.DB.batch(stmts);

        return c.json({ success: true, updated: settings.length });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

export default app;
