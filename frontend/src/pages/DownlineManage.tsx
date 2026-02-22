import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';

export const DownlineManagePage: React.FC = () => {
    const { user } = useAuthStore();
    const [downlines, setDownlines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        targetRole: '',
    });

    const fetchDownlines = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/api/users/downline');
            if (res.ok) {
                const data = await res.json();
                setDownlines(data.downlines || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDownlines();
    }, []);

    const handleCreateDownline = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await apiFetch('/api/users', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setIsModalOpen(false);
                setFormData({ name: '', email: '', phone: '', password: '', targetRole: '' });
                fetchDownlines();
                alert('Downline added successfully');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add downline');
            }
        } catch (err) {
            alert('Connection error');
        }
    };

    const downlineLabel = user?.role === 'pusat' ? 'Cabang' :
        user?.role === 'cabang' ? 'Mitra/Agen' :
            user?.role === 'mitra' ? 'Agen' : 'Reseller';

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Manage Downline</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>View and add direct {downlineLabel}s</p>
                </div>
                {(user?.role === 'pusat' || user?.role === 'cabang' || user?.role === 'mitra' || user?.role === 'agen') && (
                    <button
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600 }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '0.5rem' }}>person_add</span>
                        Add {downlineLabel}
                    </button>
                )}
            </div>

            <div style={{ background: 'rgb(19, 18, 16)', border: '1px solid var(--color-border)', borderRadius: '0.3rem', overflow: 'hidden', padding: '10px' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Daftar {downlineLabel} Aktif</h3>
                </div>

                {isLoading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading records...</div>
                ) : downlines.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No downlines found.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Name</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Email</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Role</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {downlines.map((d) => (
                                <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{d.name}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)' }}>{d.email}</td>
                                    <td style={{ padding: '1rem 1.5rem', textTransform: 'capitalize' }}>{d.role}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            backgroundColor: d.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: d.isActive ? '#22c55e' : '#ef4444',
                                            fontWeight: 600
                                        }}>
                                            {d.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Placeholder */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                }}>
                    <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', padding: '2rem', borderRadius: 'var(--radius)', width: '400px' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Add New {downlineLabel}</h3>
                        <form onSubmit={handleCreateDownline}>
                            {user?.role === 'cabang' && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Role</label>
                                    <select
                                        value={formData.targetRole}
                                        onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
                                        required
                                    >
                                        <option value="">-- Select Role --</option>
                                        <option value="mitra">Mitra</option>
                                        <option value="agen">Agen</option>
                                    </select>
                                </div>
                            )}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Full Name</label>
                                <input
                                    type="text" required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email</label>
                                <input
                                    type="email" required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Initial Password</label>
                                <input
                                    type="password" required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
