export const roleHierarchy = {
    pusat: 'cabang',
    cabang: 'mitra',
    mitra: 'agen',
    agen: 'reseller',
    reseller: null,
} as const;

export type UserRole = keyof typeof roleHierarchy;

export function getDownlineRole(uplineRole: UserRole): UserRole | null {
    return roleHierarchy[uplineRole] || null;
}

export function canCreateRole(uplineRole: UserRole, targetRole: string): boolean {
    const allowed = getDownlineRole(uplineRole);
    return allowed === targetRole;
}
