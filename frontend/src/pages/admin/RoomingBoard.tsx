import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface Departure {
    id: string;
    departureDate: string;
    packageId: string;
    package?: { name: string };
}

interface Booking {
    id: string;
    pilgrimId: string;
    pilgrim?: { name: string; phone: string };
    roomType?: { name: string };
    roomAssignment?: {
        id: string;
        roomNumber: string;
        notes: string;
    };
}

const RoomingBoard: React.FC = () => {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchDepartures();
    }, []);

    const fetchDepartures = async () => {
        try {
            const data = await apiFetch<{ departures: Departure[] }>('/api/departures');
            setDepartures(data.departures || []);
            if (data.departures?.length > 0) {
                setSelectedDepartureId(data.departures[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch departures', error);
        }
    };

    useEffect(() => {
        if (selectedDepartureId) {
            fetchRooming(selectedDepartureId);
        }
    }, [selectedDepartureId]);

    const fetchRooming = async (id: string) => {
        setLoading(true);
        try {
            const data = await apiFetch<Booking[]>(`/api/operations/rooming/${id}`);
            setBookings(data || []);
        } catch (error) {
            console.error('Failed to fetch rooming board', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignRoom = async (bookingId: string, roomNumber: string) => {
        setSaving(bookingId);
        try {
            await apiFetch('/api/operations/rooming/assign', {
                method: 'POST',
                body: JSON.stringify({ bookingId, roomNumber })
            });
            // Update local state
            setBookings(prev => prev.map(b =>
                b.id === bookingId
                    ? { ...b, roomAssignment: { ...(b.roomAssignment || { id: '', notes: '' }), roomNumber } }
                    : b
            ));
        } catch (error) {
            console.error('Failed to assign room', error);
            alert('Gagal menyimpan nomor kamar');
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 border-b border-[var(--color-border)]">
                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        🏢 Rooming Board
                    </h1>
                    <p className="text-gray-400 font-medium text-sm">Kelola penempatan kamar jamaah per keberangkatan</p>
                </div>

                <div className="bg-[#131210] p-2.5 rounded-xl border border-[var(--color-border)] shadow-sm flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase ml-2">Keberangkatan:</span>
                    <select
                        className="p-2 border-none focus:ring-0 bg-transparent text-sm font-bold text-primary cursor-pointer outline-none"
                        value={selectedDepartureId}
                        onChange={(e) => setSelectedDepartureId(e.target.value)}
                    >
                        {departures.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.departureDate} - {d.package?.name || 'Paket'}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Memuat data jamaah...</p>
                </div>
            ) : (
                <div className="dark-card rounded-3xl border border-[var(--color-border)] shadow-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#131210] border-b border-[var(--color-border)] text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                                <th className="px-6 py-5">Jamaah</th>
                                <th className="px-6 py-5">Tipe Kamar</th>
                                <th className="px-6 py-5">No. Kamar</th>
                                <th className="px-6 py-5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">
                                        Belum ada jamaah terdaftar untuk keberangkatan ini.
                                    </td>
                                </tr>
                            ) : bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-bg)] flex items-center justify-center text-primary font-bold mr-3">
                                                {booking.pilgrim?.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white tracking-tight">{booking.pilgrim?.name}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-widest">{booking.pilgrim?.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#8b5cf6]/10 text-purple-400">
                                            {booking.roomType?.name || 'Double'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Contoh: 101, 102"
                                                className={`w-36 p-2 text-sm border bg-[#131210] text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-bold ${booking.roomAssignment?.roomNumber ? 'border-success/50' : 'border-[var(--color-border)]'
                                                    }`}
                                                defaultValue={booking.roomAssignment?.roomNumber || ''}
                                                onBlur={(e) => {
                                                    if (e.target.value !== (booking.roomAssignment?.roomNumber || '')) {
                                                        handleAssignRoom(booking.id, e.target.value);
                                                    }
                                                }}
                                            />
                                            {saving === booking.id && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.roomAssignment?.roomNumber ? (
                                            <span className="text-success flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Terisi
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">Menunggu</span>
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
