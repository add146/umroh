import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem',
};
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)',
};
const thStyle: React.CSSProperties = {
    padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem',
};
const tdStyle: React.CSSProperties = { padding: '1rem 1.5rem' };

export default function BankAccountsPage() {
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', accountHolder: '' });

    useEffect(() => { fetchBanks(); }, []);

    const fetchBanks = async () => {
        try {
            const data = await apiFetch<BankAccount[]>('/api/payments/banks');
            setBanks(data);
        } catch (error) { toast.error('Gagal mengambil data rekening'); }
        finally { setLoading(false); }
    };

    const handleAdd = async () => {
        if (!newBank.bankName || !newBank.accountNumber || !newBank.accountHolder) { return toast.error('Semua field harus diisi'); }
        try {
            await apiFetch('/api/payments/banks', { method: 'POST', body: JSON.stringify(newBank) });
            toast.success('Rekening berhasil ditambahkan');
            setIsAdding(false);
            setNewBank({ bankName: '', accountNumber: '', accountHolder: '' });
            fetchBanks();
        } catch (error) { toast.error('Gagal menambah rekening'); }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await apiFetch(`/api/payments/banks/${id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !currentStatus }) });
            toast.success('Status berhasil diperbarui');
            fetchBanks();
        } catch (error) { toast.error('Gagal memperbarui status'); }
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Setelan Rekening</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola rekening bank untuk tujuan transfer manual jamaah.</p>
                </div>
                <button onClick={() => setIsAdding(!isAdding)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                    background: isAdding ? 'rgba(239,68,68,0.1)' : 'var(--color-primary)',
                    color: isAdding ? '#ef4444' : 'white',
                    borderRadius: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isAdding ? 'close' : 'add'}</span>
                    {isAdding ? 'Batal' : 'Tambah Rekening'}
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>account_balance</span>
                        Rekening Baru
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Nama Bank</label>
                            <input value={newBank.bankName} onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })} placeholder="Contoh: BANK BCA" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Nomor Rekening</label>
                            <input value={newBank.accountNumber} onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })} placeholder="Contoh: 1234567890" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                        </div>
                        <div>
                            <label style={labelStyle}>Atas Nama</label>
                            <input value={newBank.accountHolder} onChange={(e) => setNewBank({ ...newBank, accountHolder: e.target.value })} placeholder="Nama Pemilik Rekening" style={inputStyle} />
                        </div>
                    </div>
                    <button onClick={handleAdd} style={{ marginTop: '1rem', padding: '0.875rem 2rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                        Simpan Konfigurasi
                    </button>
                </div>
            )}

            {/* Table */}
            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={thStyle}>Institusi Bank</th>
                            <th style={thStyle}>Informasi Akun</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Manajemen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</td></tr>
                        ) : banks.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada rekening aktif yang terdaftar.</td></tr>
                        ) : banks.map(bank => (
                            <tr key={bank.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            padding: '0.625rem', borderRadius: '0.75rem',
                                            background: bank.isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)', color: bank.isActive ? 'white' : '#888',
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px', display: 'block' }}>account_balance</span>
                                        </div>
                                        <span style={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>{bank.bankName}</span>
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <p style={{ fontWeight: 800, fontFamily: 'monospace', color: 'white', margin: '0 0 0.125rem 0' }}>{bank.accountNumber}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>A/N {bank.accountHolder}</p>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                                        background: bank.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                                        color: bank.isActive ? '#22c55e' : '#888',
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: bank.isActive ? '#22c55e' : '#888' }} />
                                        {bank.isActive ? 'Aktif' : 'Non-Aktif'}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                                        <button onClick={() => toggleStatus(bank.id, bank.isActive)} style={{
                                            padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                            background: bank.isActive ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                                            color: bank.isActive ? '#eab308' : '#22c55e',
                                        }} title={bank.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>{bank.isActive ? 'toggle_off' : 'toggle_on'}</span>
                                        </button>
                                        <button style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} title="Hapus">
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
