import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const BottomNav: React.FC = () => {
    const { user } = useAuthStore();
    const location = useLocation();

    if (!user) return null;

    const isSales = ['mitra', 'agen', 'reseller'].includes(user.role);
    const isPusatOrCabang = ['pusat', 'cabang'].includes(user.role);

    // Left items
    const homePath = isPusatOrCabang ? '/admin/dashboard' : '/dashboard';
    const jamaahPath = isPusatOrCabang ? '/admin/bookings' : (isSales ? '/prospects' : '/admin/bookings');

    // Right items
    const packagePath = isPusatOrCabang ? '/admin/packages' : (isSales ? '/marketing-kit' : '/admin/packages');
    const profilePath = '/profile';

    const isAbsensiActive = location.pathname === '/attendance';

    return (
        <nav
            className="bottom-nav-mobile"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '62px',
                background: 'rgba(19, 18, 16, 0.95)',
                backdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'none', // Controlled by CSS media query
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0 0.5rem',
                zIndex: 40,
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)'
            }}
        >
            {/* 1. Beranda */}
            <NavLink
                to={homePath}
                style={({ isActive }) => ({
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minWidth: '52px',
                    textDecoration: 'none',
                    color: isActive ? 'var(--color-primary)' : '#888',
                    transition: 'all 0.2s'
                })}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    dashboard
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    Beranda
                </span>
            </NavLink>

            {/* 2. Jamaah / Prospek */}
            <NavLink
                to={jamaahPath}
                style={({ isActive }) => ({
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minWidth: '52px',
                    textDecoration: 'none',
                    color: isActive ? 'var(--color-primary)' : '#888',
                    transition: 'all 0.2s'
                })}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    {isSales ? 'contacts' : 'group'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {isSales ? 'Prospek' : 'Jamaah'}
                </span>
            </NavLink>

            {/* 3. CENTER FAB: ABSENSI (Raised button with golden glow) */}
            <NavLink
                to="/attendance"
                style={{
                    position: 'relative',
                    top: '-14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    zIndex: 50
                }}
            >
                <div
                    style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '9999px',
                        background: isAbsensiActive
                            ? 'linear-gradient(135deg, #c8a851 0%, #e6ca70 100%)'
                            : 'linear-gradient(135deg, #24221d 0%, #171613 100%)',
                        color: isAbsensiActive ? '#000' : 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isAbsensiActive
                            ? '0 6px 20px rgba(200, 168, 81, 0.45)'
                            : '0 4px 15px rgba(0, 0, 0, 0.6)',
                        border: '3px solid #131210',
                        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '28px', fontWeight: 900 }}>
                        fingerprint
                    </span>
                </div>
                <span
                    style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        marginTop: '2px',
                        color: isAbsensiActive ? 'var(--color-primary)' : '#aaa',
                        letterSpacing: '-0.01em'
                    }}
                >
                    Absensi
                </span>
            </NavLink>

            {/* 4. Paket / Katalog */}
            <NavLink
                to={packagePath}
                style={({ isActive }) => ({
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minWidth: '52px',
                    textDecoration: 'none',
                    color: isActive ? 'var(--color-primary)' : '#888',
                    transition: 'all 0.2s'
                })}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    {isSales ? 'auto_stories' : 'inventory_2'}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {isSales ? 'Katalog' : 'Paket'}
                </span>
            </NavLink>

            {/* 5. Profil */}
            <NavLink
                to={profilePath}
                style={({ isActive }) => ({
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minWidth: '52px',
                    textDecoration: 'none',
                    color: isActive ? 'var(--color-primary)' : '#888',
                    transition: 'all 0.2s'
                })}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    account_circle
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    Profil
                </span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
