import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BottomNav } from './BottomNav';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

interface MenuItem {
    name: string;
    path: string;
    icon: string;
    roles: string[];
    badge?: boolean;
}

interface MenuGroup {
    label: string;
    items: MenuItem[];
}

const ALL_ROLES = ['pusat', 'cabang', 'mitra', 'agen', 'reseller', 'teknisi', 'pic_produk', 'pic_logistik', 'pic_jamaah', 'finance', 'marketing', 'staff'];

const formatRoleLabel = (role?: string) => {
    switch (role) {
        case 'pusat': return 'Admin Pusat';
        case 'pic_produk': return 'PIC Paket & Jadwal';
        case 'pic_logistik': return 'PIC Logistik';
        case 'pic_jamaah': return 'PIC Data Jamaah';
        case 'finance': return 'Finance';
        case 'marketing': return 'Marketing';
        case 'staff': return 'Staff';
        case 'cabang': return 'Cabang';
        case 'mitra': return 'Mitra';
        case 'agen': return 'Agen';
        case 'reseller': return 'Reseller';
        case 'teknisi': return 'Teknisi';
        default: return role || '';
    }
};

const menuGroups: MenuGroup[] = [
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ALL_ROLES },
            { name: 'Absensi Saya', path: '/attendance', icon: 'how_to_reg', roles: ALL_ROLES },
        ]
    },
    {
        label: 'Manajemen Produk',
        items: [
            { name: 'Paket Umroh', path: '/admin/packages', icon: 'package_2', roles: ['pusat', 'pic_produk'] },
            { name: 'Jadwal Keberangkatan', path: '/admin/departures', icon: 'flight_takeoff', roles: ['pusat', 'pic_produk'] },
            { name: 'Logistik & Inventory', path: '/admin/logistics', icon: 'inventory_2', roles: ['pusat', 'pic_logistik', 'teknisi'] },
            { name: 'Kategori Perlengkapan', path: '/admin/equipment-sets', icon: 'auto_awesome_motion', roles: ['pusat', 'pic_logistik'] },
        ]
    },
    {
        label: 'Operasional Jamaah',
        items: [
            { name: 'Data Jamaah', path: '/admin/bookings', icon: 'group', roles: ['pusat', 'pic_jamaah', 'finance'] },
            { name: 'Manifest & Roomlist', path: '/admin/manifest', icon: 'assignment', roles: ['pusat', 'pic_jamaah'] },
            { name: 'Rooming Board', path: '/admin/rooming', icon: 'hotel', roles: ['pusat', 'pic_jamaah'] },
            { name: 'Pembayaran', path: '/admin/invoices', icon: 'payments', badge: true, roles: ['pusat', 'pic_jamaah', 'finance'] },
        ]
    },
    {
        label: 'Master Data',
        items: [
            { name: 'Data Hotel', path: '/admin/masters/hotels', icon: 'apartment', roles: ['pusat', 'pic_produk'] },
            { name: 'Data Pesawat', path: '/admin/masters/airlines', icon: 'airlines', roles: ['pusat', 'pic_produk'] },
            { name: 'Data Bandara', path: '/admin/masters/airports', icon: 'connecting_airports', roles: ['pusat', 'pic_produk'] },
            { name: 'Item Perlengkapan', path: '/admin/masters/equipment', icon: 'backpack', roles: ['pusat', 'pic_logistik', 'teknisi'] },
            { name: 'Jenis Paket', path: '/admin/masters/package-types', icon: 'category', roles: ['pusat', 'pic_produk'] },
        ]
    },
    {
        label: 'Sales & Marketing',
        items: [
            { name: 'Prospek', path: '/prospects', icon: 'contact_mail', roles: ['agen', 'reseller', 'marketing'] },
            { name: 'Inbox Lead', path: '/agent/leads', icon: 'call_received', roles: ['agen', 'marketing'] },
            { name: 'Marketing Kit', path: '/marketing-kit', icon: 'imagesmode', roles: ['pusat', 'mitra', 'agen', 'reseller', 'cabang', 'marketing'] },
            { name: 'Kelola Marketing Kit', path: '/cabang/marketing-kit', icon: 'upload', roles: ['pusat', 'cabang', 'marketing'] },
            { name: 'Assign Lead', path: '/cabang/assign-lead', icon: 'assignment_ind', roles: ['cabang', 'mitra'] },
            { name: 'Kelola Testimoni', path: '/admin/testimonials', icon: 'reviews', roles: ['pusat'] },
        ]
    },
    {
        label: 'Monitoring Jaringan',
        items: [
            { name: 'Monitoring Absensi', path: '/admin/attendance', icon: 'badge', roles: ['pusat', 'cabang', 'finance'] },
            { name: 'Approval Jamaah', path: '/cabang/approval', icon: 'rule', roles: ['cabang'] },
            { name: 'Data Jamaah Cabang', path: '/cabang/jamaah', icon: 'dns', roles: ['cabang'] },
            { name: 'List Jamaah', path: '/agent/list-jamaah', icon: 'contact_page', roles: ['agen', 'marketing'] },
            { name: 'Data Jamaahku', path: '/agent/jamaah', icon: 'group', roles: ['agen', 'marketing'] },
            { name: 'Daftar Jamaah', path: '/teknisi/jamaah', icon: 'person_search', roles: ['teknisi', 'pic_logistik'] },
            { name: 'Repeat Customers', path: '/admin/reports/repeat-customers', icon: 'group_add', roles: ['pusat'] },
            { name: 'Performa Cabang', path: '/admin/performance', icon: 'leaderboard', roles: ['pusat'] },
        ]
    },
    {
        label: 'Keuangan',
        items: [
            { name: 'Rekening Bank', path: '/admin/bank-accounts', icon: 'account_balance', roles: ['pusat', 'finance'] },
            { name: 'Komisi Jaringan', path: '/admin/commissions', icon: 'payments', roles: ['pusat', 'finance'] },
        ]
    },
    {
        label: 'Afiliasi',
        items: [
            { name: 'Dashboard Affiliasi', path: '/affiliate', icon: 'trending_up', roles: ['cabang', 'mitra', 'agen', 'reseller', 'marketing'] },
            { name: 'Pencairan Komisi', path: '/affiliate/disbursement', icon: 'account_balance_wallet', roles: ['pusat', 'cabang', 'mitra', 'agen', 'reseller', 'finance', 'marketing'] },
            { name: 'Leaderboard', path: '/leaderboard', icon: 'trophy', roles: ['pusat', 'cabang', 'mitra', 'agen', 'reseller', 'marketing'] },
            { name: 'Data Downline', path: '/downline', icon: 'account_tree', roles: ['pusat', 'cabang', 'mitra', 'agen'] },
        ]
    },
    {
        label: 'Sistem & Akun',
        items: [
            { name: 'Kelola Akun & PIC', path: '/admin/users', icon: 'people', roles: ['pusat'] },
            { name: 'Edit Landing Page', path: '/admin/landing-editor', icon: 'web', roles: ['pusat', 'cabang'] },
            { name: 'Pengaturan Akun', path: '/profile', icon: 'manage_accounts', roles: ALL_ROLES },
            { name: 'Audit Log System', path: '/admin/audit', icon: 'security', roles: ['pusat'] },
        ]
    }
];

