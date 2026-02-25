import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface ChartPoint {
    month: string;
    commission: number;
    jamaah: number;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatCompact = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'jt';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'rb';
    return n.toString();
};

export const PerformanceChart: React.FC = () => {
    const { user } = useAuthStore();
    const [data, setData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'commission' | 'jamaah'>('jamaah');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [commRes, jamaahRes] = await Promise.all([
                    apiFetch(`/api/charts/commission-monthly?userId=${user?.id || ''}`),
                    apiFetch(`/api/charts/jamaah-monthly?userId=${user?.id || ''}`)
                ]);

                let commData: any[] = [];
                let jamaahData: any[] = [];

                if (commRes.ok) {
                    const d = await commRes.json();
                    commData = d.data || [];
                }
                if (jamaahRes.ok) {
                    const d = await jamaahRes.json();
                    jamaahData = d.data || [];
                }

                // Merge by month
                const merged: ChartPoint[] = [];
                const maxLen = Math.max(commData.length, jamaahData.length, 1);
                for (let i = 0; i < maxLen; i++) {
                    merged.push({
                        month: commData[i]?.month || jamaahData[i]?.month || '',
                        commission: Number(commData[i]?.commission || 0),
                        jamaah: Number(jamaahData[i]?.jamaah || 0)
                    });
                }

                setData(merged);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', minHeight: 200 }}>
                <div style={{ height: '1rem', width: '40%', background: 'var(--color-border)', borderRadius: '4px', marginBottom: '1rem' }} />
                <div style={{ height: 150, background: 'var(--color-border)', borderRadius: '8px', opacity: 0.3 }} />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.3 }}>bar_chart</span>
                <p>Belum ada data performa.</p>
            </div>
        );
    }

    const values = data.map(d => mode === 'commission' ? d.commission : d.jamaah);
    const maxVal = Math.max(...values, 1);

    // SVG chart dimensions
    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barWidth = Math.min(30, chartW / data.length - 8);

    return (
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>bar_chart</span>
                    Performa 12 Bulan Terakhir
                </h3>
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-bg)', borderRadius: '0.5rem', padding: '0.15rem' }}>
                    <button
                        onClick={() => setMode('jamaah')}
                        style={{
                            padding: '0.35rem 0.75rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                            background: mode === 'jamaah' ? 'var(--color-primary)' : 'transparent',
                            color: mode === 'jamaah' ? '#fff' : 'var(--color-text-muted)'
                        }}
                    >Jamaah</button>
                    <button
                        onClick={() => setMode('commission')}
                        style={{
                            padding: '0.35rem 0.75rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                            background: mode === 'commission' ? 'var(--color-primary)' : 'transparent',
                            color: mode === 'commission' ? '#fff' : 'var(--color-text-muted)'
                        }}
                    >Komisi</button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 400, height: 'auto' }}>
                    {/* Y-axis labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                        const y = padding.top + chartH - frac * chartH;
                        const val = Math.round(maxVal * frac);
                        return (
                            <g key={frac}>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--color-border)" strokeDasharray="3,3" />
                                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-text-muted)">
                                    {mode === 'commission' ? formatCompact(val) : val}
                                </text>
                            </g>
                        );
                    })}

                    {/* Bars */}
                    {data.map((d, i) => {
                        const val = mode === 'commission' ? d.commission : d.jamaah;
                        const barH = maxVal > 0 ? (val / maxVal) * chartH : 0;
                        const x = padding.left + (chartW / data.length) * i + (chartW / data.length - barWidth) / 2;
                        const y = padding.top + chartH - barH;
                        const monthLabel = d.month ? MONTHS_SHORT[parseInt(d.month.split('-')[1]) - 1] || d.month : '';

                        return (
                            <g key={i}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barH}
                                    rx={4}
                                    fill={mode === 'commission' ? '#f59e0b' : 'var(--color-primary)'}
                                    opacity={0.85}
                                >
                                    <title>{`${monthLabel}: ${mode === 'commission' ? formatCompact(val) : val}`}</title>
                                </rect>
                                {/* Value on top */}
                                {val > 0 && (
                                    <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="var(--color-text-muted)" fontWeight="600">
                                        {mode === 'commission' ? formatCompact(val) : val}
                                    </text>
                                )}
                                {/* X-axis label */}
                                <text x={x + barWidth / 2} y={height - padding.bottom + 16} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">
                                    {monthLabel}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
