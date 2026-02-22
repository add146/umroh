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

            <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Jamaah / KTP</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Kontak</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Paket (ID)</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Status Pay</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'right' }}>Status Berkas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Belum ada data jamaah.</td></tr>
                        ) : bookings.map((b) => (
                            <tr key={b.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.pilgrim?.name || 'Anon'}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{b.pilgrim?.noKtp || '-'}</p>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{b.pilgrim?.phone || '-'}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{b.departureId?.substring(0, 8)}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                                        backgroundColor: b.paymentStatus === 'paid' ? '#dcfce7' : b.paymentStatus === 'partial' ? '#fef08a' : '#fee2e2',
                                        color: b.paymentStatus === 'paid' ? '#166534' : b.paymentStatus === 'partial' ? '#854d0e' : '#991b1b'
                                    }}>
                                        {b.paymentStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                                        backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600
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
