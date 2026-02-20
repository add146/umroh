import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { getDb } from '../db/index.js';
import { documents } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { StorageService, OCRService } from '../services/storage_ocr.js';
import { Env } from '../index.js';

const api = new Hono<{ Bindings: Env }>();

// 1. Upload Document & Process OCR (Public for registration flow)
api.post('/upload', async (c) => {
    const formData = await c.req.parseBody();
    const file = formData['file'] as File;
    const pilgrimId = formData['pilgrimId'] as string;
    const docType = formData['docType'] as 'ktp' | 'passport' | 'visa' | 'other';

    if (!file || !pilgrimId || !docType) {
        return c.json({ error: 'Missing file, pilgrimId or docType' }, 400);
    }

    const db = getDb(c.env.DB);
    const buffer = await file.arrayBuffer();
    const key = `pilgrims/${pilgrimId}/${docType}_${Date.now()}_${file.name}`;

    try {
        // 1. Upload to R2
        await StorageService.upload(c.env.R2_DOCUMENTS, key, buffer, file.type);

        // 2. Process OCR if type is KTP or Passport
        let ocrResult = null;
        if (docType === 'ktp' || docType === 'passport') {
            ocrResult = await OCRService.extractData(buffer, docType);
        }

        // 3. Save metadata to DB
        const [doc] = await db.insert(documents).values({
            pilgrimId,
            docType,
            r2Key: key,
            ocrResult: ocrResult ? JSON.stringify(ocrResult) : null,
        }).returning();

        return c.json({
            success: true,
            document: doc,
            ocr: ocrResult
        });
    } catch (err: any) {
        console.error('Upload error:', err);
        return c.json({ error: err.message || 'Internal Server Error' }, 500);
    }
});

// 2. GET Documents by Pilgrim
api.get('/pilgrim/:pilgrimId', authMiddleware, async (c) => {
    const pilgrimId = c.req.param('pilgrimId');
    const db = getDb(c.env.DB);

    const data = await db.select().from(documents).where(eq(documents.pilgrimId, pilgrimId));
    return c.json(data);
});

// 3. View File (Stream from R2)
api.get('/:id/view', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const db = getDb(c.env.DB);

    const [doc] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (!doc) return c.json({ error: 'Document not found' }, 404);

    const file = await StorageService.getFile(c.env.R2_DOCUMENTS, doc.r2Key);
    if (!file) return c.json({ error: 'File not found in storage' }, 404);

    return c.body(file.body, 200, {
        'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream',
    });
});

// 4. Verify Document (Admin)
api.patch('/:id/verify', authMiddleware, zValidator('json', z.object({
    isVerified: z.boolean()
})), async (c) => {
    const id = c.req.param('id');
    const { isVerified } = c.req.valid('json');
    const user = c.get('user');
    const db = getDb(c.env.DB);

    const [updated] = await db.update(documents).set({
        isVerified,
        verifiedBy: user.id,
        verifiedAt: new Date().toISOString()
    }).where(eq(documents.id, id)).returning();

    return c.json(updated);
});

export default api;
