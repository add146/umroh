import React, { useEffect, useState } from 'react';
import { apiClient as api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export const TargetWidget: React.FC = () => {
    const { user } = useAuthStore();
    const [progress, setProgress] = useState(0);


    // Default monthly target
    const monthlyTarget = 10;

    useEffect(() => {
        const fetchProgress = async () => {
            if (!user) return;
            try {
                const res = await api.get(`/leaderboard/me?userId=${user.id}&timeframe=current_month`);
                if (res && typeof res.totalPax === 'number') {
                    setProgress(res.totalPax);
                }
            } catch (error) {
                console.error('Error fetching target progress:', error);
            }
        };

        fetchProgress();
    }, [user]);

    const percentage = Math.min(100, Math.round((progress / monthlyTarget) * 100));

    // Determine color and text based on progress
    let barColor = 'var(--color-primary)';
    let message = 'Ayo kejar target bulan ini!';
    let icon = 'flag';

    if (percentage >= 100) {
        barColor = '#4caf50';
        message = 'Alhamdulillah! Target bulan ini tercapai 🎉';
        icon = 'verified';
    } else if (percentage >= 70) {
        barColor = '#ff9800';
        message = 'Sedikit lagi! Tetap semangat 🚀';
        icon = 'local_fire_department';
    } else if (percentage >= 30) {
        barColor = 'var(--color-primary)';
        message = 'Luar biasa, tingkatkan terus penjualan Anda!';
        icon = 'trending_up';
    }

    return (
        <div style={{ background: 'linear-gradient(135deg, rgba(200, 168, 81, 0.1) 0%, rgba(10, 9, 7, 0) 100%)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', position: 'relative', overflow: 'hidden' }}>

            {/* Background decoration */}
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '100px', color: 'rgba(200, 168, 81, 0.05)', userSelect: 'none', zIndex: 0 }}>
                target
            </span>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: barColor, fontSize: '20px' }}>{icon}</span>
                        Target Penjualan Bulanan
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{message}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>{progress}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}> / {monthlyTarget} Pax</span>
                </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: barColor }}>
                    <span>{percentage}% Tercapai</span>
                </div>
                {/* Progress track */}
                <div style={{ width: '100%', height: '10px', background: 'var(--color-bg)', borderRadius: '99px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
                    {/* Progress Fill */}
                    <div style={{ width: `${percentage}%`, height: '100%', background: barColor, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '99px' }} />
                </div>
            </div>

        </div>
    );
};
