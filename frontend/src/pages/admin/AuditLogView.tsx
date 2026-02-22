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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>Security & Audit Log</h1>
                <p style={{ color: 'var(--color-text-light)' }}>Log rekam jejak sistem untuk keamanan dan pemantauan anti-bypass.</p>
            </div>

            <div style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ backgroundColor: '#fef2f2' }}>
                        <tr>
                            <th style={{ padding: '1rem', color: '#991b1b' }}>Waktu</th>
                            <th style={{ padding: '1rem', color: '#991b1b' }}>User ID</th>
                            <th style={{ padding: '1rem', color: '#991b1b' }}>Action</th>
                            <th style={{ padding: '1rem', color: '#991b1b' }}>Target Tipe</th>
                            <th style={{ padding: '1rem', color: '#991b1b' }}>Target ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Tidak ada log ditemukan</td></tr>
                        ) : logs.map(l => (
                            <tr key={l.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{new Date(l.createdAt).toLocaleString('id-ID')}</td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{l.userId.substring(0, 8)}...</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>
                                        {formatAction(l.action)}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>{l.targetType || '-'}</td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{l.targetId?.substring(0, 8) || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
