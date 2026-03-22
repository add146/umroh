import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';

export const LoginPage: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await apiFetch<{ user: any; accessToken: string }>('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ identifier, password }),
            });

            if (data.accessToken) {
                setAuth(data.user, data.accessToken);
                navigate('/dashboard');
            } else {
                setError('Login gagal. Periksa data Anda.');
            }
        } catch (err: any) {
            setError(err.message || 'Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#0a0907',
            padding: '1rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                padding: '3rem 2.5rem',
                backgroundColor: '#1a1917',
                borderRadius: '1.5rem',
                border: '1px solid var(--color-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <img src="/logo.png" alt="Al Madinah" style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 1rem' }} />
                    <h1 style={{ color: 'var(--color-primary)', fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em' }}>Al Madinah</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Management System Login</p>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)' }}>
                            Email / No. WhatsApp
                        </label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                backgroundColor: '#0a0907',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                                borderRadius: '0.75rem',
                                outline: 'none',
                                fontSize: '0.95rem'
                            }}
                            placeholder="email@contoh.com atau 0812..."
                        />
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                backgroundColor: '#0a0907',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                                borderRadius: '0.75rem',
                                outline: 'none',
                                fontSize: '0.95rem'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                    >
                        {isLoading ? 'MENGHUBUNGKAN...' : 'SIGN IN'}
                    </button>
                </form>
            </div>
        </div>
    );
};
