import { eq, or } from 'drizzle-orm';
import { pilgrims } from '../db/schema.js';

export async function checkDuplicatePilgrim(
    db: any,
    noKtp?: string,
    phone?: string,
    noPassport?: string
) {
    if (!noKtp && !phone && !noPassport) {
        return null;
    }

    const conditions = [];
    if (noKtp) conditions.push(eq(pilgrims.noKtp, noKtp));
    if (phone) conditions.push(eq(pilgrims.phone, phone));
    if (noPassport) conditions.push(eq(pilgrims.noPassport, noPassport));

    const existing = await db.query.pilgrims.findFirst({
        where: or(...conditions)
    });

    return existing || null;
}
