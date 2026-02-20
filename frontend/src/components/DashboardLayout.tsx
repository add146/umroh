import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', roles: ['pusat', 'cabang', 'mitra', 'agen', 'reseller'] },
        { name: 'Katalog Paket', path: '/admin/packages', roles: ['pusat'] },
        { name: 'Jadwal Keberangkatan', path: '/admin/departures', roles: ['pusat'] },
        { name: 'Daftar Booking', path: '/admin/bookings', roles: ['pusat'] },
        { name: 'Verifikasi Pembayaran', path: '/admin/invoices', roles: ['pusat'] },
        { name: 'Pengaturan Rekening', path: '/admin/bank-accounts', roles: ['pusat'] },
        { name: 'Manajemen Komisi', path: '/admin/commissions', roles: ['pusat'] },
        { name: '📦 Logistik & Perlengkapan', path: '/admin/logistics', roles: ['pusat'] },
        { name: '🏢 Rooming Board', path: '/admin/rooming', roles: ['pusat'] },
        { name: '📸 OCR Scanner', path: '/admin/documents', roles: ['pusat'] },
        { name: 'Downline', path: '/downline', roles: ['pusat', 'cabang', 'mitra', 'agen'] },
        { name: '🌟 Dashboard Affiliasi', path: '/affiliate', roles: ['cabang', 'mitra', 'agen', 'reseller'] },
    ];

    const filteredMenu = menuItems.filter(item =>
        user && item.roles.includes(user.role)
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg-alt)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.05em' }}>AL MADINAH</h2>
                </div>

                <nav style={{ flex: 1, padding: '1rem 0' }}>
                    {filteredMenu.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'block',
                                padding: '0.75rem 2rem',
                                color: isActive ? 'var(--color-secondary)' : 'white',
                                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                fontWeight: isActive ? 600 : 400,
                                borderLeft: isActive ? '4px solid var(--color-secondary)' : '4px solid transparent'
                            })}
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={handleLogout}
                        style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <header style={{
                    height: '70px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 2rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'capitalize' }}>
                                {user?.role}
                            </p>
                        </div>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700
                        }}>
                            {user?.name.charAt(0)}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div style={{ padding: '2rem', flex: 1 }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
