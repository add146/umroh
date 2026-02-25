import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';

interface DigitalCardProps {
    name: string;
    role: string;
    affiliateCode: string;
    phone?: string;
}

export const DigitalCard: React.FC<DigitalCardProps> = ({ name, role, affiliateCode, phone }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const dataUrl = await htmlToImage.toPng(cardRef.current, {
                quality: 1.0,
                pixelRatio: 3 // Higher resolution for crisp print
            });
            const link = document.createElement('a');
            link.download = `KartuNama_${name.replace(/\s+/g, '_')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate card image', err);
            alert('Gagal mengunduh kartu nama. Coba lagi.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>

            {/* The Actual Card Container */}
            <div
                ref={cardRef}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    aspectRatio: '1.586 / 1', // Standard Business Card Ratio
                    background: 'linear-gradient(135deg, #1f1d1a 0%, #0a0907 100%)',
                    borderRadius: '1rem',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.5rem'
                }}
            >
                {/* Decorative Elements */}
                <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(200,168,81,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #a88a36 0%, #d4b86a 50%, #a88a36 100%)' }} />

                {/* Top Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0, letterSpacing: '0.05em' }}>AL MADINAH</h2>
                        <p style={{ fontSize: '0.65rem', color: 'var(--color-text-light)', letterSpacing: '0.1em', marginTop: '0.1rem' }}>HAJI & UMROH TERINTEGRASI</p>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary-light)', fontSize: '28px', opacity: 0.8 }}>monument</span>
                </div>

                {/* Bottom Section */}
                <div style={{ zIndex: 1 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0, textTransform: 'capitalize' }}>{name || 'Nama Agen'}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.2rem' }}>Official {role}</p>

                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary-dark)' }}>pin</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#fff' }}>{affiliateCode}</span>
                        </div>
                        {phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary-dark)' }}>call</span>
                                <span>{phone}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 }}>
                Ini adalah Kartu Nama Digital resmi Anda. <br />Gunakan tombol di bawah untuk menyimpannya.
            </p>

            <button
                className="btn btn-outline"
                style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={handleDownload}
                disabled={isGenerating}
            >
                {isGenerating ? (
                    <><span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>autorenew</span> Memproses...</>
                ) : (
                    <><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Simpan Gambar</>
                )}
            </button>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
