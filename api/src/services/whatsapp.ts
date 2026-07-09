export class WhatsAppService {
    private static DEFAULT_API_KEY = '060731d7987a4c7ebd23a173a8fdb158';
    private static DEFAULT_BASE_URL = 'https://waha.khibroh.com';
    private static DEFAULT_SESSION = 'default';

    /** Fetch Evolution API config from admin user in DB */
    static async getWahaConfig(db: any) {
        const { eq } = await import('drizzle-orm');
        const { users } = await import('../db/schema.js');
        const admin = await db.query.users.findFirst({
            where: eq(users.role, 'pusat')
        });

        return {
            apiKey: admin?.wahaApiKey || this.DEFAULT_API_KEY,
            baseUrl: admin?.wahaApiUrl || this.DEFAULT_BASE_URL,
            session: admin?.wahaSession || this.DEFAULT_SESSION,
        };
    }

    /** Format phone number to international format */
    static formatPhone(phone: string): string {
        return phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    }

    /** ── Evolution API Helpers ─────────────────────────────── */

    /** Get QR code for an instance (Evolution API) */
    static async getQRCode(baseUrl: string, apiKey: string, instanceName: string) {
        const res = await fetch(`${baseUrl}/instance/fetchInstances`, {
            headers: { 'apikey': apiKey.trim(), 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Gagal menghubungi Evolution API');

        // Try connect endpoint which returns QR
        const connectRes = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
            headers: { 'apikey': apiKey.trim() }
        });
        if (!connectRes.ok) {
            const err = await connectRes.json().catch(() => ({}));
            throw new Error(err.message || 'Gagal mendapatkan QR code');
        }
        const data = await connectRes.json();
        return data; // { base64, code, count, pairingCode }
    }

    /** Get instance connection state */
    static async getConnectionState(baseUrl: string, apiKey: string, instanceName: string) {
        const res = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
            headers: { 'apikey': apiKey.trim() }
        });
        if (!res.ok) throw new Error('Gagal mendapatkan status koneksi');
        return res.json();
    }

    /** Logout / disconnect instance */
    static async logoutInstance(baseUrl: string, apiKey: string, instanceName: string) {
        const res = await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': apiKey.trim() }
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Gagal logout dari WhatsApp');
        }
        return res.json();
    }

    /**
     * Send message via Evolution API
     * POST /message/sendText/{instance}
     */
    static async sendMessage(db: any, to: string, message: string) {
        const formattedTo = this.formatPhone(to);

        try {
            const config = await this.getWahaConfig(db);

            const response = await fetch(`${config.baseUrl}/message/sendText/${config.session}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': config.apiKey.trim()
                },
                body: JSON.stringify({
                    number: formattedTo,
                    text: message,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Evolution API Error:', errorData);
                return { success: false, error: errorData.message || JSON.stringify(errorData) };
            }

            return { success: true };
        } catch (error: any) {
            console.error('WhatsApp Service Error:', error);
            return { success: false, error: error.message };
        }
    }

    static async sendBookingConfirmation(db: any, to: string, data: { name: string, bookingId: string, packageName: string, amount: string }) {
        const message = `*Konfirmasi Pendaftaran Umroh*\n\n` +
            `Assalamu'alaikum Wr. Wb. Bapak/Ibu *${data.name}*,\n\n` +
            `Terima kasih telah melakukan pendaftaran untuk paket:\n` +
            `*${data.packageName}*\n\n` +
            `ID Booking Anda: *#${data.bookingId.substring(0, 8).toUpperCase()}*\n` +
            `Total yang harus dibayar: *Rp ${data.amount}*\n\n` +
            `Silakan selesaikan pembayaran DP Anda untuk mengamankan kursi Anda.\n\n` +
            `Terima kasih.\n` +
            `*AL MADINAH UMROH*`;

        return await this.sendMessage(db, to, message);
    }

    static async sendPaymentReceipt(db: any, to: string, data: { name: string, amount: string, invoiceId: string }) {
        const message = `*Bukti Pembayaran Diterima*\n\n` +
            `Alhamdulillah, pembayaran Bapak/Ibu *${data.name}* telah kami terima.\n\n` +
            `Nominal: *Rp ${data.amount}*\n` +
            `ID Invoice: *#${data.invoiceId.substring(0, 8).toUpperCase()}*\n\n` +
            `Status Pembayaran: *BERHASIL*\n\n` +
            `Terima kasih telah mempercayai layanan kami.\n` +
            `*AL MADINAH UMROH*`;

        return await this.sendMessage(db, to, message);
    }

    static async sendEquipmentDeliveryNotification(db: any, to: string, data: { name: string, packageName: string }) {
        const message = `*Pemberitahuan Penyerahan Perlengkapan*\n\n` +
            `Assalamu'alaikum Wr. Wb. Bapak/Ibu *${data.name}*,\n\n` +
            `Alhamdulillah, seluruh perlengkapan jamaah untuk keberangkatan paket *${data.packageName}* telah kami serahkan dan Anda terima dengan baik.\n\n` +
            `Semoga ibadah Bapak/Ibu berjalan lancar dan mabrur.\n\n` +
            `Terima kasih.\n` +
            `*AL MADINAH UMROH*`;

        return await this.sendMessage(db, to, message);
    }
}
