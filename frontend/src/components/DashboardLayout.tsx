import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const menuGroups = [
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: 'dashboard', roles: ['pusat', 'cabang', 'mitra', 'agen', 'reseller'] },
            { name: 'Keberangkatan', path: '/admin/departures', icon: 'flight_takeoff', roles: ['pusat'] },
            { name: 'Jamaah', path: '/admin/bookings', icon: 'group', roles: ['pusat'] },
            { name: 'Pembayaran', path: '/admin/invoices', icon: 'payments', badge: true, roles: ['pusat'] },
        ]
    },
    {
        label: 'Hotel & Operasional',
        items: [
            { name: 'Rooming Board', path: '/admin/rooming', icon: 'bed', roles: ['pusat'] },
            { name: 'Logistik', path: '/admin/logistics', icon: 'inventory_2', roles: ['pusat'] },
            { name: 'Dokumen & OCR', path: '/admin/documents', icon: 'document_scanner', roles: ['pusat'] },
        ]
    },
    {
        label: 'Master Data',
        items: [
            { name: 'Data Hotel', path: '/admin/masters/hotels', icon: 'apartment', roles: ['pusat'] },
            { name: 'Data Pesawat', path: '/admin/masters/airlines', icon: 'airlines', roles: ['pusat'] },
            { name: 'Data Bandara', path: '/admin/masters/airports', icon: 'connecting_airports', roles: ['pusat'] },
        ]
    },
    {
        label: 'Finance',
        items: [
            { name: 'Paket Umroh', path: '/admin/packages', icon: 'package_2', roles: ['pusat'] },
            { name: 'Rekening Bank', path: '/admin/bank-accounts', icon: 'account_balance', roles: ['pusat'] },
            { name: 'Komisi', path: '/admin/commissions', icon: 'payments', roles: ['pusat'] },
        ]
    },
    {
        label: 'Afiliasi',
        items: [
            { name: 'Downline', path: '/downline', icon: 'account_tree', roles: ['pusat', 'cabang', 'mitra', 'agen'] },
            { name: 'Dashboard Affiliasi', path: '/affiliate', icon: 'trending_up', roles: ['cabang', 'mitra', 'agen', 'reseller'] },
        ]
    },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>

            {/* ===== SIDEBAR ===== */}
            <aside style={{
                width: '256px', minHeight: '100vh',
                background: '#131210',
                borderRight: '1px solid var(--color-border)',
                display: 'flex', flexDirection: 'column',
                position: 'sticky', top: 0
            }}>
                {/* Logo */}
                <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '38px', height: '38px', background: 'var(--color-primary)',
                        borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#0a0907', fontVariationSettings: "'FILL' 1" }}>mosque</span>
                    </div>
                    <div>
                        <p style={{ fontWeight: 900, fontSize: '0.875rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1 }}>
                            AL<span style={{ color: 'var(--color-primary)' }}>MADINAH</span>
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>
                            {user?.role === 'pusat' ? 'Admin Platform' : `${user?.role} Portal`}
                        </p>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
                    {menuGroups.map(group => {
                        const visible = group.items.filter(item => user && item.roles.includes(user.role));
                        if (visible.length === 0) return null;
                        return (
                            <div key={group.label} style={{ marginBottom: '1.5rem' }}>
                                <p style={{
                                    fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase',
                                    letterSpacing: '0.12em', color: 'var(--color-text-light)',
                                    padding: '0 0.5rem', marginBottom: '0.375rem'
                                }}>{group.label}</p>
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
                                            <span className="material-symbols-outlined" style={{
                                                fontSize: '20px',
                                                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                                                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'
                                            }}>{item.icon}</span>
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
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '9999px',
                            background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 900, fontSize: '0.875rem', color: 'var(--color-bg)', flexShrink: 0
                        }}>
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <p style={{ fontWeight: 700, fontSize: '0.8125rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{user?.role}</p>
                        </div>
                        <button onClick={handleLogout} title="Logout" style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s', flexShrink: 0 }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-error)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* ===== MAIN CONTENT ===== */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top Header */}
                <header style={{
                    height: '64px', background: '#131210',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    padding: '0 2rem', gap: '1rem', position: 'sticky', top: 0, zIndex: 30
                }}>
                    <button style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '38px', height: '38px', borderRadius: '0.5rem',
                        background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
                    </button>
                    <a href="/" style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)',
                        padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
                        border: '1px solid var(--color-border)', textDecoration: 'none'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                        Lihat Website
                    </a>
                </header>

                {/* Page */}
                <div style={{ flex: 1, padding: '2rem', background: 'var(--color-bg)' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
