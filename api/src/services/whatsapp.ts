export class WhatsAppService {
    private static DEFAULT_API_KEY = '060731d7987a4c7ebd23a173a8fdb158';
    private static DEFAULT_BASE_URL = 'https://waha.khibroh.com';
    private static DEFAULT_SESSION = 'default';

    /** Fetch WAHA config from admin user in DB */
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

    /** Start typing indicator via WAHA API */
    static async startTyping(baseUrl: string, apiKey: string, session: string, chatId: string) {
        try {
            await fetch(`${baseUrl}/api/startTyping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey.trim()
                },
                body: JSON.stringify({ chatId, session })
            });
        } catch (err) {
            console.error('Typing indicator error (non-fatal):', err);
        }
    }

    /** Stop typing indicator via WAHA API */
    static async stopTyping(baseUrl: string, apiKey: string, session: string, chatId: string) {
        try {
            await fetch(`${baseUrl}/api/stopTyping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey.trim()
                },
                body: JSON.stringify({ chatId, session })
            });
        } catch (err) {
            // non-fatal
        }
    }

    /** Random delay between min and max milliseconds */
    static delay(minMs: number, maxMs: number): Promise<void> {
        const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Send a single message with typing indicator + delay.
     * Used for both individual send and each iteration of bulk send.
     */
    static async sendMessage(db: any, to: string, message: string) {
        const formattedTo = this.formatPhone(to);
        const chatId = `${formattedTo}@c.us`;

        try {
            const config = await this.getWahaConfig(db);

            // 1. Start typing indicator
            await this.startTyping(config.baseUrl, config.apiKey, config.session, chatId);

            // 2. Wait random 3-8 seconds (simulates human typing)
            await this.delay(3000, 8000);

            // 3. Stop typing
            await this.stopTyping(config.baseUrl, config.apiKey, config.session, chatId);

            // 4. Send the actual message
            const response = await fetch(`${config.baseUrl}/api/sendText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': config.apiKey.trim()
                },
                body: JSON.stringify({
                    chatId,
                    text: message,
                    session: config.session
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('WhatsApp API Error:', errorData);
                return { success: false, error: errorData };
            }

            return { success: true };
        } catch (error) {
            console.error('WhatsApp Service Error:', error);
            return { success: false, error };
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
