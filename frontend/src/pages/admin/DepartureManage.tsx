import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

const DepartureManage: React.FC = () => {
    const [departures, setDepartures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDepartures = async () => {
        try {
            const data = await apiFetch<{ departures: any[] }>('/api/departures');
            setDepartures(data.departures || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchDepartures();
    }, []);

    const handleCreate = async () => {
        const packageId = prompt('Package ID (UUID):');
        if (!packageId) return;
        const departureDate = prompt('Tanggal (YYYY-MM-DD):');
        const airport = prompt('Bandara (3 Huruf):');
        const totalSeats = parseInt(prompt('Total Seat:') || '45');

        try {
            await apiFetch('/api/departures', {
                method: 'POST',
                body: JSON.stringify({ packageId, departureDate, airport, totalSeats })
            });
            fetchDepartures();
        } catch (error) {
            alert('Gagal membuat keberangkatan');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Kelola Jadwal Keberangkatan</h1>
                <button
                    onClick={handleCreate}
                    className="bg-brand-primary text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-brand-primary/20"
                >
                    + Tambah Jadwal
                </button>
            </div>

            <div className="dark-card rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#131210] border-b border-[var(--color-border)]">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Tgl Berangkat</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Bandara</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Kuota</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {loading ? (
                            <tr><td colSpan={4} className="p-10 text-center text-gray-400 animate-pulse">Memuat jadwal...</td></tr>
                        ) : departures.map(dep => (
                            <tr key={dep.id}>
                                <td className="px-6 py-4 font-bold text-white">
                                    {new Date(dep.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 text-sm font-black text-brand-primary">{dep.airport}</td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-gray-600">{dep.bookedSeats} / {dep.totalSeats} Seat</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${dep.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/export/siskopatuh/${dep.id}`}
                                            className="text-[10px] font-black text-brand-primary bg-brand-primary/5 px-2 py-1 rounded hover:bg-brand-primary/10 transition-colors"
                                        >
                                            SISKOPATUH
                                        </a>
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/export/manifest/${dep.id}`}
                                            className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                                        >
                                            MANIFEST
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DepartureManage;