interface SidebarContentProps {
    user: any;
    branding: { logoUrl: string; brandName: string; brandHighlight: string };
    currentPath: string;
    onCloseMobile?: () => void;
    onLogout: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = React.memo(({ user, branding, currentPath, onCloseMobile, onLogout }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
            {/* Logo Header (Fixed/Still) */}
            <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, background: '#131210' }}>
                <div style={{ width: '38px', height: '38px', background: 'var(--color-primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    <img src={branding.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 900, fontSize: '0.9375rem', letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--color-text-main)' }}>
                        {branding.brandName}
                        <span style={{ color: 'var(--color-primary)' }}>{branding.brandHighlight}</span>
                    </span>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: 0, letterSpacing: '0.05em' }}>MANAGEMENT</p>
                </div>
                {/* Mobile close button */}
                {onCloseMobile && (
                    <button onClick={onCloseMobile} className="mobile-close-btn" style={{ display: 'none', color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                    </button>
                )}
            </div>

            {/* Scrollable Navigation Area */}
            <nav className="sidebar-nav-scroll" style={{ flex: 1, padding: '1rem 0.75rem', minHeight: 0 }}>
                {menuGroups.map((group, gIdx) => {
                    const visibleItems = group.items.filter(item => item.roles.includes(user?.role || ''));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={gIdx} style={{ marginBottom: '1.25rem' }}>
                            <div style={{ padding: '0 0.5rem', fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
                                {group.label}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {visibleItems.map((item) => {
                                    const isActive = currentPath === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={onCloseMobile}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.5625rem 0.75rem',
                                                borderRadius: '0.625rem',
                                                textDecoration: 'none',
                                                fontSize: '0.8125rem',
                                                fontWeight: isActive ? 600 : 500,
                                                background: isActive ? 'linear-gradient(135deg, rgba(200,168,81,0.18), rgba(200,168,81,0.06))' : 'transparent',
                                                color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.65)',
                                                border: isActive ? '1px solid rgba(200,168,81,0.3)' : '1px solid transparent',
                                                transition: 'all 0.15s ease',
                                                position: 'relative'
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '19px', opacity: isActive ? 1 : 0.7, color: isActive ? 'var(--color-primary)' : 'inherit' }}>
                                                {item.icon}
                                            </span>
                                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                                            {item.badge && (
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User & Exit Logout (Fixed/Still at bottom) */}
            <div style={{ padding: '0.875rem 0.75rem', borderTop: '1px solid var(--color-border)', flexShrink: 0, background: '#131210', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9999px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.875rem', color: 'var(--color-bg)', flexShrink: 0 }}>
                        {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.8125rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{user?.name}</p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 600, margin: '2px 0 0 0' }}>{formatRoleLabel(user?.role)}</p>
                    </div>
                    <button onClick={onLogout} title="Logout" style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s', flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
});

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [branding, setBranding] = useState({ logoUrl: '/logo.png', brandName: 'AL', brandHighlight: 'MADINAH' });

    // Fetch branding from landing settings
    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_URL || '';
        fetch(`${apiBase}/api/landing-settings`)
            .then(r => r.json())
            .then((data: any) => {
                if (data?.settings) {
                    const s = data.settings;
                    const rawLogo = s.logo_url || '/logo.png';
                    const logoUrl = rawLogo.startsWith('/') && !rawLogo.startsWith('//')
                        ? `${apiBase}${rawLogo}`
                        : rawLogo;
                    const fullBrand = s.brand_name || 'ALMADINAH';
                    const highlight = s.brand_highlight || '';
                    setBranding({
                        logoUrl,
                        brandName: highlight ? fullBrand.replace(highlight, '') : fullBrand,
                        brandHighlight: highlight,
                    });
                }
            })
            .catch(() => {});
    }, []);

    // Close mobile drawer on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    // Close sidebar on ESC key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="dashboard-layout-root" style={{ display: 'flex', height: '100vh', maxHeight: '100vh', background: 'var(--color-bg)', overflow: 'hidden' }}>

            {/* Mobile overlay backdrop */}
            {sidebarOpen && (
                <div onClick={() => setSidebarOpen(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40,
                    backdropFilter: 'blur(2px)',
                }} />
            )}

            {/* ===== SIDEBAR DESKTOP ===== */}
            <aside className="sidebar-desktop" style={{
                width: '256px', height: '100vh', maxHeight: '100vh', background: '#131210',
                borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column',
                flexShrink: 0, overflow: 'hidden', zIndex: 20
            }}>
                <SidebarContent
                    user={user}
                    branding={branding}
                    currentPath={location.pathname}
                    onLogout={handleLogout}
                />
            </aside>

            {/* ===== SIDEBAR MOBILE (slide-in) ===== */}
            <aside className="sidebar-mobile" style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', height: '100vh', maxHeight: '100vh',
                background: '#131210', borderRight: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column', zIndex: 50,
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden'
            }}>
                <SidebarContent
                    user={user}
                    branding={branding}
                    currentPath={location.pathname}
                    onCloseMobile={() => setSidebarOpen(false)}
                    onLogout={handleLogout}
                />
            </aside>

            {/* ===== MAIN CONTENT (Independent Scroll Area) ===== */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', maxHeight: '100vh', minWidth: 0, overflow: 'hidden' }}>
                {/* Top Header */}
                <header style={{
                    height: '56px', background: '#131210',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 1rem 0 1.25rem', gap: '0.75rem', flexShrink: 0, zIndex: 30
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
                        <a href="/" className="btn-view-website" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', padding: '0.375rem 0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
                            <span>Lihat Website</span>
                        </a>
                    </div>
                </header>

                {/* Page content with dedicated independent scroll */}
                <div className="dashboard-content-area dashboard-content-scroll" style={{ flex: 1, padding: 'clamp(1.25rem, 4vw, 3rem)', background: 'var(--color-bg)', overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
                    {children}
                </div>

                {/* Mobile Bottom Navigation (Ref: rusamas-erp) */}
                <BottomNav />
            </main>

            {/* Responsive & Sidebar Scrollbar CSS */}
            <style>{`
                .sidebar-nav-scroll {
                    overflow-y: auto !important;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(200, 168, 81, 0.4) rgba(255, 255, 255, 0.02);
                }
                .sidebar-nav-scroll::-webkit-scrollbar {
                    width: 5px;
                }
                .sidebar-nav-scroll::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 4px;
                }
                .sidebar-nav-scroll::-webkit-scrollbar-thumb {
                    background: rgba(200, 168, 81, 0.35);
                    border-radius: 999px;
                }
                .sidebar-nav-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(200, 168, 81, 0.7);
                }

                .dashboard-content-scroll {
                    overflow-y: auto !important;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(200, 168, 81, 0.3) rgba(255, 255, 255, 0.02);
                }
                .dashboard-content-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                .dashboard-content-scroll::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .dashboard-content-scroll::-webkit-scrollbar-thumb {
                    background: rgba(200, 168, 81, 0.3);
                    border-radius: 999px;
                }
                .dashboard-content-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(200, 168, 81, 0.6);
                }

                @media (max-width: 768px) {
                    .sidebar-desktop { display: none !important; }
                    .hamburger-btn { display: flex !important; }
                    .mobile-brand { display: block !important; }
                    .mobile-close-btn { display: flex !important; }
                    .bottom-nav-mobile { display: flex !important; }
                    .dashboard-content-area { padding-bottom: 5.5rem !important; }
                    .btn-view-website { display: none !important; }
                }
                @media (min-width: 769px) {
                    .sidebar-mobile { display: none !important; }
                    .bottom-nav-mobile { display: none !important; }
                }
                @media (max-width: 400px) {
                    .hide-xs { display: none; }
                }
            `}</style>
        </div>
    );
};
