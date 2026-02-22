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

            <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Jamaah</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Paket (Keberangkatan)</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Pembayaran</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'right' }}>Aksi Review</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Mantaap! Tidak ada antrian approval.</td></tr>
                        ) : bookings.map((b) => (
                            <tr key={b.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.pilgrim?.name || 'Anon'}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{b.pilgrim?.noKtp || '-'}</p>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {b.departureId /* We should expand this data using relations but ID serves as placeholder */}
                                </td>
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
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#3b82f6' }}
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
