import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

const thStyle: React.CSSProperties = {
    padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem',
};
const tdStyle: React.CSSProperties = { padding: '1rem 1.5rem' };

const BookingList: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await apiFetch<{ bookings: any[] }>('/api/bookings');
                setBookings(data.bookings || []);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchBookings();
    }, []);

    const getStatusStyle = (status: string): React.CSSProperties => {
        const base: React.CSSProperties = { padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' };
        if (status === 'paid') return { ...base, background: 'rgba(34,197,94,0.1)', color: '#22c55e' };
        if (status === 'cancelled') return { ...base, background: 'rgba(239,68,68,0.1)', color: '#ef4444' };
        return { ...base, background: 'rgba(234,179,8,0.1)', color: '#eab308' };
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Daftar Booking Jama'ah</h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola dan pantau seluruh pendaftaran paket umroh beserta statusnya.</p>
            </div>

            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={thStyle}>Kode Booking</th>
                            <th style={thStyle}>Jamaah</th>
                            <th style={thStyle}>Paket</th>
                            <th style={thStyle}>Total Harga</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada booking.</td></tr>
                        ) : bookings.map((booking) => (
                            <tr key={booking.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>{booking.id.substring(0, 8).toUpperCase()}</span>
                                </td>
                                <td style={tdStyle}>
                                    <p style={{ fontWeight: 700, color: 'white', margin: '0 0 0.125rem 0' }}>{booking.pilgrim?.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>{booking.pilgrim?.phone}</p>
                                </td>
                                <td style={{ ...tdStyle, fontWeight: 600, color: 'white' }}>{booking.departure?.package?.name}</td>
                                <td style={{ ...tdStyle, fontWeight: 800, color: 'var(--color-primary)' }}>Rp {(booking.totalPrice || 0).toLocaleString('id-ID')}</td>
                                <td style={tdStyle}><span style={getStatusStyle(booking.paymentStatus)}>{booking.paymentStatus}</span></td>
                                <td style={tdStyle}>
                                    <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}>Detail</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingList;
