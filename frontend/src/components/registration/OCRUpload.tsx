import React, { useState } from 'react';

interface OCRUploadProps {
    docType: 'ktp' | 'passport';
    onSuccess: (data: any) => void;
}

const OCRUpload: React.FC<OCRUploadProps> = ({ docType, onSuccess }) => {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            // Auto upload for convenience in registration
            triggerUpload(e.target.files[0]);
        }
    };

    const triggerUpload = async (fileToUpload: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('pilgrimId', 'new_registration'); // Backend needs a ref, but for new reg we can use a placeholder or handle it
        formData.append('docType', docType);

        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8787';
            const res = await fetch(`${apiBase}/api/documents/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success && data.ocr) {
                onSuccess(data.ocr);
            }
        } catch (error) {
            console.error('OCR Upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-brand-primary/5 border-2 border-dashed border-brand-primary/20 rounded-2xl p-6 text-center group hover:bg-brand-primary/10 transition-all cursor-pointer relative overflow-hidden">
            <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={handleFileChange}
                accept="image/*,application/pdf"
            />
            {uploading ? (
                <div className="space-y-3">
                    <div className="animate-spin h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm font-bold text-brand-primary animate-pulse">Sedang Memproses OCR...</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-brand-primary shadow-sm group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-800">Scan {docType === 'ktp' ? 'KTP' : 'Paspor'} Anda</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Foto atau Upload PDF untuk isi data otomatis</p>
                </div>
            )}

            {/* Glow effect on hover */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
    );
};

export default OCRUpload;
