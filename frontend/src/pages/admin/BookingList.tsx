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
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Daftar Booking Jam'ah</h1>
            <div className="dark-card rounded-3xl border border-[var(--color-border)] shadow-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#131210] border-b border-[var(--color-border)] text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                            <th className="px-6 py-4">Kode Booking</th>
                            <th className="px-6 py-4">Jamaah</th>
                            <th className="px-6 py-4">Paket</th>
                            <th className="px-6 py-4">Total Harga</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                                <td className="px-6 py-4 font-mono text-xs text-gray-300">{booking.id.substring(0, 8).toUpperCase()}</td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-white tracking-tight">{booking.pilgrim?.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{booking.pilgrim?.phone}</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-white">
                                    {booking.departure?.package?.name}
                                </td>
                                <td className="px-6 py-4 text-sm font-black text-primary tracking-tight">
                                    Rp {(booking.totalPrice || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${booking.paymentStatus === 'paid' ? 'bg-[#22c55e]/10 text-success' : 'bg-[#f59e0b]/10 text-warning'
                                        }`}>
                                        {booking.paymentStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
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
