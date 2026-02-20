import { R2Bucket } from '@cloudflare/workers-types';

export class StorageService {
    static async upload(bucket: R2Bucket, key: string, file: ArrayBuffer | Blob, contentType?: string) {
        return await bucket.put(key, file, {
            httpMetadata: { contentType: contentType || 'application/octet-stream' }
        });
    }

    static async getFile(bucket: R2Bucket, key: string) {
        return await bucket.get(key);
    }

    static async deleteFile(bucket: R2Bucket, key: string) {
        return await bucket.delete(key);
    }
}

export class OCRService {
    static async extractData(file: ArrayBuffer, type: 'ktp' | 'passport') {
        // Mock implementation for Phase 5 development
        // Wait 2 seconds to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (type === 'ktp') {
            return {
                nik: '3273' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0'),
                name: 'MOHAMMAD TESTER',
                address: 'Jl. Raya Kebahagiaan No. 88, Jakarta Selatan',
                born: '1985-05-20',
                sex: 'L',
                fatherName: 'TESTER SENIOR'
            };
        }

        return {
            passportNo: 'C' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0'),
            name: 'MOHAMMAD TESTER',
            passportFrom: 'Jakarta Selatan',
            passportReleaseDate: '2022-01-10',
            passportExpiry: '2032-01-10',
        };
    }
}
