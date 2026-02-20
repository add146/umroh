
import { getDb } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const baseKey = await crypto.subtle.importKey(
        'raw',
        data,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        baseKey,
        256
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${saltHex}:${hashHex}`;
}

export default {
    async fetch(request: Request, env: any) {
        const db = getDb(env.DB);

        const hashedPassword = await hashPassword('password123');

        // Upsert Pusat Admin
        await db.insert(users).values({
            id: crypto.randomUUID(),
            email: 'pusat@test.com',
            name: 'Pusat Administrator',
            password: hashedPassword,
            role: 'pusat',
            affiliateCode: 'PUSAT001',
            isActive: true
        }).onConflictDoUpdate({
            target: users.email,
            set: { password: hashedPassword, name: 'Pusat Administrator', isActive: true }
        });

        return new Response('Admin Seeded Successfully with Correct Schema');
    }
}
