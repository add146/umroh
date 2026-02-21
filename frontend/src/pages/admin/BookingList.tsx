import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

const BookingList: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await apiFetch<{ bookings: any[] }>('/api/bookings');
                setBookings(data.bookings || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Daftar Booking Jama'ah</h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola dan pantau seluruh pendaftaran paket umroh beserta statusnya.</p>
            </div>

            <div style={{ background: '#131210', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#131210] border-b border-[var(--color-border)] text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                            <th className="px-8 py-5">Kode Booking</th>
                            <th className="px-8 py-5">Jamaah</th>
                            <th className="px-8 py-5">Paket</th>
                            <th className="px-8 py-5">Total Harga</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                                <td className="px-8 py-5 font-mono text-xs text-gray-300">{booking.id.substring(0, 8).toUpperCase()}</td>
                                <td className="px-8 py-5">
                                    <p className="font-bold text-white tracking-tight">{booking.pilgrim?.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{booking.pilgrim?.phone}</p>
                                </td>
                                <td className="px-8 py-5 text-sm font-bold text-white">
                                    {booking.departure?.package?.name}
                                </td>
                                <td className="px-8 py-5 text-sm font-black text-primary tracking-tight">
                                    Rp {(booking.totalPrice || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${booking.paymentStatus === 'paid' ? 'bg-[#22c55e]/10 text-success' : 'bg-[#f59e0b]/10 text-warning'
                                        }`}>
                                        {booking.paymentStatus}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <button className="text-primary text-xs font-bold hover:underline">Detail</button>
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
