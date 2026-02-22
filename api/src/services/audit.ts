import { auditLog } from '../db/schema.js';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb } from '../db/index.js';

export async function logAction(
    d1: D1Database,
    userId: string,
    action: string,
    targetType?: string,
    targetId?: string,
    details?: any
) {
    const db = getDb(d1);
    try {
        await db.insert(auditLog).values({
            userId,
            action,
            targetType,
            targetId,
            details: details ? JSON.stringify(details) : null,
        });
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
}
