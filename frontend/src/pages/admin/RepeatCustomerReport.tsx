import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';

interface RepeatCustomer {
    pilgrimId: string;
    nik: string;
    name: string;
    tripCount: number;
    lastTrip: string;
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const RepeatCustomerReport: React.FC = () => {
    const [data, setData] = useState<RepeatCustomer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRepeat = async () => {
            try {
                const res = await apiClient.get('/reports/repeat-customers');
                if (res.repeatCustomers) {
                    setData(res.repeatCustomers);
                }
            } catch (err) {
                console.error('Failed to fetch repeat customers', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRepeat();
    }, []);

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat laporan jamaah repeat...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(200, 168, 81, 0.1)', color: 'var(--color-primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>group_add</span>
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>Repeat Customer Report</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.95rem' }}>Daftar jamaah yang telah berangkat lebih dari satu kali</p>
                </div>
            </div>

            {/* Summary Card */}
            <div style={{ background: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(200, 168, 81, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>loyalty</span>
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>{data.length}</h2>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '1rem' }}>Total Jamaah Repeat (Loyal Customers)</p>
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Daftar Jamaah Loyal</h3>
                </div>

                {data.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>sentiment_dissatisfied</span>
                        Belum ada jamaah yang berangkat lebih dari 1 kali.
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '1rem 1.5rem' }}>Nama Jamaah</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>NIK KTP</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Total Perjalanan</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Keberangkatan Terakhir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(customer => (
                                    <tr key={customer.pilgrimId} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.95rem' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#fff' }}>{customer.name}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: 'var(--color-text-light)' }}>{customer.nik}</td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                            <span style={{ background: 'rgba(200, 168, 81, 0.15)', color: 'var(--color-primary)', padding: '0.2rem 0.8rem', borderRadius: '99px', fontWeight: 700 }}>
                                                {customer.tripCount}x
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)' }}>{formatDate(customer.lastTrip)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
