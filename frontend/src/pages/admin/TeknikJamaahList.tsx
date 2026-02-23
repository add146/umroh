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
}

const TeknikJamaahList: React.FC = () => {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
    const [jamaahList, setJamaahList] = useState<JamaahOverview[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

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

    const filtered = jamaahList.filter(j =>
        j.pilgrim?.name?.toLowerCase().includes(search.toLowerCase()) ||
        j.pilgrim?.phone?.includes(search) ||
        j.pilgrim?.noKtp?.includes(search)
    );

    const totalJamaah = jamaahList.length;
    const equipmentComplete = jamaahList.filter(j => j.allAssigned).length;
    const fullyDelivered = jamaahList.filter(j => j.allReceived).length;

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Daftar Jamaah</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Ringkasan status perlengkapan per jamaah</p>
                </div>
                <div style={{ background: '#1a1917', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Keberangkatan</span>
                    <select value={selectedDepartureId} onChange={(e) => setSelectedDepartureId(e.target.value)}
                        style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                        {departures.map(d => <option key={d.id} value={d.id}>{d.departureDate} - {d.package?.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Jamaah', value: totalJamaah, icon: 'group', color: 'var(--color-primary)' },
                    { label: 'Perlengkapan Lengkap', value: equipmentComplete, icon: 'inventory', color: '#22c55e' },
                    { label: 'Diserahkan Semua', value: fullyDelivered, icon: 'task_alt', color: '#3b82f6' },
                ].map((s) => (
                    <div key={s.label} style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '0.75rem', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: s.color, margin: 0 }}>{s.value}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'var(--color-text-muted)' }}>search</span>
                <input
                    type="text"
                    placeholder="Cari jamaah..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '0.75rem', color: 'var(--color-text)', outline: 'none', fontSize: '0.875rem' }}
                />
            </div>

            {/* Table */}
            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jamaah</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No. KTP</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Perlengkapan</th>
                            <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data jamaah...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Tidak ada data jamaah.</td></tr>
                        ) : filtered.map((j, idx) => (
                            <tr key={j.bookingId} style={{ borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <td style={{ padding: '1.1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(200,168,81,0.1)', border: '1px solid rgba(200,168,81,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--color-primary)' }}>{j.pilgrim?.name?.charAt(0)?.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>{j.pilgrim?.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.15rem 0 0 0' }}>{j.pilgrim?.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1.1rem 1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                    {j.pilgrim?.noKtp}
                                </td>
                                <td style={{ padding: '1.1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                        {/* Progress bar */}
                                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden', maxWidth: '120px' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '9999px',
                                                width: j.totalItems > 0 ? `${Math.round((j.receivedItems / j.totalItems) * 100)}%` : '0%',
                                                background: j.allReceived ? '#22c55e' : j.receivedItems > 0 ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                            {j.receivedItems} / {j.totalItems}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '1.1rem 1.5rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem' }}>
                                        {/* Indicator 1: Hijau jika perlengkapan lengkap */}
                                        <div
                                            title={j.allAssigned ? 'Perlengkapan Lengkap' : 'Perlengkapan Belum Lengkap'}
                                            style={{
                                                width: '24px', height: '24px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: j.allAssigned ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                                                border: j.allAssigned ? '1.5px solid #22c55e' : '1.5px solid rgba(255,255,255,0.15)',
                                            }}
                                        >
                                            <div style={{
                                                width: '10px', height: '10px', borderRadius: '9999px',
                                                background: j.allAssigned ? '#22c55e' : 'rgba(255,255,255,0.2)'
                                            }} />
                                        </div>
                                        {/* Indicator 2: Centang jika diserahkan semua */}
                                        <div
                                            title={j.allReceived ? 'Perlengkapan Sudah Diserahkan Semua' : 'Belum Diserahkan Semua'}
                                            style={{
                                                width: '24px', height: '24px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: j.allReceived ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                                                border: j.allReceived ? '1.5px solid #3b82f6' : '1.5px solid rgba(255,255,255,0.15)',
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{
                                                fontSize: '14px',
                                                fontVariationSettings: "'FILL' 1",
                                                color: j.allReceived ? '#3b82f6' : 'rgba(255,255,255,0.2)'
                                            }}>check</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', padding: '0 0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '9999px', background: '#22c55e' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Perlengkapan Lengkap (tercentang di logistik)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#3b82f6', fontVariationSettings: "'FILL' 1" }}>check</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Perlengkapan Sudah Diserahkan Semua ke Jamaah</span>
                </div>
            </div>
        </div>
    );
};

export default TeknikJamaahList;
