import { Hono } from 'hono';
import { createSeatLock, checkAvailability } from '../services/seats.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

api.get('/:departureId/availability', async (c) => {
    const departureId = c.req.param('departureId');
    const result = await checkAvailability(c.env.DB, departureId);
    return c.json(result);
});

api.post('/:departureId/lock', async (c) => {
    const departureId = c.req.param('departureId');
    try {
        const lock = await createSeatLock(c.env.DB, departureId);
        return c.json(lock, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
});

export default api;
