import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://umroh-api.khibroh.workers.dev';

export type UploadMode = 'imgbb' | 'package';

interface ImageUploaderProps {
    /** Upload mode: 'imgbb' for general images, 'package' for umroh/haji package images (R2 + compression) */
    mode: UploadMode;
    /** Callback when upload completes, receives the image URL */
    onUpload: (url: string) => void;
    /** Current image URL to show as preview */
    currentImage?: string;
    /** Custom label text */
    label?: string;
    /** Custom help text */
    helpText?: string;
    /** Custom max file size in MB (default: 10MB for imgbb, 10MB pre-compression for package) */
    maxSizeMB?: number;
    /** Width of the uploader container */
    width?: string;
    /** Height of the uploader container */
    height?: string;
    /** Whether the uploader is compact (smaller size) */
    compact?: boolean;
}

/**
 * Reusable image upload component.
 * - mode="imgbb": Uploads to imgBB API via backend proxy, returns public URL
 * - mode="package": Compresses client-side, uploads to R2 via backend, returns served URL
 */
export default function ImageUploader({
    mode,
    onUpload,
    currentImage,
    label,
    helpText,
    maxSizeMB = 10,
    width = '100%',
    height = '120px',
    compact = false,
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState('');
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        if (!file.type.startsWith('image/')) {
            setError('File harus berupa gambar (JPEG, PNG, WebP)');
            return;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`Ukuran file maks ${maxSizeMB}MB`);
            return;
        }

        setError('');
        setUploading(true);

        try {
            let fileToUpload: File = file;

            if (mode === 'package') {
                // Compress image client-side before uploading to R2
                setProgress('Mengompres gambar...');
                fileToUpload = await imageCompression(file, {
                    maxSizeMB: 1,          // Target max 1MB
                    maxWidthOrHeight: 1200, // Max 1200px dimension
                    useWebWorker: true,
                    fileType: 'image/jpeg',
                });
                setProgress('Mengunggah ke server...');
            } else {
                setProgress('Mengunggah ke imgBB...');
            }

            // Show local preview immediately
            const localPreviewUrl = URL.createObjectURL(fileToUpload);
            setPreview(localPreviewUrl);

            // Upload via backend
            const formData = new FormData();
            formData.append('image', fileToUpload);

            const { accessToken } = useAuthStore.getState();
            const endpoint = mode === 'imgbb'
                ? '/api/upload/imgbb'
                : '/api/upload/package-image';

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
                },
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: 'Upload gagal' }));
                throw new Error(errData.error || `Upload gagal (${response.status})`);
            }

            const result = await response.json();

            // Get the URL based on mode
            let imageUrl: string;
            if (mode === 'imgbb') {
                imageUrl = result.url; // imgBB display URL
            } else {
                imageUrl = result.url; // R2 served URL (relative path)
            }

            setPreview(imageUrl);
            onUpload(imageUrl);
            setProgress('');
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Gagal mengunggah gambar');
            setPreview(currentImage || null);
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onUpload('');
        setError('');
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && fileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current.files = dt.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    const modeLabel = mode === 'package' ? 'Gambar Paket (Terkompresi)' : 'Gambar (imgBB)';
    const displayLabel = label || modeLabel;
    const displayHelp = helpText || (mode === 'package'
        ? 'Gambar akan dikompresi otomatis (max 1200px, JPEG). Disimpan di server internal.'
        : 'Gambar akan diunggah ke imgBB (hosting gambar gratis).'
    );

    return (
        <div style={{ width }}>
            {!compact && (
                <label style={{
                    display: 'block', fontSize: '0.75rem', fontWeight: 600,
                    color: 'var(--color-text-muted)', marginBottom: '0.375rem',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>{displayLabel}</label>
            )}
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                    width: '100%', height: compact ? '80px' : height,
                    border: preview ? '2px solid var(--color-primary)' : '2px dashed var(--color-border)',
                    borderRadius: compact ? '0.5rem' : '0.75rem',
                    cursor: uploading ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    background: preview
                        ? `url(${preview}) center/cover no-repeat`
                        : 'rgba(255,255,255,0.02)',
                    position: 'relative', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {/* Overlay for images with preview */}
                {preview && !uploading && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s ease',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'white' }}>swap_horiz</span>
                        <button
                            type="button"
                            onClick={handleRemove}
                            style={{
                                position: 'absolute', top: 4, right: 4,
                                background: 'rgba(239,68,68,0.9)', border: 'none',
                                color: 'white', borderRadius: '50%',
                                width: 22, height: 22, cursor: 'pointer',
                                fontSize: '12px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}
                        >✕</button>
                    </div>
                )}

                {/* Uploading state */}
                {uploading && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}>
                        <div style={{
                            width: '24px', height: '24px',
                            border: '3px solid var(--color-primary)',
                            borderTopColor: 'transparent', borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{progress}</span>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* Empty state */}
                {!preview && !uploading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{
                            fontSize: compact ? '20px' : '28px',
                            color: 'var(--color-text-light)',
                        }}>cloud_upload</span>
                        {!compact && (
                            <>
                                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                                    Klik atau seret gambar ke sini
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                                    PNG, JPG, WEBP (Max {maxSizeMB}MB)
                                </span>
                            </>
                        )}
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>
            {error && (
                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.375rem', margin: '0.375rem 0 0 0' }}>{error}</p>
            )}
            {!compact && !error && (
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', marginTop: '0.375rem', margin: '0.375rem 0 0 0' }}>
                    {displayHelp}
                </p>
            )}
        </div>
    );
}
