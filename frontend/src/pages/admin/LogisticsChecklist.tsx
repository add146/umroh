import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../lib/api';

interface Departure { id: string; departureDate: string; package?: { name: string }; }
interface EquipmentItem { 
    id: string; 
    name: string; 
    status: 'pending' | 'received'; 
    receivedAt?: string; 
    isCustom?: boolean;
    description?: string;
}
interface BookingLogistics { 
    id: string; 
    pilgrim?: { name: string; phone: string }; 
    equipment: EquipmentItem[]; 
    equipmentSetName?: string;
}

type FilterStatus = 'all' | 'completed' | 'pending';

const LogisticsChecklist: React.FC = () => {
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
    const [logisticsData, setLogisticsData] = useState<BookingLogistics[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    
    // Manual item form states per booking ID
    const [newItemForm, setNewItemForm] = useState<Record<string, { name: string; notes: string; isOpen: boolean }>>({});

    useEffect(() => { fetchDepartures(); }, []);

    const fetchDepartures = async () => {
        try {
            const data = await apiFetch<{ departures: Departure[] }>('/api/departures');
            setDepartures(data.departures || []);
            if (data.departures?.length > 0) setSelectedDepartureId(data.departures[0].id);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { if (selectedDepartureId) fetchLogistics(selectedDepartureId); }, [selectedDepartureId]);

    const fetchLogistics = async (departureId: string) => {
        setLoading(true);
        try {
            const bookings = await apiFetch<any[]>(`/api/operations/rooming/${departureId}`);
            const fullData = await Promise.all(bookings.map(async (b) => {
                const equipment = await apiFetch<EquipmentItem[]>(`/api/operations/equipment/checklist/${b.id}`);
                return { 
                    id: b.id, 
                    pilgrim: b.pilgrim, 
                    equipment, 
                    equipmentSetName: b.equipmentSet?.name || 'Default' 
                };
            }));
            setLogisticsData(fullData);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const toggleStatus = async (bookingId: string, itemId: string, currentStatus: string, isCustom: boolean) => {
        const newStatus = currentStatus === 'pending' ? 'received' : 'pending';
        setUpdating(`${bookingId}-${itemId}`);
        try {
            if (isCustom) {
                await apiFetch(`/api/operations/equipment/custom/${itemId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: newStatus })
                });
            } else {
                await apiFetch('/api/operations/equipment/checklist', {
                    method: 'POST',
                    body: JSON.stringify({ bookingId, equipmentItemId: itemId, status: newStatus })
                });
            }
            setLogisticsData(prev => prev.map(b => b.id === bookingId ? { ...b, equipment: b.equipment.map(e => e.id === itemId ? { ...e, status: newStatus as any } : e) } : b));
        } catch (error) { alert('Gagal update status'); }
        finally { setUpdating(null); }
    };

    const handleAddCustomItem = async (bookingId: string) => {
        const form = newItemForm[bookingId];
        if (!form || !form.name.trim()) return;

        try {
            const addedItem = await apiFetch<any>('/api/operations/equipment/custom', {
                method: 'POST',
                body: JSON.stringify({
                    bookingId,
                    itemName: form.name,
                    notes: form.notes
                })
            });

            const mappedItem: EquipmentItem = {
                id: addedItem.id,
                name: addedItem.itemName,
                status: addedItem.status as any || 'pending',
                isCustom: true,
                description: addedItem.notes
            };

            setLogisticsData(prev => prev.map(b => {
                if (b.id === bookingId) {
                    return { ...b, equipment: [...b.equipment, mappedItem] };
                }
                return b;
            }));

            // Reset form
            setNewItemForm(prev => ({
                ...prev,
                [bookingId]: { name: '', notes: '', isOpen: false }
            }));
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Gagal menambahkan item manual');
        }
    };

    const handleDeleteCustomItem = async (bookingId: string, itemId: string) => {
        if (!confirm('Hapus item manual ini?')) return;
        try {
            await apiFetch(`/api/operations/equipment/custom/${itemId}`, {
                method: 'DELETE'
            });
            setLogisticsData(prev => prev.map(b => {
                if (b.id === bookingId) {
                    return { ...b, equipment: b.equipment.filter(e => e.id !== itemId) };
                }
                return b;
            }));
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Gagal menghapus item manual');
        }
    };

    const filteredLogisticsData = useMemo(() => {
        return logisticsData.filter(booking => {
            if (filterStatus === 'all') return true;
            const receivedCount = booking.equipment.filter(item => item.status === 'received').length;
            const totalCount = booking.equipment.length;
            if (totalCount === 0) return filterStatus === 'pending';
            const isCompleted = receivedCount === totalCount;
            return filterStatus === 'completed' ? isCompleted : !isCompleted;
        });
    }, [logisticsData, filterStatus]);

    const getCompletionPercentage = (booking: BookingLogistics) => {
        if (!booking.equipment || booking.equipment.length === 0) return 0;
        const receivedCount = booking.equipment.filter(item => item.status === 'received').length;
        return Math.round((receivedCount / booking.equipment.length) * 100);
    };

    const getStatusLabel = (booking: BookingLogistics) => {
        const percentage = getCompletionPercentage(booking);
        if (percentage === 100) return 'Selesai';
        if (percentage > 0) return 'Sebagian';
        return 'Belum Dimulai';
    };

    const getStatusColor = (booking: BookingLogistics) => {
        const percentage = getCompletionPercentage(booking);
        if (percentage === 100) return '#22c55e'; // Green
        if (percentage > 0) return '#eab308'; // Yellow
        return '#ef4444'; // Red
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Logistik & Perlengkapan</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Pantau distribusi perlengkapan jamaah</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#1a1917', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Keberangkatan</span>
                        <select value={selectedDepartureId} onChange={(e) => setSelectedDepartureId(e.target.value)}
                            style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                            {departures.map(d => <option key={d.id} value={d.id}>{d.departureDate} - {d.package?.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setFilterStatus('all')}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)',
                                background: filterStatus === 'all' ? 'var(--color-primary)' : '#1a1917',
                                color: filterStatus === 'all' ? 'white' : 'var(--color-text-muted)',
                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s'
                            }}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)',
                                background: filterStatus === 'completed' ? 'var(--color-primary)' : '#1a1917',
                                color: filterStatus === 'completed' ? 'white' : 'var(--color-text-muted)',
                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s'
                            }}
                        >
                            Selesai
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)',
                                background: filterStatus === 'pending' ? 'var(--color-primary)' : '#1a1917',
                                color: filterStatus === 'pending' ? 'white' : 'var(--color-text-muted)',
                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s'
                            }}
                        >
                            Belum Selesai
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Sinkronisasi data logistik...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {filteredLogisticsData.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                            Tidak ada data logistik untuk filter ini.
                        </div>
                    )}
                    {filteredLogisticsData.map((data) => (
                        <div key={data.id} style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontWeight: 700, color: 'white', margin: '0 0 0.125rem 0' }}>{data.pilgrim?.name}</h3>
                                    <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>{data.pilgrim?.phone}</p>
                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                        <span style={{
                                            fontSize: '0.625rem',
                                            fontWeight: 700,
                                            background: data.equipmentSetName?.toLowerCase().includes('gold') ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)',
                                            color: data.equipmentSetName?.toLowerCase().includes('gold') ? '#eab308' : '#aaa',
                                            padding: '0.125rem 0.375rem',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase'
                                        }}>
                                            🏷️ {data.equipmentSetName}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '0.125rem 0.5rem', borderRadius: '0.25rem' }}>
                                        #{data.id.substring(0, 6)}
                                    </span>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 600,
                                        color: getStatusColor(data),
                                        background: `${getStatusColor(data)}20`,
                                        padding: '0.125rem 0.5rem', borderRadius: '0.25rem'
                                    }}>
                                        {getStatusLabel(data)} ({getCompletionPercentage(data)}%)
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {data.equipment.map((item) => (
                                    <div key={item.id} onClick={() => toggleStatus(data.id, item.id, item.status, !!item.isCustom)} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                                        background: item.status === 'received' 
                                            ? (item.isCustom ? 'rgba(59,130,246,0.15)' : 'rgba(34,197,94,0.15)') 
                                            : (item.isCustom ? 'rgba(59,130,246,0.05)' : '#0a0907'),
                                        border: item.status === 'received' 
                                            ? (item.isCustom ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(34,197,94,0.3)') 
                                            : (item.isCustom ? '1px solid rgba(59,130,246,0.2)' : '1px solid #333'),
                                        color: item.status === 'received' 
                                            ? (item.isCustom ? '#60a5fa' : '#22c55e') 
                                            : (item.isCustom ? '#93c5fd' : '#ccc'),
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                            {updating === `${data.id}-${item.id}` ? (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>...</span>
                                            ) : (
                                                <div style={{
                                                    width: '20px', height: '20px', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: item.status === 'received' 
                                                        ? (item.isCustom ? '#3b82f6' : '#22c55e') 
                                                        : 'transparent',
                                                    border: item.status === 'received' 
                                                        ? (item.isCustom ? '2px solid #3b82f6' : '2px solid #22c55e') 
                                                        : '2px solid #555',
                                                }}>
                                                    {item.status === 'received' && <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'white' }}>check</span>}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.name}</span>
                                                {item.isCustom && item.description && (
                                                    <span style={{ fontSize: '0.7rem', color: '#93c5fd', opacity: 0.8 }}>Note: {item.description}</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {item.isCustom && (
                                                <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.125rem 0.375rem', borderRadius: '4px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', textTransform: 'uppercase' }}>Manual</span>
                                            )}
                                            {item.status === 'received' && !item.isCustom && <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>Ada</span>}
                                            {item.isCustom && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCustomItem(data.id, item.id);
                                                    }} 
                                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {data.equipment.length === 0 && (
                                    <p style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8125rem', color: '#888', fontStyle: 'italic' }}>Belum ada item perlengkapan.</p>
                                )}

                                {/* Inline form to add manual items */}
                                {(!newItemForm[data.id] || !newItemForm[data.id].isOpen) ? (
                                    <button 
                                        onClick={() => setNewItemForm(prev => ({
                                            ...prev,
                                            [data.id]: { name: '', notes: '', isOpen: true }
                                        }))}
                                        style={{
                                            marginTop: '0.5rem',
                                            padding: '0.5rem',
                                            border: '1px dashed rgba(255,255,255,0.15)',
                                            borderRadius: '0.5rem',
                                            background: 'transparent',
                                            color: 'var(--color-primary)',
                                            fontWeight: 600,
                                            fontSize: '0.8125rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.25rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                                        Tambah Item Manual
                                    </button>
                                ) : (
                                    <div style={{
                                        marginTop: '0.5rem',
                                        padding: '0.75rem',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '0.5rem',
                                        background: 'rgba(0,0,0,0.2)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}>
                                        <input
                                            type="text"
                                            placeholder="Nama item (contoh: Kursi Roda)"
                                            value={newItemForm[data.id].name}
                                            onChange={e => setNewItemForm(prev => ({
                                                ...prev,
                                                [data.id]: { ...prev[data.id], name: e.target.value }
                                            }))}
                                            style={{
                                                width: '100%',
                                                padding: '0.375rem 0.5rem',
                                                background: '#0a0907',
                                                border: '1px solid #333',
                                                color: 'white',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.8125rem',
                                                outline: 'none'
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Catatan (opsional)"
                                            value={newItemForm[data.id].notes}
                                            onChange={e => setNewItemForm(prev => ({
                                                ...prev,
                                                [data.id]: { ...prev[data.id], notes: e.target.value }
                                            }))}
                                            style={{
                                                width: '100%',
                                                padding: '0.375rem 0.5rem',
                                                background: '#0a0907',
                                                border: '1px solid #333',
                                                color: 'white',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.8125rem',
                                                outline: 'none'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => setNewItemForm(prev => ({
                                                    ...prev,
                                                    [data.id]: { name: '', notes: '', isOpen: false }
                                                }))}
                                                style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Batal
                                            </button>
                                            <button 
                                                onClick={() => handleAddCustomItem(data.id)}
                                                style={{
                                                    background: 'var(--color-primary)',
                                                    border: 'none',
                                                    color: 'black',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Simpan
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                @media (max-width: 600px) {
                    .logistics-header { flex-direction: column !important; align-items: flex-start !important; }
                    .logistics-header > div:last-child { flex-wrap: wrap; }
                    .filter-btns { overflow-x: auto; padding-bottom: 4px; }
                }
            `}</style>
        </div>
    );
};

export default LogisticsChecklist;
