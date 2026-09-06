import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { CabangComparison } from '../components/CabangComparison';
import { Link } from 'react-router-dom';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export const DashboardPage: React.FC = () => {
    const { user } = useAuthStore();
    const [cabangs, setCabangs] = useState<any[]>([]);
    const [selectedCabang, setSelectedCabang] = useState<string>('');
    const [stats, setStats] = useState([
        { label: 'Total Jamaah', value: '0' },
        { label: 'Pemesanan Aktif', value: '0' },
        { label: 'Estimasi Status', value: 'Memuat...' },
    ]);

    const getRoleTitle = (role?: string) => {
        switch (role) {
            case 'pusat': return 'Admin Platform (Pusat)';
            case 'pic_produk': return 'PIC Paket Umroh & Jadwal Keberangkatan';
            case 'pic_logistik': return 'PIC Logistik & Inventory Perlengkapan';
            case 'pic_jamaah': return 'PIC Data Jamaah, Manifest & Roomlist';
            case 'finance': return 'Staff Keuangan & Finance';
            case 'marketing': return 'Staff Sales & Marketing';
            case 'staff': return 'Staff Umum / Absensi';
            case 'cabang': return 'Kantor Cabang';
            case 'mitra': return 'Mitra Usaha';
            case 'agen': return 'Agen Sales';
            case 'reseller': return 'Reseller';
            case 'teknisi': return 'Teknisi Operasional';
            default: return role || '';
        }
    };

    useEffect(() => {
        if (user?.role === 'pusat') {
            apiFetch('/api/users').then(res => res.json()).then(data => {
                setCabangs(data.users?.filter((u: any) => u.role === 'cabang') || []);
            });
        }
    }, [user]);

    useEffect(() => {
        const fetchStats = async () => {
            if (user?.role === 'pusat' && !selectedCabang) {
                // Fetch Global KPIs
                try {
                    const res = await apiFetch('/api/reports/global-kpi');
                    if (res.ok) {
                        const data = await res.json();
                        setStats([
                            { label: 'Total Jamaah Global', value: data.totalJamaah?.toString() || '0' },
                            { label: 'Total Revenue Global', value: formatCurrency(Number(data.totalRevenue || 0)) },
                            { label: 'Avg Konversi', value: `${data.conversionRate || 0}%` },
                        ]);
                    }
                } catch (err) {
                    console.error('Failed to fetch global KPIs', err);
                }
            } else if (user?.role === 'pic_produk') {
                try {
                    const [resPkg, resDep] = await Promise.all([
                        apiFetch('/api/packages'),
                        apiFetch('/api/departures')
                    ]);
                    const pkgData = resPkg.ok ? await resPkg.json() : { packages: [] };
                    const depData = resDep.ok ? await resDep.json() : { departures: [] };
                    setStats([
                        { label: 'Total Paket Aktif', value: (pkgData.packages?.length || 0).toString() },
                        { label: 'Jadwal Keberangkatan', value: (depData.departures?.length || 0).toString() },
                        { label: 'Status Operasional', value: 'Siap Beroperasi' },
                    ]);
                } catch (e) {
                    console.error(e);
                }
            } else if (user?.role === 'pic_logistik') {
                try {
                    const res = await apiFetch('/api/operations/equipment');
                    const eqData = res.ok ? await res.json() : [];
                    setStats([
                        { label: 'Item Perlengkapan Master', value: eqData.length.toString() },
                        { label: 'Status Logistik', value: 'Aktif' },
                        { label: 'Distribusi Lapangan', value: 'Tersedia' },
                    ]);
                } catch (e) {
                    console.error(e);
                }
            } else if (user?.role === 'pic_jamaah' || user?.role === 'finance') {
                try {
                    const [resBookings, resInvoices] = await Promise.all([
                        apiFetch('/api/bookings'),
                        apiFetch('/api/payments/invoices')
                    ]);
                    const bData = resBookings.ok ? await resBookings.json() : { bookings: [] };
                    const invData = resInvoices.ok ? await resInvoices.json() : [];
                    const bList = bData.bookings || [];
                    const paidInv = invData.filter((i: any) => i.status === 'paid');
                    setStats([
                        { label: 'Total Jamaah Terdata', value: bList.length.toString() },
                        { label: 'Pemesanan Dikonfirmasi', value: bList.filter((x: any) => x.bookingStatus === 'confirmed').length.toString() },
                        { label: user?.role === 'finance' ? 'Invoice Lunas' : 'Pemesanan Pending', value: user?.role === 'finance' ? paidInv.length.toString() : bList.filter((x: any) => x.bookingStatus === 'pending').length.toString() },
                    ]);
                } catch (e) {
                    console.error(e);
                }
            } else if (user?.role === 'marketing') {
                try {
                    const res = await apiFetch('/api/leads/prospects');
                    const prospectsData = res.ok ? await res.json() : { prospects: [] };
                    const plist = prospectsData.prospects || [];
                    setStats([
                        { label: 'Total Prospek Saya', value: plist.length.toString() },
                        { label: 'Prospek Tertarik (Hot/Warm)', value: plist.filter((p: any) => ['hot', 'warm', 'closing', 'interested'].includes(p.status?.toLowerCase())).length.toString() },
                        { label: 'Status Marketing', value: 'Aktif Bergerak' },
                    ]);
                } catch (e) {
                    console.error(e);
                }
            } else if (user?.role === 'staff') {
                setStats([
                    { label: 'Status Kehadiran', value: 'Aktif' },
                    { label: 'Presensi Harian', value: 'Tersedia' },
                    { label: 'Portal', value: 'Staff Karyawan' },
                ]);
            } else {
                // Original logic for Cabang/Mitra or Pusat viewing specific Cabang
                let url = '/api/bookings';
                if (user?.role === 'pusat' && selectedCabang) {
                    url += `?cabang_id=${selectedCabang}`;
                }
                try {
                    const res = await apiFetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        const b = data.bookings || [];
                        const activeBookings = b.filter((x: any) => x.bookingStatus === 'pending' || x.bookingStatus === 'confirmed');

                        setStats([
                            { label: 'Total Jamaah Baru', value: b.length.toString() },
                            { label: 'Pemesanan Aktif', value: activeBookings.length.toString() },
                            { label: 'Estimasi Pemasukan', value: 'Lihat Laporan' },
                        ]);
                    }
                } catch (err) {
                    console.error('Failed to fetch stats', err);
                }
            }
        };
        fetchStats();
    }, [selectedCabang, user]);

    return (
        <div>
            {/* Top Greeting Header */}
            <div className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: '0 0 0.25rem 0' }}>
                        Ahlan wa Sahlan, <span style={{ color: 'var(--color-primary)' }}>{user?.name}</span>!
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>
                        Portal {getRoleTitle(user?.role)} — Overview & navigasi cepat tugas Anda hari ini.
                    </p>
                </div>

                {user?.role === 'pusat' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-bg-card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-text-muted)' }}>filter_alt</span>
                        <select
                            value={selectedCabang}
                            onChange={e => setSelectedCabang(e.target.value)}
                            style={{ border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}
                        >
                            <option value="">Semua Cabang (Global)</option>
                            {cabangs.map(c => (
                                <option key={c.id} value={c.id}>Cabang: {c.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Quick KPI Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {stats.map((stat) => (
                    <div key={stat.label} style={{
                        padding: '1.25rem 1.5rem',
                        backgroundColor: '#1a1917', border: '1px solid var(--color-border)',
                        borderRadius: '0.75rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.375rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {stat.label}
                        </p>
                        <p style={{ fontSize: '1.625rem', fontWeight: 900, color: 'var(--color-primary)', margin: 0 }}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Quick Access Tiles based on PIC Role */}
            {user?.role === 'pic_produk' && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>rocket_launch</span>
                        Menu Utama PIC Paket & Jadwal Keberangkatan
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <Link to="/admin/packages" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(200, 168, 81, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: 'var(--color-primary)', display: 'flex' }}>
                                <span className="material-symbols-outlined">package_2</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Paket Umroh</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Kelola brosur & harga paket</p>
                            </div>
                        </Link>
                        <Link to="/admin/departures" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(200, 168, 81, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: 'var(--color-primary)', display: 'flex' }}>
                                <span className="material-symbols-outlined">flight_takeoff</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Jadwal Keberangkatan</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Atur tanggal & kuota seat</p>
                            </div>
                        </Link>
                        <Link to="/admin/masters/hotels" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(200, 168, 81, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: 'var(--color-primary)', display: 'flex' }}>
                                <span className="material-symbols-outlined">apartment</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Master Hotel & Maskapai</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Data hotel Makkah & Madinah</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {user?.role === 'pic_logistik' && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#34d399' }}>inventory_2</span>
                        Menu Utama PIC Logistik & Inventory
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <Link to="/admin/logistics" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#34d399', display: 'flex' }}>
                                <span className="material-symbols-outlined">inventory</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Logistik & Checklist</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Serah terima koper & perlengkapan</p>
                            </div>
                        </Link>
                        <Link to="/admin/equipment-sets" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#34d399', display: 'flex' }}>
                                <span className="material-symbols-outlined">auto_awesome_motion</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Kategori Perlengkapan</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Paket perlengkapan jamaah</p>
                            </div>
                        </Link>
                        <Link to="/teknisi/jamaah" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#34d399', display: 'flex' }}>
                                <span className="material-symbols-outlined">person_search</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Daftar Jamaah Lapangan</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Cek penerima barang</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {user?.role === 'pic_jamaah' && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#818cf8' }}>group</span>
                        Menu Utama PIC Data Jamaah & Operasional
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <Link to="/admin/bookings" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#818cf8', display: 'flex' }}>
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Data Jamaah</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Pendaftaran & verifikasi data</p>
                            </div>
                        </Link>
                        <Link to="/admin/manifest" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#818cf8', display: 'flex' }}>
                                <span className="material-symbols-outlined">assignment</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Manifest & Siskopatuh</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Export Excel & CSV Kemenag</p>
                            </div>
                        </Link>
                        <Link to="/admin/rooming" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#818cf8', display: 'flex' }}>
                                <span className="material-symbols-outlined">hotel</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Rooming Board</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Plotting kamar Quad/Triple/Double</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {user?.role === 'finance' && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#22d3ee' }}>payments</span>
                        Menu Utama Finance & Keuangan
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <Link to="/admin/invoices" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#22d3ee', display: 'flex' }}>
                                <span className="material-symbols-outlined">receipt_long</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Pembayaran & Invoice</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Verifikasi bukti bayar transfer</p>
                            </div>
                        </Link>
                        <Link to="/admin/bank-accounts" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#22d3ee', display: 'flex' }}>
                                <span className="material-symbols-outlined">account_balance</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Rekening Bank</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Master rekening pembayaran</p>
                            </div>
                        </Link>
                        <Link to="/affiliate/disbursement" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#22d3ee', display: 'flex' }}>
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Pencairan Komisi</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Approval penarikan komisi agen</p>
                            </div>
                        </Link>
                        <Link to="/admin/attendance" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#22d3ee', display: 'flex' }}>
                                <span className="material-symbols-outlined">badge</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Monitoring Absensi</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Rekap kehadiran staf</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {user?.role === 'marketing' && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#fb923c' }}>campaign</span>
                        Menu Utama Staff Sales & Marketing
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <Link to="/prospects" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(249, 115, 22, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#fb923c', display: 'flex' }}>
                                <span className="material-symbols-outlined">contact_mail</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Prospek Jamaah</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Pipeline prospek closing</p>
                            </div>
                        </Link>
                        <Link to="/agent/leads" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(249, 115, 22, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#fb923c', display: 'flex' }}>
                                <span className="material-symbols-outlined">call_received</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Inbox Lead</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Tindak lanjuti lead masuk</p>
                            </div>
                        </Link>
                        <Link to="/marketing-kit" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(249, 115, 22, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#fb923c', display: 'flex' }}>
                                <span className="material-symbols-outlined">imagesmode</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Marketing Kit</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Brosur & materi promosi</p>
                            </div>
                        </Link>
                        <Link to="/attendance" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(249, 115, 22, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#fb923c', display: 'flex' }}>
                                <span className="material-symbols-outlined">how_to_reg</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Absensi Lapangan</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Presensi GPS bebas lokasi</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {user?.role === 'staff' && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#cbd5e1' }}>badge</span>
                        Menu Utama Staff Karyawan
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        <Link to="/attendance" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(148, 163, 184, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#cbd5e1', display: 'flex' }}>
                                <span className="material-symbols-outlined">how_to_reg</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Absensi Saya</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Presensi masuk & pulang</p>
                            </div>
                        </Link>
                        <Link to="/profile" style={{ textDecoration: 'none', background: '#1a1917', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(148, 163, 184, 0.15)', padding: '0.875rem', borderRadius: '0.5rem', color: '#cbd5e1', display: 'flex' }}>
                                <span className="material-symbols-outlined">manage_accounts</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 700 }}>Pengaturan Akun</h4>
                                <p style={{ margin: 0, color: '#888', fontSize: '0.8125rem' }}>Ubah password & kontak</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {user?.role === 'pusat' && !selectedCabang ? (
                <div style={{ marginTop: '2rem' }}>
                    <CabangComparison />

                    <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <Link to="/admin/reports/repeat-customers" style={{ textDecoration: 'none', background: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                            <div style={{ background: 'rgba(200, 168, 81, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--color-primary)', display: 'flex' }}>
                                <span className="material-symbols-outlined">group_add</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'var(--color-text)', fontSize: '1.1rem' }}>Repeat Customers</h4>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Insight jamaah loyal</p>
                            </div>
                        </Link>

                        <Link to="/admin/performance" style={{ textDecoration: 'none', background: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                            <div style={{ background: 'rgba(200, 168, 81, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--color-primary)', display: 'flex' }}>
                                <span className="material-symbols-outlined">monitoring</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'var(--color-text)', fontSize: '1.1rem' }}>Performa Detail</h4>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Analisis cabang</p>
                            </div>
                        </Link>

                        <Link to="/admin/audit" style={{ textDecoration: 'none', background: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                            <div style={{ background: 'rgba(200, 168, 81, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--color-primary)', display: 'flex' }}>
                                <span className="material-symbols-outlined">history</span>
                            </div>
                            <div>
                                <h4 style={{ margin: 0, color: 'var(--color-text)', fontSize: '1.1rem' }}>Audit Log</h4>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Riwayat aktivitas</p>
                            </div>
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
