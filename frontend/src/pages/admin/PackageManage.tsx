import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

const thStyle: React.CSSProperties = {
    padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem',
};
const tdStyle: React.CSSProperties = {
    padding: '1rem 1.5rem',
};

export default function PackageManage() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPackages = async () => {
        try {
            const data = await apiFetch<{ packages: any[] }>('/api/packages');
            setPackages(data.packages || []);
        } catch (error) {
            toast.error('Gagal memuat daftar paket');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPackages(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus paket ini?')) return;
        try {
            await apiFetch(`/api/packages/${id}`, { method: 'DELETE' });
            toast.success('Paket berhasil dihapus');
            fetchPackages();
        } catch (error) {
            toast.error('Gagal menghapus paket');
        }
    };

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Paket Umroh</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola dan konfigurasi seluruh paket perjalanan umroh Anda.</p>
                </div>
                <Link to="/admin/packages/create" style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                    background: 'var(--color-primary)', color: 'white', borderRadius: '0.75rem',
                    fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem',
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    Tambah Paket
                </Link>
            </div>

            {/* Table */}
            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Nama Paket</th>
                            <th style={thStyle}>Harga Base</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data paket...</td>
                            </tr>
                        ) : packages.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary)', display: 'block', marginBottom: '1rem' }}>package_2</span>
                                    Belum ada paket umroh yang tersedia.
                                </td>
                            </tr>
                        ) : packages.map((pkg) => (
                            <tr key={pkg.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.25rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>
                                        {pkg.id.split('-')[0]}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontWeight: 700, color: 'white' }}>{pkg.name}</span>
                                </td>
                                <td style={tdStyle}>
                                    <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                                        Rp{pkg.basePrice.toLocaleString('id-ID')}
                                    </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button onClick={() => handleDelete(pkg.id)} style={{
                                            padding: '0.5rem', color: 'var(--color-error)', background: 'rgba(239,68,68,0.1)',
                                            borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>delete</span>
                                        </button>
                                        <Link to={`/admin/packages/${pkg.id}`} style={{
                                            padding: '0.5rem 1rem', background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                                            borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                                            Kelola Produk
                                        </Link>
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
