import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Link } from 'react-router-dom';

const cardStyle: React.CSSProperties = {
    background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem',
};

const statCardStyle: React.CSSProperties = {
    background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.25rem',
    display: 'flex', alignItems: 'center', gap: '1rem',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase' as any, letterSpacing: '0.05em',
};

const DepartureManage: React.FC = () => {
    const [departures, setDepartures] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchDepartures = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<{ departures: any[], summary: any }>('/api/departures');
            setDepartures(data.departures || []);
            setSummary(data.summary || null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDepartures(); }, []);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'available': return { label: 'Available', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
            case 'last_call': return { label: 'Last Call', color: '#eab308', bg: 'rgba(234,179,8,0.1)' };
            case 'full': return { label: 'Full', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
            case 'departed': return { label: 'Departed', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
            default: return { label: status, color: '#888', bg: 'rgba(136,136,136,0.1)' };
        }
    };

    const getSiskoLabel = (status: string) => {
        switch (status) {
            case 'synced': return { label: 'Synced', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
            case 'pending': return { label: 'Pending', color: '#eab308', bg: 'rgba(234,179,8,0.1)' };
            case 'error': return { label: 'Error', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
            default: return { label: status || 'N/A', color: '#888', bg: 'rgba(136,136,136,0.1)' };
        }
    };

    return (
        <div className="animate-in fade-in duration-700" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Jadwal Keberangkatan</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Pantau seluruh jadwal keberangkatan, status kuota, dan sinkronisasi SISKOPATUH.</p>
                </div>
                <button onClick={fetchDepartures} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
                    background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '0.5rem',
                    color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
                    Segarkan Data
                </button>
            </div>

            {/* Summary Metrics */}
            {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={statCardStyle}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>calendar_month</span>
                        </div>
                        <div>
                            <p style={labelStyle}>Total Jadwal</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>{summary.totalDepartures}</p>
                        </div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>group</span>
                        </div>
                        <div>
                            <p style={labelStyle}>Kursi Terisi</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>{summary.bookedSeats} <span style={{ fontSize: '0.875rem', color: '#888' }}>/ {summary.totalSeats}</span></p>
                        </div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: '#22c55e' }}>check_circle</span>
                        </div>
                        <div>
                            <p style={labelStyle}>Sisko Tersinkron</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>{summary.siskopatuh?.synced || 0}</p>
                        </div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: '#eab308' }}>schedule</span>
                        </div>
                        <div>
                            <p style={labelStyle}>Sisko Pending</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>
                                {summary.siskopatuh?.pending || 0}
                                {summary.siskopatuh?.error > 0 && <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, marginLeft: '0.5rem' }}>({summary.siskopatuh?.error} Error)</span>}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Departures List */}
            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</div>
            ) : departures.length === 0 ? (
                <div style={{ ...cardStyle, padding: '4rem', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary)', display: 'block', marginBottom: '1rem' }}>flight_takeoff</span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: '0 0 0.5rem 0' }}>Belum Ada Jadwal</h3>
                    <p style={{ fontSize: '0.875rem', color: '#888', margin: 0 }}>Jadwal keberangkatan ditambahkan melalui halaman kelola detail masing-masing paket.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                    {departures.map(dep => {
                        const progress = dep.totalSeats > 0 ? (dep.bookedSeats / dep.totalSeats) * 100 : 0;
                        const statusInfo = getStatusLabel(dep.status);
                        const siskoInfo = getSiskoLabel(dep.siskopatuhStatus);

                        return (
                            <div key={dep.id} style={cardStyle}>
                                {/* Badges */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.625rem', fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                                        borderRadius: '0.375rem', background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}33`,
                                    }}>{statusInfo.label}</span>
                                    <span style={{
                                        padding: '0.25rem 0.625rem', fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                                        borderRadius: '0.375rem', background: siskoInfo.bg, color: siskoInfo.color, display: 'flex', alignItems: 'center', gap: '0.25rem',
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                                            {dep.siskopatuhStatus === 'synced' ? 'check_circle' : dep.siskopatuhStatus === 'error' ? 'error' : 'schedule'}
                                        </span>
                                        Sisko: {siskoInfo.label}
                                    </span>
                                </div>

                                {/* Title & Date */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: '0 0 0.35rem 0' }}>{dep.tripName || dep.package?.name || 'Paket Reguler'}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#888' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_month</span>
                                                {new Date(dep.departureDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            {dep.departureAirline && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>flight</span>
                                                    {dep.departureAirline.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'white' }}>{dep.departureAirport?.code || dep.airport}</div>
                                        <div style={{ fontSize: '0.625rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>({dep.departureAirport?.city || 'CGK'})</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={labelStyle}>Keterisian Kuota</span>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'white' }}>
                                            {dep.bookedSeats} <span style={{ color: '#888' }}>/ {dep.totalSeats} Pax</span>
                                        </span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: '999px', transition: 'width 1s ease',
                                            width: `${Math.min(progress, 100)}%`,
                                            background: progress >= 100 ? '#ef4444' : progress > 75 ? '#eab308' : 'var(--color-primary)',
                                        }} />
                                    </div>
                                </div>

                                {/* Room Badges */}
                                {dep.roomTypes && dep.roomTypes.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <span style={{ ...labelStyle, display: 'block', marginBottom: '0.375rem' }}>Opsi Kamar Aktif</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                            {dep.roomTypes.map((room: any) => (
                                                <span key={room.id} style={{
                                                    padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '0.375rem', fontSize: '0.6875rem', fontWeight: 600, color: '#ccc',
                                                }}>{room.name} ({room.capacity} Pax)</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => alert('Modul Export Siskopatuh belum aktif.')} style={{
                                            padding: '0.375rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
                                            background: 'transparent', border: '1px solid #333', borderRadius: '0.5rem', color: '#888', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>bar_chart</span>
                                            SISKO
                                        </button>
                                        <button onClick={() => alert('Modul Export Manifest belum aktif.')} style={{
                                            padding: '0.375rem 0.75rem', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
                                            background: 'transparent', border: '1px solid #333', borderRadius: '0.5rem', color: '#888', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
                                            Manifest
                                        </button>
                                    </div>
                                    <Link to={`/admin/packages/${dep.packageId}`} style={{
                                        padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 700,
                                        background: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderRadius: '0.5rem',
                                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem',
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                                        Kelola Detail
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DepartureManage;
