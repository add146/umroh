import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface Departure { id: string; departureDate: string; package?: { name: string }; }
interface EquipmentItem { id: string; name: string; status: 'pending' | 'received'; receivedAt?: string; }
interface BookingLogistics { id: string; pilgrim?: { name: string; phone: string }; equipment: EquipmentItem[]; }

const LogisticsChecklist: React.FC = () => {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
    const [logisticsData, setLogisticsData] = useState<BookingLogistics[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => { fetchDepartures(); }, []);

    const fetchDepartures = async () => {
        try {
            const data = await apiFetch<{ departures: Departure[] }>('/api/departures');
            setDepartures(data.departures || []);
            if (data.departures?.length > 0) setSelectedDepartureId(data.departures[0].id);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { if (selectedDepartureId) fetchLogistics(selectedDepartureId); }, [selectedDepartureId]);

    const fetchLogistics = async (departureId: string) => {
        setLoading(true);
        try {
            const bookings = await apiFetch<any[]>(`/api/operations/rooming/${departureId}`);
            const fullData = await Promise.all(bookings.map(async (b) => {
                const equipment = await apiFetch<EquipmentItem[]>(`/api/operations/equipment/checklist/${b.id}`);
                return { id: b.id, pilgrim: b.pilgrim, equipment };
            }));
            setLogisticsData(fullData);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const toggleStatus = async (bookingId: string, itemId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'received' : 'pending';
        setUpdating(`${bookingId}-${itemId}`);
        try {
            await apiFetch('/api/operations/equipment/checklist', {
                method: 'POST',
                body: JSON.stringify({ bookingId, equipmentItemId: itemId, status: newStatus })
            });
            setLogisticsData(prev => prev.map(b => b.id === bookingId ? { ...b, equipment: b.equipment.map(e => e.id === itemId ? { ...e, status: newStatus as any } : e) } : b));
        } catch (error) { alert('Gagal update status'); }
        finally { setUpdating(null); }
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Logistik & Perlengkapan</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Pantau distribusi perlengkapan jamaah</p>
                </div>
                <div style={{ background: '#1a1917', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Keberangkatan</span>
                    <select value={selectedDepartureId} onChange={(e) => setSelectedDepartureId(e.target.value)}
                        style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                        {departures.map(d => <option key={d.id} value={d.id}>{d.departureDate} - {d.package?.name}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sinkronisasi data logistik...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                    {logisticsData.map((data) => (
                        <div key={data.id} style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontWeight: 700, color: 'white', margin: '0 0 0.125rem 0' }}>{data.pilgrim?.name}</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>{data.pilgrim?.phone}</p>
                                </div>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '0.125rem 0.5rem', borderRadius: '0.25rem' }}>
                                    #{data.id.substring(0, 6)}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {data.equipment.map((item) => (
                                    <div key={item.id} onClick={() => toggleStatus(data.id, item.id, item.status)} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                                        background: item.status === 'received' ? 'rgba(34,197,94,0.1)' : '#0a0907',
                                        border: item.status === 'received' ? '1px solid rgba(34,197,94,0.2)' : '1px solid #333',
                                        color: item.status === 'received' ? '#22c55e' : '#ccc',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                            {updating === `${data.id}-${item.id}` ? (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>...</span>
                                            ) : (
                                                <div style={{
                                                    width: '20px', height: '20px', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: item.status === 'received' ? '#22c55e' : 'transparent',
                                                    border: item.status === 'received' ? '2px solid #22c55e' : '2px solid #555',
                                                }}>
                                                    {item.status === 'received' && <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'white' }}>check</span>}
                                                </div>
                                            )}
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.name}</span>
                                        </div>
                                        {item.status === 'received' && <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>Diterima</span>}
                                    </div>
                                ))}
                                {data.equipment.length === 0 && (
                                    <p style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8125rem', color: '#888', fontStyle: 'italic' }}>Belum ada item perlengkapan.</p>
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
