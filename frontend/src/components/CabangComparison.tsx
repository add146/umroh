import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

interface CabangStat {
    id: string;
    name: string;
    totalJamaah: number;
    revenue: number;
    conversionRate: number;
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export const CabangComparison: React.FC = () => {
    const [data, setData] = useState<CabangStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComparison = async () => {
            try {
                const res = await apiClient.get('/reports/cabang-comparison');
                if (res.cabangComparison) {
                    setData(res.cabangComparison);
                }
            } catch (err) {
                console.error('Failed to fetch cabang comparison', err);
            } finally {
                setLoading(false);
            }
        };
        fetchComparison();
    }, []);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat perbandingan cabang...</div>;
    }

    if (data.length === 0) {
        return (
            <div style={{ background: 'var(--color-bg-card)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                Belum ada data cabang yang tersedia.
            </div>
        );
    }

    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

    return (
        <div style={{ background: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Performa Cabang</h3>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-text-muted)' }}>bar_chart</span>
            </div>

            {/* SVG Bar Chart (Top 5) */}
            <div style={{ marginBottom: '2rem', height: '180px', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                {data.slice(0, 5).map((cabang, index) => {
                    const heightPct = Math.max((cabang.revenue / maxRevenue) * 100, 5); // min 5% height for visibility
                    return (
                        <div key={cabang.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', paddingBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                {formatCurrency(cabang.revenue)}
                            </div>
                            <div style={{
                                width: '100%',
                                maxWidth: '40px',
                                height: `${heightPct}%`,
                                background: index === 0 ? 'var(--color-primary)' : 'rgba(200, 168, 81, 0.4)',
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.5s ease'
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '0',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--color-text)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '90%',
                                textAlign: 'center'
                            }}>
                                {cabang.name}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detailed Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '0.75rem 0.5rem', width: '40px' }}>#</th>
                            <th style={{ padding: '0.75rem 0.5rem' }}>Nama Cabang</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total Jamaah</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Revenue</th>
                            <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Konversi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((cabang, idx) => (
                            <tr key={cabang.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: idx === 0 ? 'var(--color-primary)' : 'inherit' }}>{idx + 1}</td>
                                <td style={{ padding: '0.75rem 0.5rem' }}>{cabang.name}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>{cabang.totalJamaah}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--color-primary)' }}>{formatCurrency(cabang.revenue)}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        background: cabang.conversionRate > 50 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: cabang.conversionRate > 50 ? '#22c55e' : '#ef4444'
                                    }}>
                                        {cabang.conversionRate}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
