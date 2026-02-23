import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export const CabangJamaahView: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                setBookings(data.bookings || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Data Server Jamaah</h1>
                <p style={{ color: 'var(--color-text-light)' }}>Pantau seluruh data jamaah dari Cabang Anda beserta jaringannya.</p>
            </div>

            <div style={{ backgroundColor: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jamaah / KTP</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kontak</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paket (ID)</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Pay</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Status Berkas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Memuat data jamaah...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Belum ada data jamaah.</td></tr>
                        ) : bookings.map((b) => (
                            <tr key={b.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{b.pilgrim?.name || 'Anon'}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{b.pilgrim?.noKtp || '-'}</p>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>{b.pilgrim?.phone || '-'}</td>
                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{b.departureId?.substring(0, 8)}</td>
                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                                        backgroundColor: b.paymentStatus === 'paid' ? 'rgba(22, 163, 74, 0.15)' : b.paymentStatus === 'partial' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                                        color: b.paymentStatus === 'paid' ? '#4ade80' : b.paymentStatus === 'partial' ? '#fbbf24' : '#f87171'
                                    }}>
                                        {b.paymentStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                                        backgroundColor: 'rgba(12, 165, 233, 0.15)', color: '#38bdf8'
                                    }}>
                                        {b.bookingStatus.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
