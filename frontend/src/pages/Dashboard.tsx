import React from 'react';
import { useAuthStore } from '../stores/authStore';

export const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();

    const stats = [
        { label: 'Total Jamaah', value: '42' },
        { label: 'Pemesanan Aktif', value: '12' },
        { label: 'Saldo Komisi', value: 'Rp 2.400.000' },
    ];

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Welcome back, {user?.name}!
                </h1>
                <p style={{ color: 'var(--color-text-light)' }}>
                    Your {user?.role} dashboard overview for today.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
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
