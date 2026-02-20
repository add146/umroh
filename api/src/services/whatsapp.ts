export class WhatsAppService {
    private static API_KEY = '060731d7987a4c7ebd23a173a8fdb158';
    private static BASE_URL = 'https://waha.khibroh.com';
    private static SESSION = 'default';

    static async sendMessage(to: string, message: string) {
        const formattedTo = to.startsWith('0') ? '62' + to.substring(1) : to;

        try {
            const response = await fetch(`${this.BASE_URL}/api/sendText`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.API_KEY.trim()
                },
                body: JSON.stringify({
                    chatId: `${formattedTo}@c.us`,
                    text: message,
                    session: this.SESSION
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

    static async sendBookingConfirmation(to: string, data: { name: string, bookingId: string, packageName: string, amount: string }) {
        const message = `*Konfirmasi Pendaftaran Umroh*\n\n` +
            `Assalamu'alaikum Wr. Wb. Bapak/Ibu *${data.name}*,\n\n` +
            `Terima kasih telah melakukan pendaftaran untuk paket:\n` +
            `*${data.packageName}*\n\n` +
            `ID Booking Anda: *#${data.bookingId.substring(0, 8).toUpperCase()}*\n` +
            `Total yang harus dibayar: *Rp ${data.amount}*\n\n` +
            `Silakan selesaikan pembayaran DP Anda untuk mengamankan kursi Anda.\n\n` +
            `Terima kasih.\n` +
            `*AL MADINAH UMROH*`;

        return await this.sendMessage(to, message);
    }

    static async sendPaymentReceipt(to: string, data: { name: string, amount: string, invoiceId: string }) {
        const message = `*Bukti Pembayaran Diterima*\n\n` +
            `Alhamdulillah, pembayaran Bapak/Ibu *${data.name}* telah kami terima.\n\n` +
            `Nominal: *Rp ${data.amount}*\n` +
            `ID Invoice: *#${data.invoiceId.substring(0, 8).toUpperCase()}*\n\n` +
            `Status Pembayaran: *BERHASIL*\n\n` +
            `Terima kasih telah mempercayai layanan kami.\n` +
            `*AL MADINAH UMROH*`;

        return await this.sendMessage(to, message);
    }
}
