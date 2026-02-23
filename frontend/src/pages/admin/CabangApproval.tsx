import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export const CabangApproval: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                // Filter only 'pending' status bookings (marked ready for review by agent)
                // Note: The /api/bookings already returns what's under Cabang
                setBookings(data.bookings?.filter((b: any) => b.bookingStatus === 'pending') || []);
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

    const handleApprove = async (id: string) => {
        if (!window.confirm('Verifikasi data jamaah ini sudah lengkap dan valid?')) return;
        try {
            const res = await apiFetch(`/api/bookings/${id}/approve`, { method: 'POST' });
            if (res.ok) {
                alert('Jamaah berhasil di-approve!');
                fetchBookings();
            } else {
                alert('Gagal memproses approval.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Antrian Approval Jamaah</h1>
                <p style={{ color: 'var(--color-text-light)' }}>Daftar jamaah yang datanya telah diverifikasi (Siap Review) oleh Agen di jaringan Anda.</p>
            </div>

            <div style={{ backgroundColor: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jamaah</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paket (Keberangkatan)</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pembayaran</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi Review</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Memuat antrian approval...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Mantaap! Tidak ada antrian approval.</td></tr>
                        ) : bookings.map((b) => (
                            <tr key={b.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{b.pilgrim?.name || 'Anon'}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{b.pilgrim?.noKtp || '-'}</p>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                                    {b.departureId /* We should expand this data using relations but ID serves as placeholder */}
                                </td>
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
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}
                                        onClick={() => handleApprove(b.id)}
                                    >
                                        Approve
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
