import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface Departure { id: string; departureDate: string; package?: { name: string }; }
interface Pilgrim { name: string; phone: string; noKtp: string; }
interface JamaahOverview {
    bookingId: string;
    pilgrim: Pilgrim;
    totalItems: number;
    receivedItems: number;
    allAssigned: boolean;
    allReceived: boolean;
    equipmentDelivered: boolean;
}

type DeliveryFilter = 'all' | 'delivered' | 'notDelivered';

const TeknikJamaahList: React.FC = () => {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
    const [jamaahList, setJamaahList] = useState<JamaahOverview[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>('all');
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => { fetchDepartures(); }, []);

    const fetchDepartures = async () => {
        try {
            const data = await apiFetch<{ departures: Departure[] }>('/api/departures');
            setDepartures(data.departures || []);
            if (data.departures?.length > 0) setSelectedDepartureId(data.departures[0].id);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        if (selectedDepartureId) fetchOverview(selectedDepartureId);
    }, [selectedDepartureId]);

    const fetchOverview = async (departureId: string) => {
        setLoading(true);
        try {
            const data = await apiFetch<JamaahOverview[]>(`/api/operations/jamaah-overview/${departureId}`);
            setJamaahList(data || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const toggleDelivered = async (bookingId: string) => {
        setTogglingId(bookingId);
        try {
            const result = await apiFetch<{ bookingId: string; equipmentDelivered: boolean }>(
                `/api/operations/deliver-equipment/${bookingId}`,
                { method: 'POST' }
            );
            setJamaahList(prev => prev.map(j =>
                j.bookingId === bookingId ? { ...j, equipmentDelivered: result.equipmentDelivered } : j
            ));
        } catch (error) { alert('Gagal update status pengiriman'); }
        finally { setTogglingId(null); }
    };

    const filtered = jamaahList
        .filter(j => {
            if (deliveryFilter === 'delivered') return j.equipmentDelivered;
            if (deliveryFilter === 'notDelivered') return !j.equipmentDelivered;
            return true;
        })
        .filter(j =>
            j.pilgrim?.name?.toLowerCase().includes(search.toLowerCase()) ||
            j.pilgrim?.phone?.includes(search) ||
            j.pilgrim?.noKtp?.includes(search)
        );

    const totalJamaah = jamaahList.length;
    const equipmentComplete = jamaahList.filter(j => j.allAssigned).length;
    const fullyDelivered = jamaahList.filter(j => j.equipmentDelivered).length;

    const filterOptions: { key: DeliveryFilter; label: string; count: number }[] = [
        { key: 'all', label: 'Semua', count: totalJamaah },
        { key: 'delivered', label: 'Sudah Menerima', count: fullyDelivered },
        { key: 'notDelivered', label: 'Belum Menerima', count: totalJamaah - fullyDelivered },
    ];

    // Returns indicator color: green if complete, red if not
    const getIndicatorStyle = (complete: boolean) => ({
        outer: {
            width: '28px', height: '28px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: complete ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
            border: `1.5px solid ${complete ? '#22c55e' : '#ef4444'}`,
            flexShrink: 0 as const,
        },
        dot: {
            width: '10px', height: '10px', borderRadius: '9999px',
            background: complete ? '#22c55e' : '#ef4444',
        }
    });

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>Daftar Jamaah</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.8rem' }}>Status perlengkapan per jamaah</p>
                </div>
                <div style={{ background: '#1a1917', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Keberangkatan</span>
                    <select value={selectedDepartureId} onChange={(e) => setSelectedDepartureId(e.target.value)}
                        style={{ padding: '0.35rem', background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', outline: 'none', maxWidth: '180px' }}>
                        {departures.map(d => <option key={d.id} value={d.id}>{d.departureDate} - {d.package?.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                    { label: 'Total Jamaah', value: totalJamaah, icon: 'group', color: 'var(--color-primary)' },
                    { label: 'Perlengkapan Lengkap', value: equipmentComplete, icon: 'inventory', color: '#22c55e' },
                    { label: 'Diserahkan', value: fullyDelivered, icon: 'task_alt', color: '#3b82f6' },
                ].map((s) => (
                    <div key={s.label} style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '0.875rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '0.625rem', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1, color: s.color, margin: 0 }}>{s.value}</p>
                            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0 0', lineHeight: 1.2 }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', overflowX: 'auto', paddingBottom: '2px' }}>
                {filterOptions.map(f => (
                    <button key={f.key} onClick={() => setDeliveryFilter(f.key)} style={{
                        padding: '0.4rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.775rem', fontWeight: 600, cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap',
                        background: deliveryFilter === f.key ? 'rgba(200,168,81,0.15)' : 'transparent',
                        borderColor: deliveryFilter === f.key ? 'var(--color-primary)' : 'var(--color-border)',
                        color: deliveryFilter === f.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0
                    }}>
                        {f.label}
                        <span style={{ background: deliveryFilter === f.key ? 'rgba(200,168,81,0.25)' : 'rgba(255,255,255,0.08)', padding: '0 0.35rem', borderRadius: '9999px', fontSize: '0.65rem' }}>{f.count}</span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--color-text-muted)' }}>search</span>
                <input type="text" placeholder="Cari jamaah..." value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.25rem', background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '0.625rem', color: 'var(--color-text)', outline: 'none', fontSize: '0.85rem', boxSizing: 'border-box' }} />
            </div>

            {/* Desktop Table / Mobile Cards */}
            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data jamaah...</div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', background: '#1a1917', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>Tidak ada data jamaah.</div>
            ) : (
                <>
                    {/* Desktop Table (hidden on mobile via CSS class) */}
                    <div className="desktop-table" style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '560px' }}>
                            <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                                <tr>
                                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jamaah</th>
                                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Perlengkapan</th>
                                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Lengkap</th>
                                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Diserahkan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((j, idx) => {
                                    const ind = getIndicatorStyle(j.allAssigned);
                                    return (
                                        <tr key={j.bookingId} style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(200,168,81,0.1)', border: '1px solid rgba(200,168,81,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-primary)' }}>{j.pilgrim?.name?.charAt(0)?.toUpperCase()}</span>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.875rem' }}>{j.pilgrim?.name}</p>
                                                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0.1rem 0 0 0' }}>{j.pilgrim?.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden', maxWidth: '100px' }}>
                                                        <div style={{ height: '100%', borderRadius: '9999px', width: j.totalItems > 0 ? `${Math.round((j.receivedItems / j.totalItems) * 100)}%` : '0%', background: j.allReceived ? '#22c55e' : j.receivedItems > 0 ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)', transition: 'width 0.3s ease' }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{j.receivedItems}/{j.totalItems}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                                                <div style={ind.outer}><div style={ind.dot} /></div>
                                            </td>
                                            <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                                                <button title={j.equipmentDelivered ? 'Sudah diserahkan — klik untuk batalkan' : 'Tandai sudah diserahkan ke jamaah'} onClick={() => toggleDelivered(j.bookingId)} disabled={togglingId === j.bookingId} style={{
                                                    width: '36px', height: '36px', borderRadius: '9999px', cursor: togglingId === j.bookingId ? 'wait' : 'pointer',
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    background: j.equipmentDelivered ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                                                    border: `2px solid ${j.equipmentDelivered ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`, transition: 'all 0.2s',
                                                }}>
                                                    {togglingId === j.bookingId ? (
                                                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>...</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1", color: j.equipmentDelivered ? '#3b82f6' : 'rgba(255,255,255,0.25)' }}>check</span>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="mobile-cards" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filtered.map(j => {
                            const ind = getIndicatorStyle(j.allAssigned);
                            return (
                                <div key={j.bookingId} style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '0.875rem', padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(200,168,81,0.1)', border: '1px solid rgba(200,168,81,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-primary)' }}>{j.pilgrim?.name?.charAt(0)?.toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 700, margin: 0, fontSize: '0.875rem' }}>{j.pilgrim?.name}</p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0.1rem 0 0 0' }}>{j.pilgrim?.phone}</p>
                                            </div>
                                        </div>
                                        {/* Two indicators top-right */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={ind.outer}><div style={ind.dot} /></div>
                                            <button title={j.equipmentDelivered ? 'Sudah diserahkan' : 'Tandai diserahkan'} onClick={() => toggleDelivered(j.bookingId)} disabled={togglingId === j.bookingId} style={{
                                                width: '36px', height: '36px', borderRadius: '9999px', cursor: 'pointer',
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                background: j.equipmentDelivered ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                                                border: `2px solid ${j.equipmentDelivered ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`, transition: 'all 0.2s',
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1", color: j.equipmentDelivered ? '#3b82f6' : 'rgba(255,255,255,0.25)' }}>check</span>
                                            </button>
                                        </div>
                                    </div>
                                    {/* Progress */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                        <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', borderRadius: '9999px', width: j.totalItems > 0 ? `${Math.round((j.receivedItems / j.totalItems) * 100)}%` : '0%', background: j.allReceived ? '#22c55e' : j.receivedItems > 0 ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)', transition: 'width 0.3s ease' }} />
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{j.receivedItems}/{j.totalItems} perlengkapan</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.875rem', padding: '0 0.25rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '9999px', background: '#22c55e' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Lengkap</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '9999px', background: '#ef4444' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Belum Lengkap</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#3b82f6', fontVariationSettings: "'FILL' 1" }}>check</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Centang Biru = Diserahkan (klik manual)</span>
                </div>
            </div>

            {/* Responsive CSS */}
            <style>{`
                .desktop-table { display: block; }
                .mobile-cards { display: none; }
                @media (max-width: 600px) {
                    .desktop-table { display: none; }
                    .mobile-cards { display: flex; }
                }
            `}</style>
        </div>
    );
};

export default TeknikJamaahList;
