import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { WhatsAppService } from '../services/whatsapp.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env, Variables: { user: any } }>();

// 1. Test WA Connection (send message via Evolution API)
api.post('/test-wa', authMiddleware, zValidator('json', z.object({
    phone: z.string(),
    message: z.string()
})), async (c) => {
    const { phone, message } = c.req.valid('json');
    const { getDb } = await import('../db/index.js');
    const db = getDb(c.env.DB);
    const result = await WhatsAppService.sendMessage(db, phone, message);

    if (result.success) {
        return c.json({ success: true, message: 'Pesan berhasil dikirim via Evolution API' });
    } else {
        const errStr = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
        return c.json({ success: false, error: `Evolution API Error: ${errStr}` }, 500);
    }
});

// 2. Send Single Message
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

// 3. Get QR Code for Evolution API instance
api.get('/wa/qr', authMiddleware, requireRole('pusat'), async (c) => {
    const { getDb } = await import('../db/index.js');
    const db = getDb(c.env.DB);
    const config = await WhatsAppService.getWahaConfig(db);
    try {
        const data = await WhatsAppService.getQRCode(config.baseUrl, config.apiKey, config.session);
        return c.json({ success: true, qr: data });
    } catch (err: any) {
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 4. Get connection status
api.get('/wa/status', authMiddleware, requireRole('pusat'), async (c) => {
    const { getDb } = await import('../db/index.js');
    const db = getDb(c.env.DB);
    const config = await WhatsAppService.getWahaConfig(db);
    try {
        const data = await WhatsAppService.getConnectionState(config.baseUrl, config.apiKey, config.session);
        return c.json({ success: true, state: data });
    } catch (err: any) {
        return c.json({ success: false, error: err.message }, 500);
    }
});

// 5. Logout / disconnect instance
api.delete('/wa/logout', authMiddleware, requireRole('pusat'), async (c) => {
    const { getDb } = await import('../db/index.js');
    const db = getDb(c.env.DB);
    const config = await WhatsAppService.getWahaConfig(db);
    try {
        const data = await WhatsAppService.logoutInstance(config.baseUrl, config.apiKey, config.session);
        return c.json({ success: true, data });
    } catch (err: any) {
        return c.json({ success: false, error: err.message }, 500);
    }
});

export default api;
