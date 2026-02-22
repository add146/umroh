import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

const thStyle: React.CSSProperties = {
    padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem',
};
const tdStyle: React.CSSProperties = { padding: '1rem 1.5rem' };

const BookingList: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedBooking, setSelectedBooking] = useState<any>(null);

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
                                    <button
                                        onClick={() => setSelectedBooking(booking)}
                                        style={{ background: 'none', border: '1px solid var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'black'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                                    >
                                        Detail
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Detail Booking */}
            {selectedBooking && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{ backgroundColor: 'rgb(19, 18, 16)', border: '1px solid var(--color-border)', padding: '2rem', borderRadius: '1rem', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Detail Booking</h3>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem', transition: 'color 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Info Reg */}
                            <div style={{ background: '#0a0907', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Kode Booking</p>
                                        <p style={{ fontWeight: 600, fontFamily: 'monospace', color: 'white' }}>{selectedBooking.id.substring(0, 8).toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Status Pembayaran</p>
                                        <span style={getStatusStyle(selectedBooking.paymentStatus)}>{selectedBooking.paymentStatus}</span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Tanggal Booking</p>
                                        <p style={{ fontWeight: 600, color: 'white' }}>{new Date(selectedBooking.createdAt || Date.now()).toLocaleDateString('id-ID')}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Total Harga</p>
                                        <p style={{ fontWeight: 800, color: 'var(--color-primary)' }}>Rp {(selectedBooking.totalPrice || 0).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Jamaah */}
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Data Jamaah</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Nama Lengkap</p>
                                        <p style={{ fontWeight: 500, color: 'white' }}>{selectedBooking.pilgrim?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>No. Handphone</p>
                                        <p style={{ fontWeight: 500, color: 'white' }}>{selectedBooking.pilgrim?.phone || '-'}</p>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>NIK (KTP)</p>
                                        <p style={{ fontWeight: 500, color: 'white' }}>{selectedBooking.pilgrim?.nik || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Paket */}
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Paket & Keberangkatan</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Nama Paket</p>
                                        <p style={{ fontWeight: 500, color: 'white' }}>{selectedBooking.departure?.package?.name || '-'}</p>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Tanggal Berangkat</p>
                                            <p style={{ fontWeight: 500, color: 'white' }}>{selectedBooking.departure?.date ? new Date(selectedBooking.departure.date).toLocaleDateString('id-ID') : '-'}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Sisa Kursi (Keberangkatan)</p>
                                            <p style={{ fontWeight: 500, color: 'white' }}>{selectedBooking.departure?.availableSeats ?? '-'} / {selectedBooking.departure?.totalSeats ?? '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                style={{ padding: '0.625rem 1.5rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'white', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingList;
