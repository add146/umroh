import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';

export const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const [cabangs, setCabangs] = useState<any[]>([]);
    const [selectedCabang, setSelectedCabang] = useState<string>('');
    const [stats, setStats] = useState([
        { label: 'Total Jamaah', value: '0' },
        { label: 'Pemesanan Aktif', value: '0' },
        { label: 'Saldo Komisi', value: 'Rp 0' },
    ]);

    useEffect(() => {
        if (user?.role === 'pusat') {
            apiFetch('/api/users').then(res => res.json()).then(data => {
                setCabangs(data.users?.filter((u: any) => u.role === 'cabang') || []);
            });
        }
    }, [user]);

    useEffect(() => {
        const fetchStats = async () => {
            let url = '/api/bookings';
            if (user?.role === 'pusat' && selectedCabang) {
                url += `?cabang_id=${selectedCabang}`;
            }
            try {
                const res = await apiFetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const b = data.bookings || [];
                    const activeBookings = b.filter((x: any) => x.bookingStatus === 'pending' || x.bookingStatus === 'confirmed');

                    setStats([
                        { label: 'Total Jamaah Baru', value: b.length.toString() },
                        { label: 'Pemesanan Aktif', value: activeBookings.length.toString() },
                        { label: 'Estimasi Pemasukan', value: 'Lihat Laporan' },
                    ]);
                }
            } catch (err) {
                console.error('Failed to fetch stats', err);
            }
        };
        fetchStats();
    }, [selectedCabang, user]);

    return (
        <div>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        Welcome back, {user?.name}!
                    </h1>
                    <p style={{ color: 'var(--color-text-light)' }}>
                        Your {user?.role} dashboard overview for today.
                    </p>
                </div>

                {user?.role === 'pusat' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-bg-card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-text-muted)' }}>filter_alt</span>
                        <select
                            value={selectedCabang}
                            onChange={e => setSelectedCabang(e.target.value)}
                            style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}
                        >
                            <option value="">Semua Cabang (Global)</option>
                            {cabangs.map(c => (
                                <option key={c.id} value={c.id}>Cabang: {c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {stats.map((stat) => (
                    <div key={stat.label} style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                            {stat.label}
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Recent Activity</h3>
                <p style={{ color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                    No recent activity to display.
                </p>
            </div>
        </div>
    );
};
