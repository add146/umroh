import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { QuickBookModal } from '../components/QuickBookModal';

export const AgentPilgrimDirectory: React.FC = () => {
    const [pilgrims, setPilgrims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
    
    // For Quick Book Modal
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedPilgrim, setSelectedPilgrim] = useState<any>(null);

    useEffect(() => {
        fetchPilgrims();
    }, []);

    const fetchPilgrims = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<any>('/api/agent/pilgrims');
            setPilgrims(data.pilgrims || []);
        } catch (err) {
            console.error('Failed to fetch pilgrims', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const openBookingModal = (pilgrim: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedPilgrim(pilgrim);
        setIsBookingModalOpen(true);
    };

    const handleBookingSuccess = () => {
        alert('Pendaftaran berhasil! Jamaah akan muncul di halaman Data Jamaahku.');
        fetchPilgrims(); // refresh history just in case
    };

    const filteredPilgrims = pilgrims.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const nik = (p.noKtp || '').toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        return name.includes(q) || nik.includes(q) || phone.includes(q);
    });

    const renderCard = (p: any) => {
        const isExpanded = expandedCards[p.id] || false;
        
        // Sort history by date
        const sortedHistory = [...p.history].sort((a: any, b: any) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime());

        return (
            <div key={p.id} style={{
                backgroundColor: 'rgb(30, 29, 27)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isExpanded ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none'
            }} onClick={() => toggleExpand(p.id)}>
                {/* Header (Always Visible) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--color-primary)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-bg)', fontWeight: 'bold', fontSize: '1.1rem'
                        }}>
                            {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                {p.name}
                            </h3>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>badge</span>
                                {p.noKtp || 'NIK Belum Diisi'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total Perjalanan</div>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{p.history.length}x</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                    {p.phone}
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                        
                        {/* History Table */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '0.375rem',
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                Riwayat Keberangkatan
                            </div>
                            
                            {sortedHistory.map((h: any) => (
                                <div key={h.bookingId} style={{ 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.25rem'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-light)' }}>
                                            {h.packageName}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                            {h.departureDate ? new Date(h.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '0.15rem 0.4rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700,
                                        backgroundColor: h.bookingStatus === 'departed' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(12, 165, 233, 0.15)',
                                        color: h.bookingStatus === 'departed' ? '#4ade80' : '#38bdf8'
                                    }}>
                                        {h.bookingStatus.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <button
                                onClick={(e) => openBookingModal(p, e)}
                                style={{
                                    flex: 1, padding: '0.625rem', borderRadius: '0.375rem',
                                    background: 'var(--color-primary)', color: 'var(--color-bg)',
                                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                                Pilihkan Paket (Daftar Baru)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>
                        List Jamaah
                    </h1>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Daftar lengkap seluruh jamaah Anda. Follow-up untuk repeat order Umroh/Haji!
                    </p>
                </div>
            </div>

            {/* Main Content Card */}
            <div style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '400px' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '20px' }}>search</span>
                            <input
                                type="text"
                                placeholder="Cari nama, NIK, atau no HP..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)',
                                    color: 'var(--color-text)', fontSize: '0.875rem'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Memuat data jamaah...</div>
                ) : filteredPilgrims.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px dashed var(--color-border)' }}>
                        Belum ada jamaah yang sesuai pencarian.
                    </div>
                ) : (
                    <div>
                        {filteredPilgrims.map(p => renderCard(p))}
                    </div>
                )}
            </div>

            <QuickBookModal 
                isOpen={isBookingModalOpen} 
                onClose={() => setIsBookingModalOpen(false)} 
                onSuccess={handleBookingSuccess}
                pilgrim={selectedPilgrim}
            />

        </div>
    );
};
