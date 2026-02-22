import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

interface CommissionRule { id: string; userId: string; targetRole: string; commissionType: 'flat' | 'percentage'; commissionValue: number; createdAt: string; user?: { name: string; role: string }; }
interface LedgerEntry { id: string; userId: string; bookingId: string; role: string; amount: number; commissionType: string; status: 'pending' | 'paid'; createdAt: string; paidAt: string | null; user?: { name: string }; booking?: { pilgrim: { name: string } }; }
interface User { id: string; name: string; role: string; affiliateCode: string; }

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)', fontWeight: 600 };
const thStyle: React.CSSProperties = { padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem' };
const tdStyle: React.CSSProperties = { padding: '1rem 1.5rem' };

const CommissionManage: React.FC = () => {
    const [rules, setRules] = useState<CommissionRule[]>([]);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'rules' | 'ledger'>('rules');
    const [showForm, setShowForm] = useState(false);
    const [disbursing, setDisbursing] = useState<string | null>(null);
    const [form, setForm] = useState({ userId: '', targetRole: 'reseller', commissionType: 'percentage', commissionValue: 3 });

    const load = async () => {
        setLoading(true);
        try {
            const [r, l, u] = await Promise.all([apiClient.get('/affiliate/commission-rules'), apiClient.get('/affiliate/ledger'), apiClient.get('/users/downline')]);
            setRules(Array.isArray(r) ? r : []);
            setLedger(Array.isArray(l) ? l : []);
            const users = u?.downline || u?.users || [];
            setAllUsers(Array.isArray(users) ? users : []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try { await apiClient.post('/affiliate/commission-rules', form); setShowForm(false); setForm({ userId: '', targetRole: 'reseller', commissionType: 'percentage', commissionValue: 3 }); await load(); }
        catch (e) { alert('Gagal membuat rule komisi'); }
    };

    const handleDeleteRule = async (id: string) => { if (!confirm('Hapus rule komisi ini?')) return; await apiClient.delete(`/affiliate/commission-rules/${id}`); await load(); };

    const handleDisburse = async (id: string) => {
        if (!confirm('Tandai komisi ini sudah dibayarkan?')) return;
        setDisbursing(id);
        try { await apiClient.post(`/affiliate/ledger/${id}/disburse`, {}); await load(); }
        catch (e) { alert('Gagal disburse komisi'); } finally { setDisbursing(null); }
    };

    const pendingTotal = ledger.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
    const paidTotal = ledger.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--color-text-muted)' }}>Memuat data komisi…</div>;

    return (
        <div className="animate-in fade-in duration-700" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Manajemen Komisi</h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Atur aturan komisi dan kelola pencairan</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Entri Ledger', value: String(ledger.length), icon: 'receipt_long', color: 'var(--color-primary)' },
                    { label: 'Komisi Pending', value: formatCurrency(pendingTotal), icon: 'hourglass_top', color: '#eab308' },
                    { label: 'Total Dicairkan', value: formatCurrency(paidTotal), icon: 'payments', color: '#22c55e' },
                    { label: 'Aturan Komisi Aktif', value: String(rules.length), icon: 'tune', color: '#a78bfa' },
                ].map(({ label, value, icon, color }) => (
                    <div key={label} style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0' }}>{label}</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 800, color, margin: 0 }}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                {(['rules', 'ledger'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '0.75rem 1.5rem', fontWeight: activeTab === tab ? 700 : 400, fontSize: '0.875rem',
                        color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                        marginBottom: '-1px', background: 'none', border: 'none', cursor: 'pointer',
                        borderBottomWidth: '2px', borderBottomStyle: 'solid', borderBottomColor: activeTab === tab ? 'var(--color-primary)' : 'transparent',
                    }}>
                        {tab === 'rules' ? `Aturan Komisi (${rules.length})` : `Ledger Komisi (${ledger.length})`}
                    </button>
                ))}
            </div>

            {/* RULES TAB */}
            {activeTab === 'rules' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button onClick={() => setShowForm(!showForm)} style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                            background: showForm ? 'rgba(239,68,68,0.1)' : 'var(--color-primary)',
                            color: showForm ? '#ef4444' : 'white',
                            borderRadius: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showForm ? 'close' : 'add'}</span>
                            {showForm ? 'Batal' : 'Tambah Aturan'}
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={handleCreateRule} style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Tambah Aturan Komisi Baru</h3>
                            <p style={{ fontSize: '0.8125rem', color: '#888', margin: '0 0 1.25rem 0' }}>Rule: user X memberikan komisi ke downline dengan role targetRole ketika booking terkonfirmasi</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>User (Pemilik Aturan)</label>
                                    <select value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} required style={inputStyle}>
                                        <option value="">Pilih user...</option>
                                        {allUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Target Role Downline</label>
                                    <select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} style={inputStyle}>
                                        {['cabang', 'mitra', 'agen', 'reseller'].map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Tipe Komisi</label>
                                    <select value={form.commissionType} onChange={e => setForm({ ...form, commissionType: e.target.value })} style={inputStyle}>
                                        <option value="percentage">Persentase (%)</option>
                                        <option value="flat">Flat (Rp)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Nilai {form.commissionType === 'percentage' ? '(%)' : '(Rp)'}</label>
                                    <input type="number" min={0} value={form.commissionValue} onChange={e => setForm({ ...form, commissionValue: parseFloat(e.target.value) })} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="submit" style={{ padding: '0.875rem 2rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>Simpan Aturan</button>
                            </div>
                        </form>
                    )}

                    <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                        {rules.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada aturan komisi. Klik "Tambah Aturan" untuk memulai.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={thStyle}>User Pemilik</th><th style={thStyle}>Target Role</th><th style={thStyle}>Tipe</th><th style={thStyle}>Nilai</th><th style={{ ...thStyle, textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rules.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={tdStyle}>
                                                <p style={{ fontWeight: 700, color: 'white', margin: '0 0 0.125rem 0' }}>{r.user?.name || r.userId}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#888', margin: 0, textTransform: 'capitalize' }}>{r.user?.role}</p>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', padding: '0.25rem 0.625rem', borderRadius: '0.25rem', fontSize: '0.8125rem', fontWeight: 600 }}>{r.targetRole}</span>
                                            </td>
                                            <td style={tdStyle}>{r.commissionType === 'percentage' ? 'Persentase' : 'Flat'}</td>
                                            <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-primary)' }}>{r.commissionType === 'percentage' ? `${r.commissionValue}%` : formatCurrency(r.commissionValue)}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteRule(r.id)} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>delete</span>
                                                </button>
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
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                    {ledger.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada entri ledger komisi</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={thStyle}>Penerima Komisi</th><th style={thStyle}>Jamaah</th><th style={thStyle}>Jumlah</th><th style={thStyle}>Status</th><th style={thStyle}>Tgl Dibuat</th><th style={{ ...thStyle, textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledger.map(e => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={tdStyle}>
                                            <p style={{ fontWeight: 700, color: 'white', margin: '0 0 0.125rem 0' }}>{e.user?.name || e.userId}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#888', margin: 0, textTransform: 'capitalize' }}>{e.role}</p>
                                        </td>
                                        <td style={tdStyle}>{e.booking?.pilgrim?.name || '-'}</td>
                                        <td style={{ ...tdStyle, fontWeight: 700, color: '#22c55e' }}>{formatCurrency(e.amount)}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                                                background: e.status === 'paid' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                                                color: e.status === 'paid' ? '#22c55e' : '#eab308',
                                            }}>{e.status === 'paid' ? 'Dibayar' : 'Pending'}</span>
                                        </td>
                                        <td style={{ ...tdStyle, color: '#888', fontSize: '0.8125rem' }}>{new Date(e.createdAt).toLocaleDateString('id-ID')}</td>
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            {e.status === 'pending' ? (
                                                <button onClick={() => handleDisburse(e.id)} disabled={disbursing === e.id} style={{
                                                    background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                                    fontWeight: 700, border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', fontSize: '0.8125rem',
                                                }}>{disbursing === e.id ? '...' : 'Cairkan'}</button>
                                            ) : (
                                                <span style={{ color: '#22c55e', fontSize: '0.8125rem', fontWeight: 700 }}>Lunas</span>
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
