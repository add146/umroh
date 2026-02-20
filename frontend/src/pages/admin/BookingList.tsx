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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Kode Booking</th>
                            <th className="px-6 py-4">Jamaah</th>
                            <th className="px-6 py-4">Paket</th>
                            <th className="px-6 py-4">Total Harga</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs">{booking.id.substring(0, 8).toUpperCase()}</td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900">{booking.pilgrim?.name}</p>
                                    <p className="text-xs text-gray-500">{booking.pilgrim?.phone}</p>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {booking.departure?.package?.name}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    Rp {(booking.totalPrice || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                        }`}>
                                        {booking.paymentStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-brand-primary text-xs font-bold hover:underline">Detail</button>
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
