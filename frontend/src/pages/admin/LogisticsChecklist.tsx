import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface Departure {
    id: string;
    departureDate: string;
    package?: { name: string };
}

interface EquipmentItem {
    id: string;
    name: string;
    status: 'pending' | 'received';
    receivedAt?: string;
}

interface BookingLogistics {
    id: string;
    pilgrim?: { name: string; phone: string };
    equipment: EquipmentItem[];
}

const LogisticsChecklist: React.FC = () => {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
    const [logisticsData, setLogisticsData] = useState<BookingLogistics[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);

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
            console.error(error);
        }
    };

    useEffect(() => {
        if (selectedDepartureId) {
            fetchLogistics(selectedDepartureId);
        }
    }, [selectedDepartureId]);

    const fetchLogistics = async (departureId: string) => {
        setLoading(true);
        try {
            // First get all bookings for this departure
            const bookings = await apiFetch<any[]>(`/api/operations/rooming/${departureId}`);

            // For each booking, get their checklist
            const fullData = await Promise.all(bookings.map(async (b) => {
                const equipment = await apiFetch<EquipmentItem[]>(`/api/operations/equipment/checklist/${b.id}`);
                return {
                    id: b.id,
                    pilgrim: b.pilgrim,
                    equipment: equipment
                };
            }));

            setLogisticsData(fullData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (bookingId: string, itemId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'received' : 'pending';
        setUpdating(`${bookingId}-${itemId}`);
        try {
            await apiFetch('/api/operations/equipment/checklist', {
                method: 'POST',
                body: JSON.stringify({
                    bookingId,
                    equipmentItemId: itemId,
                    status: newStatus
                })
            });

            // Update local state
            setLogisticsData(prev => prev.map(b => {
                if (b.id === bookingId) {
                    return {
                        ...b,
                        equipment: b.equipment.map(e => e.id === itemId ? { ...e, status: newStatus as any } : e)
                    };
                }
                return b;
            }));
        } catch (error) {
            alert('Gagal update status');
        } finally {
            setUpdating(null);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">📦 Logistik & Perlengkapan</h1>
                    <p className="text-gray-500">Pantau distribusi perlengkapan jamaah</p>
                </div>

                <div className="bg-[#131210] p-2 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase ml-2">Keberangkatan</span>
                    <select
                        className="bg-transparent border-none text-primary font-bold text-sm focus:ring-0 outline-none cursor-pointer"
                        value={selectedDepartureId}
                        onChange={(e) => setSelectedDepartureId(e.target.value)}
                    >
                        {departures.map(d => (
                            <option key={d.id} value={d.id}>{d.departureDate} - {d.package?.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            {loading ? (
                <div className="text-center py-20 dark-card rounded-3xl shadow-xl border border-[var(--color-border)]">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Sinkronisasi data logistik...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {logisticsData.map((data) => (
                        <div key={data.id} className="dark-card rounded-3xl shadow-xl border border-[var(--color-border)] p-5 hover:border-primary/30 transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-white">{data.pilgrim?.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium">{data.pilgrim?.phone}</p>
                                </div>
                                <div className="bg-[#131210] px-2 py-1 rounded text-[10px] font-mono text-gray-400">
                                    #{data.id.substring(0, 6)}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {data.equipment.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleStatus(data.id, item.id, item.status)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${item.status === 'received'
                                            ? 'bg-[#22c55e]/10 border-success/30 text-success'
                                            : 'dark-card border-[var(--color-border)] text-gray-300 hover:border-primary'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {updating === `${data.id}-${item.id}` ? (
                                                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                                            ) : (
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${item.status === 'received' ? 'bg-success border-success text-white' : 'border-[var(--color-border)]'
                                                    }`}>
                                                    {item.status === 'received' && (
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            )}
                                            <span className="text-sm font-bold">{item.name}</span>
                                        </div>
                                        {item.status === 'received' && (
                                            <span className="text-[10px] font-medium opacity-70">Diterima</span>
                                        )}
                                    </div>
                                ))}
                                {data.equipment.length === 0 && (
                                    <p className="text-center py-4 text-xs text-gray-400 italic">Belum ada item perlengkapan didefinisikan.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LogisticsChecklist;
