import * as XLSX from 'xlsx';

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

    /**
     * Generate Full Excel Workbook (4 Sheets: Manifest, Roomlist L, Roomlist P, Ringkasan)
     */
    static generateManifestExcel(bookingsWithData: any[], departureInfo?: any): Uint8Array {
        const wb = XLSX.utils.book_new();

        // ----------------- SHEET 1: MANIFEST LENGKAP -----------------
        const manifestRows = bookingsWithData.map((b, i) => ({
            'No': i + 1,
            'Kode Booking': b.id ? b.id.substring(0, 8).toUpperCase() : '-',
            'Nama Lengkap': b.pilgrim?.name?.toUpperCase() || '-',
            'NIK': b.pilgrim?.noKtp ? `'${b.pilgrim.noKtp}` : '-',
            'Jenis Kelamin': b.pilgrim?.sex === 'L' ? 'Laki-laki' : 'Perempuan',
            'Tanggal Lahir': b.pilgrim?.born || '-',
            'No Paspor': b.pilgrim?.noPassport || '-',
            'Kantor Paspor': b.pilgrim?.passportFrom || '-',
            'Tgl Terbit Paspor': b.pilgrim?.passportReleaseDate || '-',
            'Masa Berlaku Paspor': b.pilgrim?.passportExpiry || '-',
            'Status Pernikahan': b.pilgrim?.maritalStatus || '-',
            'Alamat': b.pilgrim?.address || '-',
            'No HP': b.pilgrim?.phone || '-',
            'Nama Ayah': b.pilgrim?.fatherName || '-',
            'Pekerjaan': b.pilgrim?.work || '-',
            'Pendidikan': b.pilgrim?.lastEducation || '-',
            'Tipe Kamar': b.roomType?.name || 'Double',
            'No Kamar': b.roomAssignment?.roomNumber || '-',
            'Catatan Kamar': b.roomAssignment?.notes || '-',
            'Status Bayar': (b.paymentStatus || 'unpaid').toUpperCase()
        }));

        const wsManifest = XLSX.utils.json_to_sheet(manifestRows);
        wsManifest['!cols'] = [
            { wch: 5 },  // No
            { wch: 14 }, // Kode Booking
            { wch: 30 }, // Nama Lengkap
            { wch: 20 }, // NIK
            { wch: 14 }, // Jenis Kelamin
            { wch: 14 }, // Tanggal Lahir
            { wch: 14 }, // No Paspor
            { wch: 16 }, // Kantor Paspor
            { wch: 16 }, // Tgl Terbit
            { wch: 16 }, // Masa Berlaku
            { wch: 16 }, // Status Nikah
            { wch: 35 }, // Alamat
            { wch: 16 }, // No HP
            { wch: 25 }, // Nama Ayah
            { wch: 18 }, // Pekerjaan
            { wch: 14 }, // Pendidikan
            { wch: 14 }, // Tipe Kamar
            { wch: 12 }, // No Kamar
            { wch: 20 }, // Catatan Kamar
            { wch: 14 }  // Status Bayar
        ];
        XLSX.utils.book_append_sheet(wb, wsManifest, 'Manifest');

        // Helper to build Roomlist rows for a gender
        const buildRoomlistRows = (gender: 'L' | 'P') => {
            const filtered = bookingsWithData.filter(b => b.pilgrim?.sex === gender);
            // Group by Room Type
            const roomTypeGroups: Record<string, any[]> = {};
            filtered.forEach(b => {
                const rtName = b.roomType?.name || 'Quad';
                if (!roomTypeGroups[rtName]) roomTypeGroups[rtName] = [];
                roomTypeGroups[rtName].push(b);
            });

            const rows: any[] = [];
            let no = 1;

            Object.entries(roomTypeGroups).forEach(([rtName, items]) => {
                // Group by room number inside room type
                const roomNumGroups: Record<string, any[]> = {};
                items.forEach(item => {
                    const roomNum = item.roomAssignment?.roomNumber || 'Belum Ditentukan';
                    if (!roomNumGroups[roomNum]) roomNumGroups[roomNum] = [];
                    roomNumGroups[roomNum].push(item);
                });

                Object.entries(roomNumGroups).forEach(([roomNum, roomPax]) => {
                    roomPax.forEach((pax, idxInRoom) => {
                        rows.push({
                            'No': no++,
                            'Tipe Kamar': rtName,
                            'No Kamar': roomNum,
                            'Slot': `${idxInRoom + 1}/${pax.roomType?.capacity || 4}`,
                            'Nama Jamaah': pax.pilgrim?.name?.toUpperCase() || '-',
                            'No Paspor': pax.pilgrim?.noPassport || '-',
                            'No HP': pax.pilgrim?.phone || '-',
                            'Catatan': pax.roomAssignment?.notes || '-'
                        });
                    });
                });
            });

            return rows;
        };

        // ----------------- SHEET 2: ROOMLIST LAKI-LAKI -----------------
        const rowsL = buildRoomlistRows('L');
        const wsRoomL = XLSX.utils.json_to_sheet(rowsL.length ? rowsL : [{ 'Keterangan': 'Belum ada data jamaah laki-laki' }]);
        wsRoomL['!cols'] = [{ wch: 5 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 16 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsRoomL, 'Roomlist Laki-laki');

        // ----------------- SHEET 3: ROOMLIST PEREMPUAN -----------------
        const rowsP = buildRoomlistRows('P');
        const wsRoomP = XLSX.utils.json_to_sheet(rowsP.length ? rowsP : [{ 'Keterangan': 'Belum ada data jamaah perempuan' }]);
        wsRoomP['!cols'] = [{ wch: 5 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 16 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsRoomP, 'Roomlist Perempuan');

        // ----------------- SHEET 4: RINGKASAN -----------------
        const roomTypeCounts: Record<string, { capacity: number; male: number; female: number }> = {};
        bookingsWithData.forEach(b => {
            const rtName = b.roomType?.name || 'Quad';
            const cap = b.roomType?.capacity || 4;
            if (!roomTypeCounts[rtName]) {
                roomTypeCounts[rtName] = { capacity: cap, male: 0, female: 0 };
            }
            if (b.pilgrim?.sex === 'L') roomTypeCounts[rtName].male++;
            else roomTypeCounts[rtName].female++;
        });

        const summaryRows: any[] = Object.entries(roomTypeCounts).map(([rtName, counts]) => {
            const totalPax = counts.male + counts.female;
            const maleRooms = Math.ceil(counts.male / (counts.capacity || 1));
            const femaleRooms = Math.ceil(counts.female / (counts.capacity || 1));
            return {
                'Tipe Kamar': rtName,
                'Kapasitas': `${counts.capacity} Pax`,
                'Laki-laki': counts.male,
                'Perempuan': counts.female,
                'Total Jamaah': totalPax,
                'Kamar Laki-laki': maleRooms,
                'Kamar Perempuan': femaleRooms,
                'Total Kamar Dibutuhkan': maleRooms + femaleRooms
            };
        });

        const totalL = bookingsWithData.filter(b => b.pilgrim?.sex === 'L').length;
        const totalP = bookingsWithData.filter(b => b.pilgrim?.sex === 'P').length;
        summaryRows.push({
            'Tipe Kamar': 'TOTAL KESELURUHAN',
            'Kapasitas': '-',
            'Laki-laki': totalL,
            'Perempuan': totalP,
            'Total Jamaah': totalL + totalP,
            'Kamar Laki-laki': summaryRows.reduce((acc, r) => acc + (r['Kamar Laki-laki'] || 0), 0),
            'Kamar Perempuan': summaryRows.reduce((acc, r) => acc + (r['Kamar Perempuan'] || 0), 0),
            'Total Kamar Dibutuhkan': summaryRows.reduce((acc, r) => acc + (r['Total Kamar Dibutuhkan'] || 0), 0)
        });

        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        wsSummary['!cols'] = [
            { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 22 }
        ];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

        const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        return new Uint8Array(out);
    }

    /**
     * Generate Roomlist Only Excel (2 Sheets: Laki-laki, Perempuan)
     */
    static generateRoomlistExcel(bookingsWithData: any[]): Uint8Array {
        const wb = XLSX.utils.book_new();

        const buildRoomlistRows = (gender: 'L' | 'P') => {
            const filtered = bookingsWithData.filter(b => b.pilgrim?.sex === gender);
            const roomTypeGroups: Record<string, any[]> = {};
            filtered.forEach(b => {
                const rtName = b.roomType?.name || 'Quad';
                if (!roomTypeGroups[rtName]) roomTypeGroups[rtName] = [];
                roomTypeGroups[rtName].push(b);
            });

            const rows: any[] = [];
            let no = 1;

            Object.entries(roomTypeGroups).forEach(([rtName, items]) => {
                const roomNumGroups: Record<string, any[]> = {};
                items.forEach(item => {
                    const roomNum = item.roomAssignment?.roomNumber || 'Belum Ditentukan';
                    if (!roomNumGroups[roomNum]) roomNumGroups[roomNum] = [];
                    roomNumGroups[roomNum].push(item);
                });

                Object.entries(roomNumGroups).forEach(([roomNum, roomPax]) => {
                    roomPax.forEach((pax, idxInRoom) => {
                        rows.push({
                            'No': no++,
                            'Tipe Kamar': rtName,
                            'No Kamar': roomNum,
                            'Slot': `${idxInRoom + 1}/${pax.roomType?.capacity || 4}`,
                            'Nama Jamaah': pax.pilgrim?.name?.toUpperCase() || '-',
                            'No Paspor': pax.pilgrim?.noPassport || '-',
                            'No HP': pax.pilgrim?.phone || '-',
                            'Catatan': pax.roomAssignment?.notes || '-'
                        });
                    });
                });
            });

            return rows;
        };

        const rowsL = buildRoomlistRows('L');
        const wsL = XLSX.utils.json_to_sheet(rowsL.length ? rowsL : [{ 'Keterangan': 'Belum ada data jamaah laki-laki' }]);
        wsL['!cols'] = [{ wch: 5 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 16 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsL, 'Roomlist Laki-laki');

        const rowsP = buildRoomlistRows('P');
        const wsP = XLSX.utils.json_to_sheet(rowsP.length ? rowsP : [{ 'Keterangan': 'Belum ada data jamaah perempuan' }]);
        wsP['!cols'] = [{ wch: 5 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 16 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsP, 'Roomlist Perempuan');

        const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        return new Uint8Array(out);
    }

    /**
     * Generate Empty Template Excel for Import with sample rows and instructions
     */
    static generateTemplateExcel(): Uint8Array {
        const wb = XLSX.utils.book_new();

        // 1. Template Sheet with 2 Sample Rows
        const templateData = [
            {
                'Nama Lengkap*': 'Ahmad Fauzi',
                'NIK (16 Digit)*': "'3201011205850001",
                'Jenis Kelamin (L/P)*': 'L',
                'Tanggal Lahir (YYYY-MM-DD)*': '1985-05-12',
                'Alamat*': 'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan',
                'Nama Ayah*': 'Fauzi Abdullah',
                'No HP*': '081234567890',
                'Status Pernikahan*': 'Menikah',
                'Pekerjaan*': 'Wiraswasta',
                'Pendidikan Terakhir*': 'S1',
                'No Paspor': 'A12345678',
                'Kantor Penerbit Paspor': 'Jakarta Selatan',
                'Tgl Terbit Paspor (YYYY-MM-DD)': '2022-01-10',
                'Masa Berlaku Paspor (YYYY-MM-DD)': '2032-01-10',
                'Tipe Kamar (Quad/Triple/Double)': 'Quad',
                'No Kamar': '101'
            },
            {
                'Nama Lengkap*': 'Siti Aminah',
                'NIK (16 Digit)*': "'3201016508900002",
                'Jenis Kelamin (L/P)*': 'P',
                'Tanggal Lahir (YYYY-MM-DD)*': '1990-08-25',
                'Alamat*': 'Jl. Mawar No. 4, Gubeng, Surabaya',
                'Nama Ayah*': 'Hasan Basri',
                'No HP*': '081398765432',
                'Status Pernikahan*': 'Menikah',
                'Pekerjaan*': 'Guru',
                'Pendidikan Terakhir*': 'S1',
                'No Paspor': 'B87654321',
                'Kantor Penerbit Paspor': 'Surabaya',
                'Tgl Terbit Paspor (YYYY-MM-DD)': '2023-03-15',
                'Masa Berlaku Paspor (YYYY-MM-DD)': '2033-03-15',
                'Tipe Kamar (Quad/Triple/Double)': 'Quad',
                'No Kamar': '201'
            }
        ];

        const wsTemplate = XLSX.utils.json_to_sheet(templateData);
        wsTemplate['!cols'] = [
            { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 35 },
            { wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 20 },
            { wch: 16 }, { wch: 22 }, { wch: 25 }, { wch: 25 }, { wch: 28 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Manifest');

        // 2. Petunjuk Pengisian Sheet
        const instructions = [
            { 'Kolom': 'Nama Lengkap*', 'Wajib': 'YA', 'Format / Pilihan': 'Teks bebas (minimal 3 huruf)', 'Keterangan': 'Nama sesuai KTP / Paspor jamaah' },
            { 'Kolom': 'NIK (16 Digit)*', 'Wajib': 'YA', 'Format / Pilihan': '16 Digit Angka (awali dengan tanda petik tunggal agar tidak terpotong Excel)', 'Keterangan': 'Nomor Induk Kependudukan. Jika NIK sudah terdaftar, data jamaah akan diupdate.' },
            { 'Kolom': 'Jenis Kelamin (L/P)*', 'Wajib': 'YA', 'Format / Pilihan': 'L atau P (atau Laki-laki / Perempuan)', 'Keterangan': 'Digunakan untuk grouping Roomlist hotel dan Manifest maskapai' },
            { 'Kolom': 'Tanggal Lahir*', 'Wajib': 'YA', 'Format / Pilihan': 'YYYY-MM-DD (Contoh: 1985-05-12)', 'Keterangan': 'Format tahun-bulan-tanggal' },
            { 'Kolom': 'Alamat*', 'Wajib': 'YA', 'Format / Pilihan': 'Teks alamat lengkap', 'Keterangan': 'Alamat domisili jamaah' },
            { 'Kolom': 'Nama Ayah*', 'Wajib': 'YA', 'Format / Pilihan': 'Teks nama ayah kandung', 'Keterangan': 'Dibutuhkan untuk SISKOPATUH & Paspor/Visa' },
            { 'Kolom': 'No HP*', 'Wajib': 'YA', 'Format / Pilihan': 'Nomor HP aktif (Contoh: 081234567890)', 'Keterangan': 'Nomor WhatsApp / telepon jamaah' },
            { 'Kolom': 'Status Pernikahan*', 'Wajib': 'YA', 'Format / Pilihan': 'Belum Menikah / Menikah / Cerai', 'Keterangan': 'Pilih salah satu status pernikahan' },
            { 'Kolom': 'Pekerjaan*', 'Wajib': 'YA', 'Format / Pilihan': 'Teks pekerjaan (PNS, Swasta, dll)', 'Keterangan': 'Pekerjaan utama jamaah' },
            { 'Kolom': 'Pendidikan Terakhir*', 'Wajib': 'YA', 'Format / Pilihan': 'SD / SMP / SMA / D3 / S1 / S2 / S3', 'Keterangan': 'Pendidikan terakhir jamaah' },
            { 'Kolom': 'No Paspor', 'Wajib': 'TIDAK', 'Format / Pilihan': 'Nomor Paspor (Contoh: A12345678)', 'Keterangan': 'Kosongkan jika paspor belum terbit' },
            { 'Kolom': 'Kantor Penerbit Paspor', 'Wajib': 'TIDAK', 'Format / Pilihan': 'Nama Kantor Imigrasi', 'Keterangan': 'Contoh: Jakarta Selatan, Surabaya' },
            { 'Kolom': 'Tgl Terbit Paspor', 'Wajib': 'TIDAK', 'Format / Pilihan': 'YYYY-MM-DD (Contoh: 2022-01-10)', 'Keterangan': 'Tanggal paspor dikeluarkan' },
            { 'Kolom': 'Masa Berlaku Paspor', 'Wajib': 'TIDAK', 'Format / Pilihan': 'YYYY-MM-DD (Contoh: 2032-01-10)', 'Keterangan': 'Minimal 6 bulan sebelum tanggal keberangkatan' },
            { 'Kolom': 'Tipe Kamar', 'Wajib': 'TIDAK', 'Format / Pilihan': 'Quad / Triple / Double', 'Keterangan': 'Jika kosong, akan otomatis diset ke Quad' },
            { 'Kolom': 'No Kamar', 'Wajib': 'TIDAK', 'Format / Pilihan': 'Nomor Kamar (Contoh: 101, 201)', 'Keterangan': 'Opsional, bisa diatur nanti di menu Roomlist' }
        ];

        const wsInstructions = XLSX.utils.json_to_sheet(instructions);
        wsInstructions['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 45 }, { wch: 55 }];
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Petunjuk Pengisian');

        const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        return new Uint8Array(out);
    }

    /**
     * Parse Manifest Excel into structured objects
     */
    static parseManifestExcel(buffer: Uint8Array | ArrayBuffer): {
        validRows: any[];
        errors: { row: number; field: string; message: string; data?: any }[];
    } {
        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0]; // First sheet is manifest
        const sheet = wb.Sheets[sheetName];
        if (!sheet) {
            return { validRows: [], errors: [{ row: 0, field: 'sheet', message: 'Sheet manifest tidak ditemukan' }] };
        }

        const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { raw: false, defval: '' });

        const validRows: any[] = [];
        const errors: { row: number; field: string; message: string; data?: any }[] = [];

        // Helper to normalize header lookup
        const findField = (row: Record<string, any>, patterns: string[]): string => {
            const keys = Object.keys(row);
            for (const p of patterns) {
                const foundKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(p.toLowerCase().replace(/[^a-z0-9]/g, '')));
                if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
                    return String(row[foundKey]).trim();
                }
            }
            return '';
        };

        // Helper to format date string to YYYY-MM-DD
        const formatDate = (val: string): string => {
            if (!val) return '';
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
            const dmy = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (dmy) {
                const d = dmy[1].padStart(2, '0');
                const m = dmy[2].padStart(2, '0');
                const y = dmy[3];
                return `${y}-${m}-${d}`;
            }
            const dateObj = new Date(val);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.toISOString().split('T')[0];
            }
            return val;
        };

        rawRows.forEach((row, idx) => {
            const rowNumber = idx + 2; // +2 for 1-indexed & header row
            const hasAnyVal = Object.values(row).some(v => String(v).trim() !== '');
            if (!hasAnyVal) return;

            const name = findField(row, ['namalengkap', 'nama', 'paxname']);
            let noKtp = findField(row, ['nik', 'noktp', 'ktp']).replace(/[^0-9]/g, '');
            const sexRaw = findField(row, ['jeniskelamin', 'sex', 'gender', 'jk']).toUpperCase();
            let born = formatDate(findField(row, ['tanggallahir', 'tgllahir', 'born', 'dob']));
            const address = findField(row, ['alamat', 'address']) || '-';
            const fatherName = findField(row, ['namaayah', 'ayah', 'father']) || 'Hamba Allah';
            const phone = findField(row, ['nohp', 'phone', 'telepon', 'hp', 'wa']) || '-';
            const maritalStatusRaw = findField(row, ['statuspernikahan', 'statusnikah', 'maritalstatus']);
            const work = findField(row, ['pekerjaan', 'work', 'job']) || 'Swasta';
            const lastEducation = findField(row, ['pendidikan', 'education']) || 'SMA';

            const noPassport = findField(row, ['nopaspor', 'paspor', 'passportno']);
            const passportFrom = findField(row, ['kantorpaspor', 'kantorpenerbit', 'issuingoffice']);
            const passportReleaseDate = formatDate(findField(row, ['tglterbitpaspor', 'tglterbit', 'releasedate']));
            const passportExpiry = formatDate(findField(row, ['masaberlakupaspor', 'expirydate', 'tglberlaku']));

            const roomTypeName = findField(row, ['tipekamar', 'roomtype']) || 'Quad';
            const roomNumber = findField(row, ['nokamar', 'roomnumber', 'kamar']);

            // Validations
            if (!name || name.length < 2) {
                errors.push({ row: rowNumber, field: 'name', message: 'Nama lengkap wajib diisi minimal 2 karakter', data: row });
                return;
            }

            if (!noKtp || (noKtp.length !== 16 && noKtp.length !== 15)) {
                if (!noKtp) {
                    errors.push({ row: rowNumber, field: 'noKtp', message: 'NIK wajib diisi', data: row });
                    return;
                } else if (noKtp.length < 10) {
                    errors.push({ row: rowNumber, field: 'noKtp', message: `NIK tidak valid (${noKtp}): harus 16 digit`, data: row });
                    return;
                }
            }

            // Normalize sex
            let sex: 'L' | 'P' = 'L';
            if (sexRaw.startsWith('P') || sexRaw.includes('PEREMPUAN') || sexRaw.includes('FEMALE') || sexRaw === 'F') {
                sex = 'P';
            } else if (sexRaw.startsWith('L') || sexRaw.includes('LAKI') || sexRaw.includes('MALE') || sexRaw === 'M') {
                sex = 'L';
            } else {
                errors.push({ row: rowNumber, field: 'sex', message: 'Jenis Kelamin harus L atau P', data: row });
                return;
            }

            // Normalize marital status
            let maritalStatus: 'Belum Menikah' | 'Menikah' | 'Cerai' = 'Menikah';
            if (maritalStatusRaw.toLowerCase().includes('belum')) {
                maritalStatus = 'Belum Menikah';
            } else if (maritalStatusRaw.toLowerCase().includes('cerai')) {
                maritalStatus = 'Cerai';
            }

            if (!born) {
                born = '1980-01-01';
            }

            validRows.push({
                rowNumber,
                name,
                noKtp,
                sex,
                born,
                address,
                fatherName,
                phone,
                maritalStatus,
                work,
                lastEducation,
                hasPassport: !!noPassport,
                noPassport: noPassport || null,
                passportFrom: passportFrom || null,
                passportReleaseDate: passportReleaseDate || null,
                passportExpiry: passportExpiry || null,
                famContactName: name,
                famContact: phone,
                sourceFrom: 'Import Manifest Excel',
                roomTypeName,
                roomNumber
            });
        });

        return { validRows, errors };
    }
}
