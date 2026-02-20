export class ExportService {
    static async generateSiskopatuhCSV(bookingsWithPilgrims: any[]) {
        // SISKOPATUH Standard Header (Simplified for POC)
        const header = [
            'No', 'Nomor Pendaftaran', 'Nama Lengkap', 'NIK', 'Tempat Lahir', 'Tanggal Lahir',
            'Jenis Kelamin', 'Alamat', 'Nomor HP', 'Pekerjaan', 'Pendidikan'
        ];

        const rows = bookingsWithPilgrims.map((b, i) => [
            i + 1,
            b.id.substring(0, 8).toUpperCase(),
            b.pilgrim.name,
            `'${b.pilgrim.noKtp}`, // Quote to prevent CSV scientific notation
            b.pilgrim.address.split(',')[0], // Approximation of birth place
            b.pilgrim.born,
            b.pilgrim.sex === 'L' ? 'Laki-laki' : 'Perempuan',
            b.pilgrim.address,
            b.pilgrim.phone,
            b.pilgrim.work,
            b.pilgrim.lastEducation
        ]);

        return [header, ...rows].map(row => row.join(',')).join('\n');
    }

    static async generateManifestCSV(bookingsWithPilgrims: any[]) {
        // Flight Manifest Standard Header
        const header = [
            'No', 'Pax Name', 'Passport No', 'Issuing Office', 'Expiry Date', 'Sex', 'Room Type'
        ];

        const rows = bookingsWithPilgrims.map((b, i) => [
            i + 1,
            b.pilgrim.name.toUpperCase(),
            b.pilgrim.noPassport || '-',
            b.pilgrim.passportFrom || '-',
            b.pilgrim.passportExpiry || '-',
            b.pilgrim.sex,
            b.roomType?.name || '-'
        ]);

        return [header, ...rows].map(row => row.join(',')).join('\n');
    }
}
