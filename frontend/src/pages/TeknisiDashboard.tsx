import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { toast } from 'sonner';

interface Departure { id: string; departureDate: string; package?: { name: string; equipmentIds?: string }; }
interface EquipmentItem { id: string; name: string; status: 'pending' | 'received'; }
interface JamaahEntry {
    id: string;
    pilgrim?: { name: string; phone: string };
    equipment: EquipmentItem[];
    allReceived: boolean;
    handedOver: boolean;
}

export default function TeknisiDashboard() {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState('');
    const [jamaahList, setJamaahList] = useState<JamaahEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingDepartures, setLoadingDepartures] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<{ departures: Departure[] }>('/api/departures');
                setDepartures(data.departures || []);
                if (data.departures?.length > 0) setSelectedDepartureId(data.departures[0].id);
            } catch { toast.error('Gagal memuat data keberangkatan'); }
            finally { setLoadingDepartures(false); }
        })();
    }, []);

    useEffect(() => { if (selectedDepartureId) fetchJamaah(selectedDepartureId); }, [selectedDepartureId]);

    const fetchJamaah = async (departureId: string) => {
        setLoading(true);
        try {
            const bookings = await apiFetch<any[]>(`/api/operations/rooming/${departureId}`);
            const fullData: JamaahEntry[] = await Promise.all((bookings || []).map(async (b) => {
                const equipment = await apiFetch<EquipmentItem[]>(`/api/operations/equipment/checklist/${b.id}`);
                const allReceived = equipment.length > 0 && equipment.every(e => e.status === 'received');
                return { id: b.id, pilgrim: b.pilgrim, equipment, allReceived, handedOver: allReceived };
            }));
            setJamaahList(fullData);
        } catch { toast.error('Gagal memuat data jamaah'); }
        finally { setLoading(false); }
    };

    const toggleAllEquipment = async (jamaah: JamaahEntry, markReceived: boolean) => {
        setUpdating(jamaah.id);
        const newStatus = markReceived ? 'received' : 'pending';
        try {
            for (const item of jamaah.equipment) {
                if ((markReceived && item.status === 'pending') || (!markReceived && item.status === 'received')) {
                    await apiFetch('/api/operations/equipment/checklist', {
                        method: 'POST',
                        body: JSON.stringify({ bookingId: jamaah.id, equipmentItemId: item.id, status: newStatus })
                    });
                }
            }
            // Refresh this jamaah's data
            const equipment = await apiFetch<EquipmentItem[]>(`/api/operations/equipment/checklist/${jamaah.id}`);
            const allReceived = equipment.length > 0 && equipment.every(e => e.status === 'received');
            setJamaahList(prev => prev.map(j => j.id === jamaah.id ? { ...j, equipment, allReceived, handedOver: allReceived } : j));
            toast.success(markReceived ? 'Semua perlengkapan ditandai lengkap' : 'Status perlengkapan direset');
        } catch { toast.error('Gagal update status'); }
        finally { setUpdating(null); }
    };

    const completedCount = jamaahList.filter(j => j.allReceived).length;

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', color: 'var(--color-primary)', verticalAlign: 'middle', marginRight: '0.5rem' }}>checklist</span>
                    Checklist Perlengkapan Jamaah
                </h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Centang perlengkapan dan serahkan ke jamaah sesuai keberangkatan.</p>
            </div>

            {/* Departure Selector */}
            <div style={{ marginBottom: '1.5rem', background: '#1a1917', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>flight_takeoff</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Keberangkatan:</span>
                </div>
                {loadingDepartures ? (
                    <span style={{ color: '#888', fontSize: '0.875rem' }}>Memuat...</span>
                ) : (
                    <select value={selectedDepartureId} onChange={e => setSelectedDepartureId(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid var(--color-border)', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 700, borderRadius: '0.5rem', cursor: 'pointer', outline: 'none', flex: 1, minWidth: '200px' }}>
                        {departures.map(d => <option key={d.id} value={d.id}>{d.departureDate} — {d.package?.name}</option>)}
                    </select>
                )}
                {jamaahList.length > 0 && (
                    <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                        <div style={{ background: 'rgba(34,197,94,0.1)', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#22c55e' }}>
                            ✅ {completedCount}/{jamaahList.length} Selesai
                        </div>
                    </div>
                )}
            </div>

            {/* Jamaah List */}
            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                    <p style={{ marginTop: '0.75rem' }}>Memuat data jamaah...</p>
                </div>
            ) : jamaahList.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)', background: '#1a1917', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
                    <p>Belum ada jamaah terdaftar untuk keberangkatan ini.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {jamaahList.map((jamaah, idx) => {
                        const isUpdating = updating === jamaah.id;
                        return (
                            <div key={jamaah.id} style={{
                                background: '#1a1917', border: `1px solid ${jamaah.allReceived ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
                                borderRadius: '0.75rem', padding: '1rem 1.25rem', transition: 'all 0.3s',
                                ...(jamaah.allReceived ? { background: 'rgba(34,197,94,0.05)' } : {})
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                    {/* Left: Jamaah info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '0.5rem', flexShrink: 0,
                                            background: jamaah.allReceived ? 'var(--color-success)' : 'var(--color-primary-bg)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: jamaah.allReceived ? 'white' : 'var(--color-primary)', fontWeight: 800, fontSize: '1rem'
                                        }}>
                                            {jamaah.allReceived
                                                ? <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check</span>
                                                : (idx + 1)
                                            }
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, color: 'white', margin: '0 0 0.125rem 0', fontSize: '0.9375rem' }}>{jamaah.pilgrim?.name || 'N/A'}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>{jamaah.pilgrim?.phone}</p>
                                        </div>
                                    </div>

                                    {/* Right: Two toggle buttons */}
                                    <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                                        {/* Checkbox 1: Perlengkapan Lengkap */}
                                        <button
                                            onClick={() => toggleAllEquipment(jamaah, !jamaah.allReceived)}
                                            disabled={isUpdating}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem',
                                                borderRadius: '0.5rem', cursor: isUpdating ? 'wait' : 'pointer', transition: 'all 0.2s',
                                                border: 'none', fontWeight: 600, fontSize: '0.8125rem',
                                                background: jamaah.allReceived ? 'rgba(34,197,94,0.15)' : '#0a0907',
                                                color: jamaah.allReceived ? '#22c55e' : '#888',
                                                outline: jamaah.allReceived ? 'none' : '1px solid #333',
                                                opacity: isUpdating ? 0.6 : 1,
                                            }}
                                        >
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '0.25rem', flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: jamaah.allReceived ? '#22c55e' : 'transparent',
                                                border: jamaah.allReceived ? '2px solid #22c55e' : '2px solid #555',
                                            }}>
                                                {jamaah.allReceived && <span className="material-symbols-outlined" style={{ fontSize: '12px', color: 'white' }}>check</span>}
                                            </div>
                                            {isUpdating ? 'Proses...' : 'Perlengkapan Lengkap'}
                                        </button>

                                        {/* Checkbox 2: Sudah Diserahkan */}
                                        <div
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem',
                                                borderRadius: '0.5rem', transition: 'all 0.2s',
                                                fontWeight: 600, fontSize: '0.8125rem',
                                                background: jamaah.allReceived ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
                                                color: jamaah.allReceived ? '#22c55e' : '#555',
                                                outline: '1px solid ' + (jamaah.allReceived ? 'rgba(34,197,94,0.3)' : '#222'),
                                            }}
                                        >
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '0.25rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: jamaah.allReceived ? '#22c55e' : 'transparent',
                                                border: jamaah.allReceived ? '2px solid #22c55e' : '2px solid #333',
                                            }}>
                                                {jamaah.allReceived && <span className="material-symbols-outlined" style={{ fontSize: '12px', color: 'white' }}>check</span>}
                                            </div>
                                            Sudah Diserahkan
                                        </div>
                                    </div>
                                </div>

                                {/* Equipment detail list (collapsed, shows items) */}
                                {!jamaah.allReceived && jamaah.equipment.length > 0 && (
                                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {jamaah.equipment.map(item => (
                                            <span key={item.id} style={{
                                                fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: '999px',
                                                background: item.status === 'received' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                                                color: item.status === 'received' ? '#22c55e' : '#888',
                                                border: '1px solid ' + (item.status === 'received' ? 'rgba(34,197,94,0.2)' : '#333'),
                                            }}>
                                                {item.status === 'received' ? '✓ ' : '○ '}{item.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
