import { D1Database } from '@cloudflare/workers-types';
import { getDb } from '../db/index.js';
import { commissionRules, commissionLedger, bookings, users, hierarchyPaths } from '../db/schema.js';
import { eq, and, inArray, isNull, or } from 'drizzle-orm';

/**
 * Menghitung dan menyimpan komisi ke ledger ketika invoice lunas.
 * Menelusuri seluruh upline dari affiliatorId via closure table.
 */
export async function triggerCommissions(d1: D1Database, bookingId: string, totalPrice: number): Promise<void> {
    const db = getDb(d1);

    // 1. Ambil booking untuk dapatkan affiliatorId
    const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: { affiliator: true }
    });

    if (!booking || !booking.affiliatorId) {
        // Tidak ada affiliator, tidak ada komisi
        return;
    }

    const affiliatorId = booking.affiliatorId;
    const affiliatorRole = (booking as any).affiliator?.role as string;

    // 2. Ambil semua ancestor dari affiliatorId via hierarchy_paths
    const ancestors = await db
        .select({
            ancestorId: hierarchyPaths.ancestorId,
            pathLength: hierarchyPaths.pathLength,
        })
        .from(hierarchyPaths)
        .where(
            and(
                eq(hierarchyPaths.descendantId, affiliatorId),
                // path_length > 0 artinya bukan dirinya sendiri
            )
        );

    // Filter path_length > 0 (exclude self)
    const uplineAncestors = ancestors.filter(a => a.pathLength > 0);

    // Juga tambahkan affiliator itu sendiri (level 0)
    const allTargets = [
        { ancestorId: affiliatorId, pathLength: 0 },
        ...uplineAncestors
    ];

    if (allTargets.length === 0) return;

    const ancestorIds = allTargets.map(a => a.ancestorId);

    // 3. Ambil data user (role) untuk setiap ancestor
    const ancestorUsers = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(inArray(users.id, ancestorIds));

    const userRoleMap = new Map(ancestorUsers.map(u => [u.id, u.role]));

    // 4. Ambil semua commission rules yang berlaku
    // Rules berlaku jika: userId = ancestor.id DAN targetRole = affiliatorRole (dan package cocok atau null)
    const rules = await db
        .select()
        .from(commissionRules)
        .where(
            and(
                inArray(commissionRules.userId, ancestorIds),
                eq(commissionRules.targetRole, affiliatorRole as any),
                or(
                    isNull(commissionRules.packageId),
                    eq(commissionRules.packageId, (booking as any).departure?.packageId || '')
                )
            )
        );

    const ruleMap = new Map(rules.map(r => [r.userId, r]));

    // 5. Hitung dan insert komisi per ancestor
    const ledgerEntries: Array<{
        bookingId: string;
        userId: string;
        role: string;
        amount: number;
        commissionType: 'flat' | 'percentage';
        status: 'pending';
    }> = [];

    for (const target of allTargets) {
        const rule = ruleMap.get(target.ancestorId);
        if (!rule) continue;

        const role = userRoleMap.get(target.ancestorId) || '';
        let amount = 0;

        if (rule.commissionType === 'percentage') {
            amount = Math.round((rule.commissionValue / 100) * totalPrice);
        } else {
            amount = Math.round(rule.commissionValue);
        }

        if (amount <= 0) continue;

        ledgerEntries.push({
            bookingId,
            userId: target.ancestorId,
            role,
            amount,
            commissionType: rule.commissionType,
            status: 'pending',
        });
    }

    if (ledgerEntries.length > 0) {
        await db.insert(commissionLedger).values(ledgerEntries);
    }
}

/**
 * Ambil summary komisi untuk satu user (untuk dashboard)
 */
export async function getUserCommissionSummary(d1: D1Database, userId: string) {
    const db = getDb(d1);

    const entries = await db
        .select()
        .from(commissionLedger)
        .where(eq(commissionLedger.userId, userId));

    const totalPending = entries
        .filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + e.amount, 0);

    const totalPaid = entries
        .filter(e => e.status === 'paid')
        .reduce((sum, e) => sum + e.amount, 0);

    return {
        totalEntries: entries.length,
        totalPending,
        totalPaid,
        entries,
    };
}
