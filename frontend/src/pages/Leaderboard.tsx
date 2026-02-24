import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface LeaderboardEntry {
    affiliatorId: string;
    name: string;
    role: string;
    affiliateCode: string;
    totalPax: number;
    totalOmset: number;
}

export const Leaderboard: React.FC = () => {
    const { user } = useAuthStore();
    const [timeframe, setTimeframe] = useState<'current_month' | 'all_time'>('current_month');
    const [ranks, setRanks] = useState<LeaderboardEntry[]>([]);
    const [myRank, setMyRank] = useState<{ rank: number; totalPax: number; totalOmset: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const [leaderboardRes, myRankRes] = await Promise.all([
                    api.get(`/leaderboard?timeframe=${timeframe}`),
                    user ? api.get(`/leaderboard/me?userId=${user.id}`) : Promise.resolve(null)
                ]);

                if (leaderboardRes?.ranks) {
                    setRanks(leaderboardRes.ranks);
                }

                if (myRankRes) {
                    setMyRank(myRankRes);
                }
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [timeframe, user]);

    const top3 = ranks.slice(0, 3);
    const rest = ranks.slice(3);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--color-primary)' }}>
                        <span className="material-symbols-outlined" style={{ verticalAlign: 'bottom', fontSize: '2.5rem', marginRight: '0.5rem' }}>trophy</span>
                        Pahlawan Penjualan
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Peringkat kontribusi tertinggi dalam membawa tamu Allah.</p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg-card)', padding: '0.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setTimeframe('current_month')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            background: timeframe === 'current_month' ? 'var(--color-primary)' : 'transparent',
                            color: timeframe === 'current_month' ? '#0a0907' : 'var(--color-text-light)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Bulan Ini
                    </button>
                    <button
                        onClick={() => setTimeframe('all_time')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            background: timeframe === 'all_time' ? 'var(--color-primary)' : 'transparent',
                            color: timeframe === 'all_time' ? '#0a0907' : 'var(--color-text-light)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Sepanjang Waktu
                    </button>
                </div>
            </div>

            {/* My Rank Strip */}
            {myRank && (
                <div style={{ background: 'linear-gradient(90deg, var(--color-primary-bg), var(--color-bg-card))', padding: '1.5rem', borderRadius: '1rem', marginBottom: '3rem', display: 'flex', alignItems: 'center', border: '1px solid var(--color-primary)', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0907', fontWeight: 800, fontSize: '1.25rem' }}>
                            #{myRank.rank > 0 ? myRank.rank : '-'}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>Posisi Anda Saat Ini</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Tingkatkan terus penjualan untuk mencapai posisi puncak!</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Jamaah</p>
                            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{myRank.totalPax} Pax</p>
                        </div>
                        {/* Omset hidden for general users, visible if needed, but lets hide to avoid jealousy. For now, comment out.
                        <div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Omset</p>
                            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{formatCurrency(myRank.totalOmset)}</p>
                        </div> */}
                    </div>
                </div>
            )}

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>Memuat data peringkat...</div>
            ) : ranks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)', background: 'var(--color-bg-card)', borderRadius: '1rem' }}>Belum ada data penjualan.</div>
            ) : (
                <>
                    {/* Podium for Top 3 */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '3rem', minHeight: '300px' }}>

                        {/* Rank 2 - Silver */}
                        {top3[1] && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28%' }}>
                                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{top3[1].name}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#B4B4B4', background: 'rgba(180, 180, 180, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>{top3[1].role.toUpperCase()}</span>
                                </div>
                                <div style={{ background: 'linear-gradient(180deg, #E0E0E0 0%, #B4B4B4 100%)', width: '100%', height: '160px', borderRadius: '1rem 1rem 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem', color: '#2a2a2a', boxShadow: '0 -4px 20px rgba(180, 180, 180, 0.15)' }}>
                                    <span style={{ fontSize: '3rem', fontWeight: 900 }}>2</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 'auto', marginBottom: '1rem' }}>{top3[1].totalPax} Jamaah</span>
                                </div>
                            </div>
                        )}

                        {/* Rank 1 - Gold */}
                        {top3[0] && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32%', zIndex: 10 }}>
                                <span className="material-symbols-outlined" style={{ color: '#FFD700', fontSize: '3rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))' }}>military_tech</span>
                                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--color-text)', fontWeight: 800 }}>{top3[0].name}</h4>
                                    <span style={{ fontSize: '0.8rem', color: '#FFD700', background: 'rgba(255, 215, 0, 0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>{top3[0].role.toUpperCase()}</span>
                                </div>
                                <div style={{ background: 'linear-gradient(180deg, #FFD700 0%, #D4AF37 100%)', width: '100%', height: '220px', borderRadius: '1rem 1rem 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem', color: '#1a180e', boxShadow: '0 -4px 30px rgba(255, 215, 0, 0.25)' }}>
                                    <span style={{ fontSize: '4rem', fontWeight: 900 }}>1</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 800, marginTop: 'auto', marginBottom: '1rem' }}>{top3[0].totalPax} Jamaah</span>
                                </div>
                            </div>
                        )}

                        {/* Rank 3 - Bronze */}
                        {top3[2] && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28%' }}>
                                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{top3[2].name}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#CD7F32', background: 'rgba(205, 127, 50, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>{top3[2].role.toUpperCase()}</span>
                                </div>
                                <div style={{ background: 'linear-gradient(180deg, #E0A96D 0%, #CD7F32 100%)', width: '100%', height: '140px', borderRadius: '1rem 1rem 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem', color: '#2a1a0c', boxShadow: '0 -4px 20px rgba(205, 127, 50, 0.15)' }}>
                                    <span style={{ fontSize: '3rem', fontWeight: 900 }}>3</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 'auto', marginBottom: '1rem' }}>{top3[2].totalPax} Jamaah</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rest of the ranks table */}
                    {rest.length > 0 && (
                        <div style={{ background: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '1rem 1.5rem', width: '80px', textAlign: 'center' }}>Posisi</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Pahlawan</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Role</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Total Jamaah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rest.map((entry, idx) => (
                                        <tr key={entry.affiliatorId} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s', ':hover': { background: 'var(--color-bg-hover)' } } as any}>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                                                {idx + 4}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{entry.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{entry.affiliateCode}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', background: 'var(--color-bg)', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                                    {entry.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                {entry.totalPax} Pax
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
