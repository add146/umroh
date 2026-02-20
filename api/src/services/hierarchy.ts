import { eq, and, sql } from 'drizzle-orm';
import { hierarchyPaths, users } from '../db/schema.js';
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
