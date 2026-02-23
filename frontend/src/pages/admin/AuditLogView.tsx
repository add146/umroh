import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export const AuditLogView: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const res = await apiFetch('/api/audit-log');
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ');
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 0.5rem 0' }}>Security & Audit Log</h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Log rekam jejak sistem untuk keamanan dan pemantauan anti-bypass.</p>
            </div>

            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Waktu</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>User ID</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Action</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Target Tipe</th>
                            <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Target ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat log...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Tidak ada log ditemukan</td></tr>
                        ) : logs.map(l => (
                            <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)', fontWeight: 500 }}>{new Date(l.createdAt).toLocaleString('id-ID')}</td>
                                <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: '#888', fontSize: '0.75rem' }}>{l.userId.substring(0, 8)}...</td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.75rem', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        {formatAction(l.action)}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', color: 'var(--color-primary)', fontWeight: 500 }}>{l.targetType || '-'}</td>
                                <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: '#888', fontSize: '0.75rem' }}>{l.targetId?.substring(0, 8) || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
