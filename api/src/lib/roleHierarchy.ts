export const roleHierarchy: Record<string, string[]> = {
    pusat: ['cabang'],
    cabang: ['mitra', 'agen'],
    mitra: ['agen'],
    agen: ['reseller'],
    reseller: [],
};

export type UserRole = keyof typeof roleHierarchy;

export function getAllowedDownlineRoles(uplineRole: string): string[] {
    return roleHierarchy[uplineRole] || [];
}

export function getDefaultDownlineRole(uplineRole: string): string | null {
    const allowed = roleHierarchy[uplineRole];
    return allowed && allowed.length > 0 ? allowed[0] : null;
}

export function canCreateRole(uplineRole: string, targetRole: string): boolean {
    const allowed = getAllowedDownlineRoles(uplineRole);
    return allowed.includes(targetRole);
}
