import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { WhatsAppService } from '../services/whatsapp.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// 1. Test WA Connection (single message with typing + delay)
api.post('/test-wa', authMiddleware, zValidator('json', z.object({
    phone: z.string(),
    message: z.string()
})), async (c) => {
    const { phone, message } = c.req.valid('json');
    const { getDb } = await import('../db/index.js');
    const db = getDb(c.env.DB);
    const result = await WhatsAppService.sendMessage(db, phone, message);

    if (result.success) {
        return c.json({ success: true, message: 'Message sent via WAHA' });
    } else {
        const errStr = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
        return c.json({ success: false, error: `WAHA Error: ${errStr}` }, 500);
    }
});

// 2. Send Single Message (used by frontend bulk loop, one call per contact)
api.post('/send-single', authMiddleware, requireRole('pusat', 'cabang'), zValidator('json', z.object({
    phone: z.string(),
    message: z.string()
})), async (c) => {
    const { phone, message } = c.req.valid('json');
    const { getDb } = await import('../db/index.js');
    const db = getDb(c.env.DB);
    const result = await WhatsAppService.sendMessage(db, phone, message);

    if (result.success) {
        return c.json({ success: true });
    } else {
        const errStr = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
        return c.json({ success: false, error: errStr }, 500);
    }
});

export default api;
