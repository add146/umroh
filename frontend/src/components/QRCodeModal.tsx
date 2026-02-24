import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    affiliateLink: string;
    affiliateCode: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, affiliateLink, affiliateCode }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    if (!isOpen) return null;

    const handleDownload = () => {
        if (!svgRef.current) return;
        const svgData = new XMLSerializer().serializeToString(svgRef.current);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Setup canvas with high resolution padding
        const size = 300;
        const padding = 40;
        canvas.width = size + (padding * 2);
        canvas.height = size + (padding * 2) + 60; // Extra room for text

        const img = new Image();
        img.onload = () => {
            if (!ctx) return;
            // Draw background
            ctx.fillStyle = '#0a0907'; // Matches App Dark Theme
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw QR Code
            ctx.drawImage(img, padding, padding, size, size);

            // Draw Text
            ctx.fillStyle = '#c8a851'; // Primary Gold
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('AL MADINAH', canvas.width / 2, size + padding + 35);
            ctx.font = '16px monospace';
            ctx.fillStyle = '#f1f0ee';
            ctx.fillText(affiliateCode, canvas.width / 2, size + padding + 60);

            // Trigger download
            const a = document.createElement('a');
            a.download = `QR_Referral_${affiliateCode}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)' }} onClick={onClose}>
            <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--color-border)', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', position: 'relative' }} onClick={e => e.stopPropagation()}>

                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Kode QR Referral</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Simpan atau tunjukkan untuk scan</p>
                </div>

                <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '1rem' }}>
                    <QRCodeSVG
                        value={affiliateLink}
                        size={220}
                        bgColor={"#ffffff"}
                        fgColor={"#0a0907"}
                        level={"Q"}
                        includeMargin={false}
                        ref={svgRef}
                    />
                </div>

                <div style={{ width: '100%', display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem' }} onClick={onClose}>
                        Tutup
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem' }} onClick={handleDownload}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Simpan
                    </button>
                </div>
            </div>
        </div>
    );
};
