export function normalizePhone(raw: string): string {
    if (!raw) return '';
    // Remove all non-digit characters (spaces, dashes, parentheses, plus signs)
    let cleaned = raw.replace(/\D/g, '');

    // Default country code: Indonesia (62)
    // If starts with 0 (e.g., 0812...), replace 0 with 62
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    }

    // In case someone inputs the plus sign without country code, but replace(/\D/) already stripped the plus
    // So 628... is already handled

    return cleaned;
}

export function isPhoneNumber(str: string): boolean {
    // If it contains @, it's definitely an email
    if (str.includes('@')) return false;

    // Otherwise, check if it's mostly digits
    const cleaned = str.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 15;
}

export function formatWALink(phone: string, text?: string): string {
    if (!phone) return '';
    const normalized = normalizePhone(phone);
    const url = `https://wa.me/${normalized}`;
    return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}
