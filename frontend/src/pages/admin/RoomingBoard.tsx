import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface Departure { id: string; departureDate: string; packageId: string; package?: { name: string }; }
interface Booking { id: string; pilgrimId: string; pilgrim?: { name: string; phone: string }; roomType?: { name: string }; roomAssignment?: { id: string; roomNumber: string; notes: string }; }

const thStyle: React.CSSProperties = { padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem' };
const tdStyle: React.CSSProperties = { padding: '1rem 1.5rem' };

const RoomingBoard: React.FC = () => {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => { fetchDepartures(); }, []);

    const fetchDepartures = async () => {
        try {
            const data = await apiFetch<{ departures: Departure[] }>('/api/departures');
            setDepartures(data.departures || []);
            if (data.departures?.length > 0) setSelectedDepartureId(data.departures[0].id);
        } catch (error) { console.error('Failed to fetch departures', error); }
    };

    useEffect(() => { if (selectedDepartureId) fetchRooming(selectedDepartureId); }, [selectedDepartureId]);

    const fetchRooming = async (id: string) => {
        setLoading(true);
        try {
            const data = await apiFetch<Booking[]>(`/api/operations/rooming/${id}`);
            setBookings(data || []);
        } catch (error) { console.error('Failed to fetch rooming board', error); }
        finally { setLoading(false); }
    };

    const handleAssignRoom = async (bookingId: string, roomNumber: string) => {
        setSaving(bookingId);
        try {
            await apiFetch('/api/operations/rooming/assign', { method: 'POST', body: JSON.stringify({ bookingId, roomNumber }) });
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, roomAssignment: { ...(b.roomAssignment || { id: '', notes: '' }), roomNumber } } : b));
        } catch (error) { console.error('Failed to assign room', error); alert('Gagal menyimpan nomor kamar'); }
        finally { setSaving(null); }
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Rooming Board</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola penempatan kamar jamaah per keberangkatan</p>
                </div>
                <div style={{ background: '#1a1917', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Keberangkatan:</span>
                    <select value={selectedDepartureId} onChange={(e) => setSelectedDepartureId(e.target.value)}
                        style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                        {departures.map(d => <option key={d.id} value={d.id}>{d.departureDate} - {d.package?.name || 'Paket'}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data jamaah...</div>
            ) : (
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={thStyle}>Jamaah</th>
                                <th style={thStyle}>Tipe Kamar</th>
                                <th style={thStyle}>No. Kamar</th>
                                <th style={thStyle}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Belum ada jamaah terdaftar untuk keberangkatan ini.</td></tr>
                            ) : bookings.map(booking => (
                                <tr key={booking.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.875rem' }}>
                                                {booking.pilgrim?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, color: 'white', margin: '0 0 0.125rem 0' }}>{booking.pilgrim?.name}</p>
                                                <p style={{ fontSize: '0.6875rem', color: '#888', margin: 0 }}>{booking.pilgrim?.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        <span style={{ padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                                            {booking.roomType?.name || 'Double'}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ position: 'relative' }}>
                                            <input type="text" placeholder="Contoh: 101" style={{
                                                width: '120px', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 700,
                                                background: '#0a0907', color: 'white', borderRadius: '0.5rem', outline: 'none',
                                                border: booking.roomAssignment?.roomNumber ? '1px solid rgba(34,197,94,0.3)' : '1px solid #333',
                                            }}
                                                defaultValue={booking.roomAssignment?.roomNumber || ''}
                                                onBlur={(e) => { if (e.target.value !== (booking.roomAssignment?.roomNumber || '')) handleAssignRoom(booking.id, e.target.value); }}
                                            />
                                            {saving === booking.id && <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--color-primary)' }}>...</span>}
                                        </div>
                                    </td>
                                    <td style={tdStyle}>
                                        {booking.roomAssignment?.roomNumber ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#22c55e' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                                Terisi
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.8125rem', color: '#888', fontStyle: 'italic' }}>Menunggu</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RoomingBoard;
