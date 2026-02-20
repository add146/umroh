import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

interface CommissionRule {
    id: string;
    userId: string;
    targetRole: string;
    commissionType: 'flat' | 'percentage';
    commissionValue: number;
    createdAt: string;
    user?: { name: string; role: string };
}

interface LedgerEntry {
    id: string;
    userId: string;
    bookingId: string;
    role: string;
    amount: number;
    commissionType: string;
    status: 'pending' | 'paid';
    createdAt: string;
    paidAt: string | null;
    user?: { name: string };
    booking?: { pilgrim: { name: string } };
}

interface User {
    id: string;
    name: string;
    role: string;
    affiliateCode: string;
}

const CommissionManage: React.FC = () => {
    const [rules, setRules] = useState<CommissionRule[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'rules' | 'ledger'>('rules');
    const [showForm, setShowForm] = useState(false);
    const [disbursing, setDisbursing] = useState<string | null>(null);

    const [form, setForm] = useState({
        userId: '',
        targetRole: 'reseller',
        commissionType: 'percentage',
        commissionValue: 3,
    });

    const load = async () => {
        setLoading(true);
        try {
            const [r, l, u] = await Promise.all([
                apiClient.get('/affiliate/commission-rules'),
                apiClient.get('/affiliate/ledger'),
                apiClient.get('/users/downline'),
            ]);
            setRules(Array.isArray(r) ? r : []);
            setLedger(Array.isArray(l) ? l : []);
            const users = u?.downline || u?.users || [];
            setAllUsers(Array.isArray(users) ? users : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/affiliate/commission-rules', form);
            setShowForm(false);
            setForm({ userId: '', targetRole: 'reseller', commissionType: 'percentage', commissionValue: 3 });
            await load();
        } catch (e) {
            alert('Gagal membuat rule komisi');
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm('Hapus rule komisi ini?')) return;
        await apiClient.delete(`/affiliate/commission-rules/${id}`);
        await load();
    };

    const handleDisburse = async (id: string) => {
        if (!confirm('Tandai komisi ini sudah dibayarkan?')) return;
        setDisbursing(id);
        try {
            await apiClient.post(`/affiliate/ledger/${id}/disburse`, {});
            await load();
        } catch (e) {
            alert('Gagal disburse komisi');
        } finally {
            setDisbursing(null);
        }
    };

    const pendingTotal = ledger.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
    const paidTotal = ledger.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <p style={{ color: 'var(--color-text-light)' }}>Memuat data komisi…</p>
        </div>
    );

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>💰 Manajemen Komisi</h1>
                    <p style={{ color: 'var(--color-text-light)', marginTop: '0.25rem' }}>Atur aturan komisi dan kelola pencairan</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'Total Entri Ledger', value: ledger.length, color: '#1a1a2e' },
                    { label: 'Komisi Pending', value: formatCurrency(pendingTotal), color: '#d97706' },
                    { label: 'Total Dicairkan', value: formatCurrency(paidTotal), color: '#16a34a' },
                    { label: 'Aturan Komisi Aktif', value: rules.length, color: '#7c3aed' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{ flex: 1, minWidth: '220px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>{label}</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)' }}>
                {(['rules', 'ledger'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '0.75rem 1.5rem', fontWeight: activeTab === tab ? 700 : 400,
                        color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-light)',
                        borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                        marginBottom: '-2px', background: 'none', border: 'none', cursor: 'pointer'
                    }}>
                        {tab === 'rules' ? `⚙️ Aturan Komisi (${rules.length})` : `📒 Ledger Komisi (${ledger.length})`}
                    </button>
                ))}
            </div>

            {/* RULES TAB */}
            {activeTab === 'rules' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button onClick={() => setShowForm(!showForm)} style={{
                            background: 'var(--color-primary)', color: 'white',
                            padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer'
                        }}>
                            {showForm ? '✕ Batal' : '+ Tambah Aturan'}
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleCreateRule} style={{
                            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px',
                            padding: '1.5rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'
                        }}>
                            <div style={{ gridColumn: '1/-1' }}>
                                <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Tambah Aturan Komisi Baru</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>Rule: user X memberikan komisi ke downline dengan role targetRole ketika booking terkonfirmasi</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>User (Pemilik Aturan)</label>
                                <select value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} required
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <option value="">Pilih user...</option>
                                    {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Target Role Downline</label>
                                <select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    {['cabang', 'mitra', 'agen', 'reseller'].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tipe Komisi</label>
                                <select value={form.commissionType} onChange={e => setForm({ ...form, commissionType: e.target.value })}
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <option value="percentage">Persentase (%)</option>
                                    <option value="flat">Flat (Rp)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    Nilai {form.commissionType === 'percentage' ? '(%)' : '(Rp)'}
                                </label>
                                <input type="number" min={0} value={form.commissionValue}
                                    onChange={e => setForm({ ...form, commissionValue: parseFloat(e.target.value) })}
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" style={{ background: 'var(--color-primary)', color: 'white', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                                    Simpan Aturan
                                </button>
                            </div>
                        </form>
                    )}

                    <div style={{ background: 'var(--color-bg-card)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                        {rules.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                                <p>Belum ada aturan komisi. Klik "Tambah Aturan" untuk memulai.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                                        {['User Pemilik', 'Target Role', 'Tipe', 'Nilai', 'Aksi'].map(h => (
                                            <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <p style={{ fontWeight: 600 }}>{r.user?.name || r.userId}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'capitalize' }}>{r.user?.role}</p>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{r.targetRole}</span>
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>{r.commissionType === 'percentage' ? 'Persentase' : 'Flat'}</td>
                                            <td style={{ padding: '0.875rem 1rem', fontWeight: 700 }}>
                                                {r.commissionType === 'percentage' ? `${r.commissionValue}%` : formatCurrency(r.commissionValue)}
                                            </td>
                                            <td style={{ padding: '0.875rem 1rem' }}>
                                                <button onClick={() => handleDeleteRule(r.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>Hapus</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* LEDGER TAB */}
            {activeTab === 'ledger' && (
                <div style={{ background: 'var(--color-bg-card)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    {ledger.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                            <p>Belum ada entri ledger komisi</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                                    {['Penerima Komisi', 'Jamaah', 'Jumlah', 'Status', 'Tgl Dibuat', 'Aksi'].map(h => (
                                        <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ledger.map(e => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <p style={{ fontWeight: 600 }}>{e.user?.name || e.userId}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'capitalize' }}>{e.role}</p>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>{e.booking?.pilgrim?.name || '-'}</td>
                                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#16a34a' }}>{formatCurrency(e.amount)}</td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                                                background: e.status === 'paid' ? '#dcfce7' : '#fef3c7',
                                                color: e.status === 'paid' ? '#16a34a' : '#d97706'
                                            }}>
                                                {e.status === 'paid' ? '✓ Dibayar' : '⏳ Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                                            {new Date(e.createdAt).toLocaleDateString('id-ID')}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            {e.status === 'pending' ? (
                                                <button
                                                    onClick={() => handleDisburse(e.id)}
                                                    disabled={disbursing === e.id}
                                                    style={{
                                                        background: '#16a34a', color: 'white',
                                                        padding: '0.4rem 0.875rem', borderRadius: '6px',
                                                        fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.8rem'
                                                    }}
                                                >
                                                    {disbursing === e.id ? '…' : '💸 Cairkan'}
                                                </button>
                                            ) : (
                                                <span style={{ color: '#16a34a', fontSize: '0.8rem' }}>✓ Lunas</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommissionManage;
