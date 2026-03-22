import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { BroadcastModal } from '../../components/BroadcastModal';

const thStyle: React.CSSProperties = {
    padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem',
};
const tdStyle: React.CSSProperties = { padding: '1rem 1.5rem' };

const BookingList: React.FC = () => {
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'jamaah' | 'stats'>('jamaah');

    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bRes, sRes] = await Promise.all([
                    apiFetch<{ bookings: any[] }>('/api/bookings'),
                    (user?.role !== 'pusat' && user?.role !== 'reseller')
                        ? apiFetch<{ stats: any[] }>('/api/bookings/stats/downline')
                        : Promise.resolve({ stats: [] })
                ]);
                setBookings(bRes.bookings || []);
                setStats(sRes.stats || []);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [user?.role]);

    const getStatusStyle = (status: string): React.CSSProperties => {
        const base: React.CSSProperties = { padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' };
        if (status === 'paid') return { ...base, background: 'rgba(34,197,94,0.1)', color: '#22c55e' };
        if (status === 'cancelled') return { ...base, background: 'rgba(239,68,68,0.1)', color: '#ef4444' };
        return { ...base, background: 'rgba(234,179,8,0.1)', color: '#eab308' };
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === bookings.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(bookings.map(b => b.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBroadcastSuccess = () => {
        setShowBroadcastModal(false);
        setSelectedIds(new Set());
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Daftar Booking Jama'ah</h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola dan pantau seluruh pendaftaran paket umroh beserta statusnya.</p>
            </div>

            {user?.role !== 'pusat' && user?.role !== 'reseller' && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setActiveTab('jamaah')}
                        style={{
                            background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
                            fontSize: '0.9375rem', fontWeight: 600, transition: 'all 0.2s',
                            color: activeTab === 'jamaah' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderBottom: activeTab === 'jamaah' ? '2px solid var(--color-primary)' : '2px solid transparent'
                        }}
                    >
                        Jamaah Saya
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        style={{
                            background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
                            fontSize: '0.9375rem', fontWeight: 600, transition: 'all 0.2s',
                            color: activeTab === 'stats' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderBottom: activeTab === 'stats' ? '2px solid var(--color-primary)' : '2px solid transparent'
                        }}
                    >
                        Statistik Downline
                    </button>
                </div>
            )}

            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                {activeTab === 'jamaah' ? (
                    <>
                        {/* Bulk Actions */}
                        {selectedIds.size > 0 && (
                            <div style={{ padding: '1rem 1.5rem', background: 'rgba(37, 211, 102, 0.05)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                    {selectedIds.size} jamaah terpilih
                                </span>
                                <button
                                    onClick={() => setShowBroadcastModal(true)}
                                    className="btn"
                                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#25D366', color: '#fff', fontWeight: 600, border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>campaign</span>
                                    Broadcast WA
                                </button>
                            </div>
                        )}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ ...thStyle, width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            checked={bookings.length > 0 && selectedIds.size === bookings.length}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </th>
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
                                        <td style={{ ...tdStyle, width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(booking.id)}
                                                onChange={() => toggleSelect(booking.id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
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
                    </>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={thStyle}>Nama Downline</th>
                                <th style={thStyle}>Role</th>
                                <th style={thStyle}>Total Jamaah</th>
                                <th style={thStyle}>Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</td></tr>
                            ) : stats.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada data statistik downline.</td></tr>
                            ) : stats.map((st) => (
                                <tr key={st.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ ...tdStyle, fontWeight: 600, color: 'white' }}>{st.name}</td>
                                    <td style={tdStyle}>
                                        <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.25rem', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                                            {st.role}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: 700 }}>{st.totalJamaah} Orang</td>
                                    <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-primary)' }}>Rp {(st.totalRevenue || 0).toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Detail Booking */}
            {selectedBooking && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedBooking(null)} />
                    <div style={{ position: 'relative', background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '95%', maxWidth: '640px', maxHeight: '85vh', overflow: 'auto', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Detail Booking</h2>
                            <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>

                        {/* Booking ID & Status */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Kode Booking</p>
                                <p style={{ margin: '0.25rem 0 0', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{selectedBooking.id?.substring(0, 8).toUpperCase()}</p>
                            </div>
                            <span style={getStatusStyle(selectedBooking.paymentStatus)}>{selectedBooking.paymentStatus}</span>
                        </div>

                        {/* Pilgrim Info */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem 0' }}>Data Jamaah</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Nama Lengkap</p>
                                    <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'white' }}>{selectedBooking.pilgrim?.name || '-'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>No. KTP</p>
                                    <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'white' }}>{selectedBooking.pilgrim?.noKtp || '-'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Telepon</p>
                                    <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'white' }}>{selectedBooking.pilgrim?.phone || '-'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Jenis Kelamin</p>
                                    <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'white' }}>{selectedBooking.pilgrim?.sex === 'L' ? 'Laki-laki' : selectedBooking.pilgrim?.sex === 'P' ? 'Perempuan' : '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Package Info */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem 0' }}>Paket & Keberangkatan</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Nama Paket</p>
                                    <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'white' }}>{selectedBooking.departure?.package?.name || '-'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Jadwal Keberangkatan</p>
                                    <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'white' }}>{selectedBooking.departure?.tripName || '-'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Tipe Kamar</p>
                                    <p style={{ margin: '0.125rem 0 0', fontWeight: 600, color: 'white' }}>{selectedBooking.roomType?.name || '-'}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Total Harga</p>
                                    <p style={{ margin: '0.125rem 0 0', fontWeight: 800, color: 'var(--color-primary)' }}>Rp {(selectedBooking.totalPrice || 0).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Affiliator Info */}
                        {selectedBooking.affiliator && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem 0' }}>Afiliator</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.875rem' }}>
                                        {selectedBooking.affiliator.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>{selectedBooking.affiliator.name}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{selectedBooking.affiliator.role} • {selectedBooking.affiliator.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                            <button onClick={() => setSelectedBooking(null)} style={{ background: 'var(--color-primary)', color: '#000', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Modal */}
            <BroadcastModal
                isOpen={showBroadcastModal}
                onClose={() => setShowBroadcastModal(false)}
                onSuccess={handleBroadcastSuccess}
                selectedContacts={
                    bookings
                        .filter(b => selectedIds.has(b.id))
                        .map(b => ({
                            id: b.id,
                            name: b.pilgrim?.name || 'Tamu',
                            phone: b.pilgrim?.phone || ''
                        }))
                }
            />
        </div>
    );
};

export default BookingList;
