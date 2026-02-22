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
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Downline</h1>
                    <p className="text-gray-500">View and add direct {downlineLabel}s</p>
                </div>
                {(user?.role === 'pusat' || user?.role === 'cabang' || user?.role === 'mitra' || user?.role === 'agen') && (
                    <button
                        className="bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Add {downlineLabel}
                    </button>
                )}
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Name</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Email</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Role</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : downlines.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>No downlines found.</td></tr>
                        ) : downlines.map((d) => (
                            <tr key={d.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>{d.name}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{d.email}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', textTransform: 'capitalize' }}>{d.role}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        backgroundColor: d.isActive ? '#dcfce7' : '#fee2e2',
                                        color: d.isActive ? '#166534' : '#991b1b'
                                    }}>
                                        {d.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
