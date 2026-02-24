import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const menuGroups = [
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['pusat', 'cabang', 'mitra', 'agen', 'reseller', 'teknisi'] },
        ]
    },
    {
        label: 'Manajemen Produk',
        items: [
            { name: 'Paket Umroh', path: '/admin/packages', icon: 'package_2', roles: ['pusat'] },
            { name: 'Jadwal Keberangkatan', path: '/admin/departures', icon: 'flight_takeoff', roles: ['pusat'] },
            { name: 'Logistik & Inventory', path: '/admin/logistics', icon: 'inventory_2', roles: ['pusat', 'teknisi'] },
        ]
    },
    {
        label: 'Operasional Jamaah',
        items: [
            { name: 'Data Jamaah', path: '/admin/bookings', icon: 'group', roles: ['pusat'] },
            { name: 'Pembayaran', path: '/admin/invoices', icon: 'payments', badge: true, roles: ['pusat'] },
        ]
    },
    {
        label: 'Master Data',
        items: [
            { name: 'Data Hotel', path: '/admin/masters/hotels', icon: 'apartment', roles: ['pusat'] },
            { name: 'Data Pesawat', path: '/admin/masters/airlines', icon: 'airlines', roles: ['pusat'] },
            { name: 'Data Bandara', path: '/admin/masters/airports', icon: 'connecting_airports', roles: ['pusat'] },
            { name: 'Item Perlengkapan', path: '/admin/masters/equipment', icon: 'backpack', roles: ['pusat'] },
            { name: 'Jenis Paket', path: '/admin/masters/package-types', icon: 'category', roles: ['pusat'] },
        ]
    },
    {
        label: 'Sales & Marketing',
        items: [
            { name: 'Prospek', path: '/prospects', icon: 'contact_mail', roles: ['agen', 'reseller'] },
            { name: 'Inbox Lead', path: '/agent/leads', icon: 'call_received', roles: ['agen'] },
            { name: 'Marketing Kit', path: '/marketing-kit', icon: 'imagesmode', roles: ['mitra', 'agen', 'reseller', 'cabang'] },
            { name: 'Upload Banner', path: '/cabang/marketing-kit', icon: 'upload', roles: ['cabang'] },
            { name: 'Assign Lead', path: '/cabang/assign-lead', icon: 'assignment_ind', roles: ['cabang', 'mitra'] },
        ]
    },
    {
        label: 'Monitoring Jaringan',
        items: [
            { name: 'Approval Jamaah', path: '/cabang/approval', icon: 'rule', roles: ['cabang'] },
            { name: 'Data Jamaah Cabang', path: '/cabang/jamaah', icon: 'dns', roles: ['cabang'] },
            { name: 'Data Jamaahku', path: '/agent/jamaah', icon: 'group', roles: ['agen'] },
            { name: 'Daftar Jamaah', path: '/teknisi/jamaah', icon: 'person_search', roles: ['teknisi'] },
            { name: 'Performa Cabang', path: '/admin/performance', icon: 'leaderboard', roles: ['pusat'] },
        ]
    },
    {
        label: 'Keuangan',
        items: [
            { name: 'Rekening Bank', path: '/admin/bank-accounts', icon: 'account_balance', roles: ['pusat'] },
            { name: 'Komisi Jaringan', path: '/admin/commissions', icon: 'payments', roles: ['pusat'] },
        ]
    },
    {
        label: 'Afiliasi',
        items: [
            { name: 'Dashboard Affiliasi', path: '/affiliate', icon: 'trending_up', roles: ['cabang', 'mitra', 'agen', 'reseller'] },
            { name: 'Leaderboard', path: '/leaderboard', icon: 'trophy', roles: ['pusat', 'cabang', 'mitra', 'agen', 'reseller'] },
            { name: 'Data Downline', path: '/downline', icon: 'account_tree', roles: ['pusat', 'cabang', 'mitra', 'agen'] },
        ]
    },
    {
        label: 'Sistem & Akun',
        items: [
            { name: 'Pengaturan Akun', path: '/profile', icon: 'manage_accounts', roles: ['pusat', 'cabang', 'mitra', 'agen', 'reseller', 'teknisi'] },
            { name: 'Audit Log System', path: '/admin/audit', icon: 'security', roles: ['pusat'] },
        ]
    }
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on route change (mobile navigation)
    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    // Close sidebar on ESC key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', background: 'var(--color-primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#0a0907', fontVariationSettings: "'FILL' 1" }}>mosque</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 900, fontSize: '0.875rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, margin: 0 }}>
                        AL<span style={{ color: 'var(--color-primary)' }}>MADINAH</span>
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'capitalize', marginTop: '2px', margin: '2px 0 0 0' }}>
                        {user?.role === 'pusat' ? 'Admin Platform' : `${user?.role} Portal`}
                    </p>
                </div>
                {/* Close button on mobile only */}
                <button onClick={() => setSidebarOpen(false)} className="mobile-close-btn" style={{ color: 'var(--color-text-muted)', display: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
                </button>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
                {menuGroups.map(group => {
                    const visible = group.items.filter(item => user && item.roles.includes(user.role));
                    if (visible.length === 0) return null;
                    return (
                        <div key={group.label} style={{ marginBottom: '1.25rem' }}>
                            <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-light)', padding: '0 0.5rem', marginBottom: '0.375rem', margin: '0 0 0.375rem 0' }}>
                                {group.label}
                            </p>
                            {visible.map(item => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <NavLink key={item.path} to={item.path} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
                                        marginBottom: '0.125rem', textDecoration: 'none',
                                        fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                                        background: isActive ? 'rgba(200, 168, 81, 0.15)' : 'transparent',
                                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0", color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{item.icon}</span>
                                        {item.name}
                                    </NavLink>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* User */}
            <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9999px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.875rem', color: 'var(--color-bg)', flexShrink: 0 }}>
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.8125rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{user?.name}</p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'capitalize', margin: '2px 0 0 0' }}>{user?.role}</p>
                    </div>
                    <button onClick={handleLogout} title="Logout" style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s', flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>

            {/* Mobile overlay backdrop */}
            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40,
                    backdropFilter: 'blur(2px)',
                }} />
            )}

            {/* ===== SIDEBAR DESKTOP ===== */}
            <aside className="sidebar-desktop" style={{
                width: '256px', minHeight: '100vh', background: '#131210',
                borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column',
                position: 'sticky', top: 0, flexShrink: 0,
            }}>
                <SidebarContent />
            </aside>

            {/* ===== SIDEBAR MOBILE (slide-in) ===== */}
            <aside className="sidebar-mobile" style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px',
                background: '#131210', borderRight: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', zIndex: 50,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                overflowY: 'auto',
            }}>
                <SidebarContent />
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top Header */}
                <header style={{
                    height: '56px', background: '#131210',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 1rem 0 1.25rem', gap: '0.75rem', position: 'sticky', top: 0, zIndex: 30
                }}>
                    {/* Hamburger button — only visible on mobile */}
                    <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} style={{
                        display: 'none', alignItems: 'center', justifyContent: 'center',
                        width: '38px', height: '38px', borderRadius: '0.5rem',
                        background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)', flexShrink: 0
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>menu</span>
                    </button>

                    {/* Brand name — only on mobile */}
                    <p className="mobile-brand" style={{ display: 'none', fontWeight: 900, fontSize: '0.875rem', letterSpacing: '-0.02em', textTransform: 'uppercase', margin: 0, flex: 1 }}>
                        AL<span style={{ color: 'var(--color-primary)' }}>MADINAH</span>
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginLeft: 'auto' }}>
                        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
                        </button>
                        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', padding: '0.375rem 0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                            <span className="hide-xs">Lihat Website</span>
                        </a>
                    </div>
                </header>

                {/* Page content */}
                <div style={{ flex: 1, padding: 'clamp(1.25rem, 4vw, 3rem)', background: 'var(--color-bg)', overflowX: 'hidden' }}>
                    {children}
                </div>
            </main>

            {/* Responsive CSS */}
            <style>{`
                @media (max-width: 768px) {
                    .sidebar-desktop { display: none !important; }
                    .hamburger-btn { display: flex !important; }
                    .mobile-brand { display: block !important; }
                    .mobile-close-btn { display: flex !important; }
                }
                @media (min-width: 769px) {
                    .sidebar-mobile { display: none !important; }
                }
                @media (max-width: 400px) {
                    .hide-xs { display: none; }
                }
            `}</style>
        </div>
    );
};
