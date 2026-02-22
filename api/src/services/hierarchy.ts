import { eq, and, or, sql, inArray } from 'drizzle-orm';
import { hierarchyPaths, users, pilgrims, bookings } from '../db/schema.js';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb } from '../db/index.js';

export async function insertUserWithHierarchy(
    d1: D1Database,
    newUserId: string,
    parentId: string | null
) {
    const db = getDb(d1);

    // 1. Every user is their own ancestor with path_length 0
    await db.insert(hierarchyPaths).values({
        ancestorId: newUserId,
        descendantId: newUserId,
        pathLength: 0,
    });

    if (parentId) {
        // 2. Insert rows representing paths from all ancestors of parent to the new user
        // SELECT ancestor_id, :newUserId, path_length + 1 FROM hierarchy_paths WHERE descendant_id = :parentId
        const parentAncestors = await db
            .select({
                ancestorId: hierarchyPaths.ancestorId,
                pathLength: hierarchyPaths.pathLength,
            })
            .from(hierarchyPaths)
            .where(eq(hierarchyPaths.descendantId, parentId));

        if (parentAncestors.length > 0) {
            const newPaths = parentAncestors.map((p) => ({
                ancestorId: p.ancestorId,
                descendantId: newUserId,
                pathLength: p.pathLength + 1,
            }));

            await db.insert(hierarchyPaths).values(newPaths);
        }
    }
}

export async function getDownlineTree(d1: D1Database, userId: string) {
    const db = getDb(d1);

    // Get all descendants
    const descendants = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            parentId: users.parentId,
            isActive: users.isActive,
            pathLength: hierarchyPaths.pathLength,
        })
        .from(users)
        .innerJoin(hierarchyPaths, eq(users.id, hierarchyPaths.descendantId))
        .where(and(eq(hierarchyPaths.ancestorId, userId), sql`${hierarchyPaths.pathLength} > 0`))
        .orderBy(hierarchyPaths.pathLength);

    return descendants;
}

export async function getDirectChildren(d1: D1Database, userId: string) {
    const db = getDb(d1);
    return await db.select().from(users).where(eq(users.parentId, userId));
}

export async function getVisibleBookingIds(d1: D1Database, userId: string, role: string) {
    if (role === 'pusat') return null; // Pusat sees all
    const db = getDb(d1);

    // Get all descendant users (affiliators in my tree), including myself (path_length >= 0)
    const descendants = await db.select({ id: hierarchyPaths.descendantId })
        .from(hierarchyPaths)
        .where(eq(hierarchyPaths.ancestorId, userId));

    if (descendants.length === 0) return [];

    const descendantIds = descendants.map(d => d.id);

    const visibleBookings = await db.select({ id: bookings.id })
        .from(bookings)
        .where(inArray(bookings.affiliatorId, descendantIds));

    return visibleBookings.map(b => b.id);
}

export async function checkDuplicatePilgrim(d1: D1Database, nik?: string, phone?: string, passport?: string) {
    const db = getDb(d1);
    const conditions = [];
    if (nik) conditions.push(eq(pilgrims.noKtp, nik));
    if (phone) conditions.push(eq(pilgrims.phone, phone));
    if (passport) conditions.push(eq(pilgrims.noPassport, passport));

    if (conditions.length === 0) return null;

    const existing = await db.select().from(pilgrims).where(or(...conditions)).limit(1);
    return existing.length > 0 ? existing[0] : null;
}
