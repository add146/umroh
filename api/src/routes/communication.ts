import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { WhatsAppService } from '../services/whatsapp.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// 1. Test WA Connection
api.post('/test-wa', authMiddleware, zValidator('json', z.object({
    phone: z.string(),
    message: z.string()
})), async (c) => {
    const { phone, message } = c.req.valid('json');
    const result = await WhatsAppService.sendMessage(phone, message);

    if (result.success) {
        return c.json({ success: true, message: 'Message sent via WAHA' });
    } else {
        return c.json({ success: false, error: result.error }, 500);
    }
});

// 2. Broadcast (Admin Pusat & Cabang)
api.post('/broadcast', authMiddleware, requireRole('pusat', 'cabang'), zValidator('json', z.object({
    phones: z.array(z.string()),
    message: z.string()
})), async (c) => {
    const { phones, message } = c.req.valid('json');

    const results = [];
    for (const phone of phones) {
        const res = await WhatsAppService.sendMessage(phone, message);
        results.push(res);
        // Delay 1 second between messages to respect WAHA rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const failed = results.filter(r => !r.success).length;

    return c.json({
        total: phones.length,
        success: phones.length - failed,
        failed
    });
});

export default api;
