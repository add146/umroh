import React, { useState, useRef } from 'react';
import { compressImage } from '../../lib/imageCompress';

interface OCRUploadProps {
    docType: 'ktp' | 'passport';
    onSuccess: (data: any) => void;
}

const OCRUpload: React.FC<OCRUploadProps> = ({ docType, onSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            triggerUpload(e.target.files[0]);
        }
    };

    const triggerUpload = async (fileToUpload: File) => {
        setUploading(true);
        try {
            const compressedFile = await compressImage(fileToUpload, 0.8);

            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('docType', docType);

            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8787';
            const res = await fetch(`${apiBase}/api/documents/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success && data.ocr) {
                onSuccess(data.ocr);
            } else {
                console.error('OCR response:', data);
            }
        } catch (error) {
            console.error('OCR Upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
            />
            <div
                onClick={handleClick}
                style={{
                    background: 'var(--color-primary-bg)', border: '2px dashed rgba(200,170,100,0.3)',
                    borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                }}
            >
                {uploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>Sedang Memproses OCR...</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-primary)' }}>photo_camera</span>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'white', margin: 0 }}>Scan {docType === 'ktp' ? 'KTP' : 'Paspor'} Anda</p>
                        <p style={{ fontSize: '0.625rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>Foto atau Upload PDF untuk isi data otomatis</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default OCRUpload;
