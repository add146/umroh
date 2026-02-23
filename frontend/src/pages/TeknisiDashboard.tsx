import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface DepartureStats {
    id: string;
    departureDate: string;
    package?: { name: string };
}
interface JamaahOverview {
    bookingId: string;
    totalItems: number;
    receivedItems: number;
    allAssigned: boolean;
    equipmentDelivered: boolean;
}

export default function TeknisiDashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [departures, setDepartures] = useState<DepartureStats[]>([]);
    const [selectedDep, setSelectedDep] = useState('');
    const [overviewData, setOverviewData] = useState<JamaahOverview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<{ departures: DepartureStats[] }>('/api/departures');
                const deps = data.departures || [];
                setDepartures(deps);
                if (deps.length > 0) setSelectedDep(deps[0].id);
            } catch {/* ignore */ }
        })();
    }, []);

    useEffect(() => {
        if (!selectedDep) return;
        setLoading(true);
        apiFetch<JamaahOverview[]>(`/api/operations/jamaah-overview/${selectedDep}`)
            .then(d => setOverviewData(d || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [selectedDep]);

    const totalJamaah = overviewData.length;
    const perlengkapanLengkap = overviewData.filter(j => j.allAssigned).length;
    const sudahDiserahkan = overviewData.filter(j => j.equipmentDelivered).length;
    const belumDiserahkan = totalJamaah - sudahDiserahkan;

    const currentDep = departures.find(d => d.id === selectedDep);
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';

    const quickLinks = [
        { icon: 'inventory', label: 'Logistik & Inventory', desc: 'Centang perlengkapan jamaah', path: '/admin/logistics', color: '#c8a851' },
        { icon: 'person_search', label: 'Daftar Jamaah', desc: 'Status & konfirmasi serahkan', path: '/teknisi/jamaah', color: '#3b82f6' },
        { icon: 'manage_accounts', label: 'Pengaturan Akun', desc: 'Profil dan keamanan akun', path: '/profile', color: '#a855f7' },
    ];

    return (
        <div className="animate-in fade-in duration-700">

            {/* Welcome + departure selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <p style={{ color: 'var(--color-text-muted)', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>{greeting},</p>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #c8a851 30%, #f5d98e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {user?.email?.split('@')[0] || 'Teknisi'} 👋
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: '0.35rem 0 0 0', fontSize: '0.8rem' }}>
                        {currentDep ? `Keberangkatan: ${currentDep.departureDate} — ${currentDep.package?.name}` : 'Mengelola perlengkapan jamaah'}
                    </p>
                </div>
                <div style={{ background: '#1a1917', padding: '0.5rem 0.875rem', borderRadius: '0.625rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>flight_takeoff</span>
                    <select value={selectedDep} onChange={e => setSelectedDep(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', outline: 'none', maxWidth: '200px' }}>
                        {departures.map(d => <option key={d.id} value={d.id}>{d.departureDate} — {d.package?.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Jamaah', value: loading ? '—' : totalJamaah, icon: 'group', color: '#c8a851', bg: 'rgba(200,168,81,0.1)' },
                    { label: 'Perlengkapan Lengkap', value: loading ? '—' : perlengkapanLengkap, icon: 'inventory_2', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
                    { label: 'Sudah Diserahkan', value: loading ? '—' : sudahDiserahkan, icon: 'task_alt', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                    { label: 'Belum Diserahkan', value: loading ? '—' : belumDiserahkan, icon: 'pending_actions', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                ].map(s => (
                    <div key={s.label} style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '0.625rem', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: s.color, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, color: s.color, margin: 0 }}>{s.value}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0 0', lineHeight: 1.3 }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress overview bar */}
            {!loading && totalJamaah > 0 && (
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                        <div>
                            <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>Progress Penyerahan</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.15rem 0 0 0' }}>Keberangkatan aktif</p>
                        </div>
                        <span style={{ fontWeight: 800, color: '#3b82f6', fontSize: '1.1rem' }}>
                            {Math.round((sudahDiserahkan / totalJamaah) * 100)}%
                        </span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: '9999px', transition: 'width 0.6s ease',
                            width: `${Math.round((sudahDiserahkan / totalJamaah) * 100)}%`,
                            background: 'linear-gradient(90deg, #2563eb, #3b82f6)'
                        }} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '9999px', background: '#22c55e' }} />
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Lengkap: {perlengkapanLengkap}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '9999px', background: '#3b82f6' }} />
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Diserahkan: {sudahDiserahkan}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '9999px', background: '#f59e0b' }} />
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Belum: {belumDiserahkan}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Access Menu */}
            <p style={{ fontWeight: 700, margin: '0 0 0.875rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Menu Utama</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
                {quickLinks.map(ql => (
                    <button key={ql.path} onClick={() => navigate(ql.path)} style={{
                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem',
                        background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.2s', width: '100%',
                    }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = ql.color;
                            (e.currentTarget as HTMLElement).style.background = `${ql.color}10`;
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                            (e.currentTarget as HTMLElement).style.background = '#1a1917';
                        }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '0.75rem', background: `${ql.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '22px', color: ql.color, fontVariationSettings: "'FILL' 1" }}>{ql.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem', color: 'white' }}>{ql.label}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.15rem 0 0 0' }}>{ql.desc}</p>
                        </div>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-text-muted)', flexShrink: 0 }}>chevron_right</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
