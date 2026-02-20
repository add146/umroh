
export interface SendMessageOptions {
    to: string;
    text: string;
}

export class WhatsAppService {
    private url: string;
    private token: string;

    constructor(url: string, token: string) {
        this.url = url;
        this.token = token;
    }

    async sendMessage({ to, text }: SendMessageOptions): Promise<boolean> {
        if (!this.url || !this.token) {
            console.warn('WhatsApp service not configured (URL or TOKEN missing)');
            return false;
        }

        // Clean phone number (remove +, spaces, leading 0 -> 62)
        let cleanTo = to.replace(/\D/g, '');
        if (cleanTo.startsWith('0')) {
            cleanTo = '62' + cleanTo.substring(1);
        }

        try {
            const response = await fetch(`${this.url}/api/sendText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    chatId: `${cleanTo}@c.us`,
                    text: text,
                    session: 'default' // Default session for WAHA
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error(`WAHA error: ${response.status} - ${error}`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('WhatsApp service exception:', error);
            return false;
        }
    }

    static formatManualPaymentMessage(
        jamaahName: string,
        invoiceCode: string,
        amount: number,
        banks: { bankName: string; accountNumber: string; accountHolder: string }[]
    ): string {
        const bankInfo = banks.map(b => `*${b.bankName}*\nNo Rek: ${b.accountNumber}\na/n ${b.accountHolder}`).join('\n\n');

        return `Assalamu'alaikum Wr. Wb., Bapak/Ibu *${jamaahName}*.\n\n` +
            `Terima kasih telah melakukan pendaftaran Umroh.\n` +
            `Berikut adalah informasi pembayaran untuk invoice *${invoiceCode}*:\n\n` +
            `*Total Tagihan: Rp ${amount.toLocaleString('id-ID')}*\n\n` +
            `Silakan melakukan transfer ke salah satu rekening berikut:\n\n` +
            `${bankInfo}\n\n` +
            `Setelah melakukan transfer, silakan unggah bukti pembayarannya melalui link dashboard jamaah atau balas pesan ini.\n\n` +
            `Jazakumullah Khairan Katsiran.`;
    }
}
