import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface QuickBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (bookingId: string) => void;
}

export const QuickBookModal: React.FC<QuickBookModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuthStore();
    const [departures, setDepartures] = useState<any[]>([]);
    const [roomTypes, setRoomTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        departureId: '',
        roomTypeId: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
            resetForm();
        }
    }, [isOpen]);

    const fetchOptions = async () => {
        try {
            const [depRes, roomRes] = await Promise.all([
                apiFetch<any>('/api/departures?status=available'),
                apiFetch<{ roomTypes: any[] }>('/api/packages/room-types')
            ]);
            setDepartures(depRes.departures || []);
            setRoomTypes(roomRes.roomTypes || []);
        } catch (error) {
            console.error('Failed to fetch options for Quick Book', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            departureId: '',
            roomTypeId: '',
            notes: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Map Quick Book data to the standard booking payload structure
            // Missing fields will be filled with placeholders
            const payload = {
                departureId: formData.departureId,
                roomTypeId: formData.roomTypeId,
                affiliatorId: user?.id,
                pilgrim: {
                    name: formData.name,
                    phone: formData.phone,
                    noKtp: '0000000000000000', // Placeholder
                    sex: 'L',
                    born: new Date().toISOString().split('T')[0],
                    address: formData.notes || 'Data dari Quick Register',
                    fatherName: '-',
                    hasPassport: false,
                    maritalStatus: 'Belum Menikah',
                    lastEducation: '-',
                    work: '-',
                    famContactName: '-',
                    famContact: '0000',
                    sourceFrom: 'Quick Register Agent'
                }
            };

            const response = await apiFetch<{ bookingId: string, error?: string }>('/api/bookings', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (onSuccess) {
                onSuccess(response.bookingId);
            } else {
                alert('Pendaftaran cepat berhasil!');
            }
            onClose();

        } catch (error: any) {
            alert(error.message || 'Terjadi kesalahan saat menyimpan pendaftaran.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Pendaftaran Cepat (Draft)</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Nama Jamaah</label>
                        <input
                            required
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)' }}
                            placeholder="Contoh: Budi Santoso"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Nomor WhatsApp / HP</label>
                        <input
                            required
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)' }}
                            placeholder="081234567890"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Pilih Keberangkatan</label>
                        <select
                            required
                            name="departureId"
                            value={formData.departureId}
                            onChange={(e) => setFormData({ ...formData, departureId: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)' }}>
                            <option value="">-- Pilih Paket & Jadwal --</option>
                            {departures.map(d => (
                                <option key={d.id} value={d.id}>{d.package?.name} - {new Date(d.date).toLocaleDateString('id-ID')}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Tipe Kamar (Estimasi)</label>
                        <select
                            required
                            name="roomTypeId"
                            value={formData.roomTypeId}
                            onChange={(e) => setFormData({ ...formData, roomTypeId: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)' }}>
                            <option value="">-- Pilih Tipe Kamar --</option>
                            {roomTypes.map(r => (
                                <option key={r.id} value={r.id}>{r.name} (+ {r.priceAdjustment.toLocaleString('id-ID')})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Catatan (Opsional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--color-text)', minHeight: '80px', fontFamily: 'inherit' }}
                            placeholder="Catat request khusus..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'var(--color-text)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                            Batal
                        </button>
                        <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--color-primary)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: 'var(--shadow-gold)' }}>
                            {loading ? 'Menyimpan...' : 'Simpan Draft Booking'}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
};
