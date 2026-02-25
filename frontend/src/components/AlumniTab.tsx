import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface AlumniData {
    pilgrim: {
        id: string;
        name: string;
        noKtp: string;
        phone: string;
        address: string;
    };
    tripCount: number;
    lastTrip?: {
        departureDate: string;
        tripName?: string;
        package?: {
            name: string;
        };
    };
    lastBooking?: {
        bookingStatus: string;
        paymentStatus: string;
    };
}

export const AlumniTab: React.FC = () => {
    const [alumni, setAlumni] = useState<AlumniData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRepeat, setFilterRepeat] = useState(false);

    useEffect(() => {
        const fetchAlumni = async () => {
            try {
                const res = await apiFetch('/api/alumni');
                if (res.ok) {
                    const data = await res.json();
                    setAlumni(data.alumni || []);
                }
            } catch (err) {
                console.error("Failed to fetch alumni", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlumni();
    }, []);

    const handleFollowUp = (phone: string, name: string) => {
        const msg = encodeURIComponent(`Assalamualaikum Bapak/Ibu ${name},\n\nSemoga sehat selalu. Kami dari Al Madinah ingin menginformasikan promo khusus alumni untuk keberangkatan Umroh bulan depan...`);
        const url = `https://wa.me/${phone.replace(/^0/, '62')}?text=${msg}`;
        window.open(url, '_blank');
    };

    const displayData = alumni.filter(a => {
        const matchSearch = a.pilgrim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.pilgrim.noKtp.includes(searchTerm);
        const matchFilter = filterRepeat ? a.tripCount >= 2 : true;
        return matchSearch && matchFilter;
    });

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data alumni...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '18px' }}>search</span>
                        <input
                            type="text"
                            placeholder="Cari nama / NIK..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', minWidth: '250px', outline: 'none' }}
                        />
                    </div>

                    <button
                        onClick={() => setFilterRepeat(!filterRepeat)}
                        style={{
                            padding: '0.625rem 1rem',
                            borderRadius: '0.5rem',
                            border: `1px solid ${filterRepeat ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            backgroundColor: filterRepeat ? 'rgba(200, 168, 81, 0.1)' : 'var(--color-bg)',
                            color: filterRepeat ? 'var(--color-primary)' : 'var(--color-text)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>workspace_premium</span>
                        Repeat Customer (2x+)
                    </button>
                </div>
            </div>

            <div style={{ background: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jamaah</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Riwayat</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Terakhir</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.map((item, index) => (
                                <tr key={index} style={{ borderBottom: index < displayData.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background-color 0.2s' }}>

                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{item.pilgrim.name}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>NIK: {item.pilgrim.noKtp}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>call</span>
                                                {item.pilgrim.phone}
                                            </span>
                                        </div>
                                    </td>

                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        {item.tripCount >= 2 ? (
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(200, 168, 81, 0.1)', color: 'var(--color-primary)', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(200, 168, 81, 0.3)' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>workspace_premium</span>
                                                {item.tripCount}x Keberangkatan
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}>1x Keberangkatan</span>
                                        )}
                                        {item.lastTrip && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                Terakhir: {item.lastTrip.package?.name || item.lastTrip.tripName || 'Paket Umroh'}
                                            </div>
                                        )}
                                    </td>

                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            {item.lastBooking?.paymentStatus === 'paid' ?
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#4caf50', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span> Lunas
                                                </span> :
                                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.lastBooking?.paymentStatus}</span>
                                            }
                                        </div>
                                    </td>

                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleFollowUp(item.pilgrim.phone, item.pilgrim.name)}
                                            style={{
                                                background: '#25D366',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '0.5rem',
                                                fontWeight: 600,
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                boxShadow: '0 2px 4px rgba(37, 211, 102, 0.2)',
                                                transition: 'transform 0.1s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                                            Follow Up
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {displayData.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '1rem', opacity: 0.5 }}>group_off</span>
                            <p>Tidak ada data alumni ditemukan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
