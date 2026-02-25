import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { QuickBookModal } from '../components/QuickBookModal';
import { KanbanBoard } from '../components/KanbanBoard';
import type { KanbanColumn, KanbanCard } from '../components/KanbanBoard';
import { AlumniTab } from '../components/AlumniTab';
import { PriceCalculator } from '../components/PriceCalculator';
import { PerformanceChart } from '../components/PerformanceChart';
import { TargetWidget } from '../components/TargetWidget';

const PIPELINE_COLUMNS: KanbanColumn[] = [
    { id: 'lead', title: 'Lead / Prospek', color: '#9ca3af' },
    { id: 'terdaftar', title: 'Terdaftar', color: '#3b82f6' },
    { id: 'dp_bayar', title: 'DP Dibayar', color: '#f59e0b' },
    { id: 'cicilan', title: 'Cicilan', color: '#8b5cf6' },
    { id: 'lunas', title: 'Lunas', color: '#10b981' },
    { id: 'berangkat', title: 'Berangkat', color: '#c8a851' }
];

type TabType = 'overview' | 'pipeline' | 'alumni';

export const AgentDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showQuickBook, setShowQuickBook] = useState(false);
    const [showPriceCalc, setShowPriceCalc] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // For Kanban Pipeline
    const [pipelineCards, setPipelineCards] = useState<KanbanCard[]>([]);
    const [loadingPipeline, setLoadingPipeline] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [prospectsRes, bookingsRes, incomingRes] = await Promise.all([
                    apiFetch('/api/prospects'),
                    apiFetch('/api/bookings'),
                    apiFetch('/api/leads/incoming').catch(() => ({ ok: false }))
                ]);

                let prospectCount = 0;
                let activeJamaah = 0;
                let incomingLeadsCount = 0;

                if (prospectsRes.ok) {
                    const data = await prospectsRes.json();
                    prospectCount = data.prospects?.length || 0;
                }
                if (bookingsRes.ok) {
                    const data = await bookingsRes.json();
                    activeJamaah = data.bookings?.length || 0;
                }
                if (incomingRes && incomingRes.ok) {
                    const data = await (incomingRes as Response).json();
                    incomingLeadsCount = data.incomingLeads?.length || 0;
                }

                setStats({ prospectCount, activeJamaah, incomingLeadsCount });
            } catch (err) {
                console.error('Failed to load stats', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, []);

    const fetchPipelineData = async () => {
        setLoadingPipeline(true);
        try {
            const [prospectsRes, bookingsRes] = await Promise.all([
                apiFetch('/api/prospects'),
                apiFetch('/api/bookings')
            ]);

            let cards: KanbanCard[] = [];

            if (prospectsRes.ok) {
                const pData = await prospectsRes.json();
                const prospects = pData.prospects || [];
                prospects.filter((p: any) => p.status !== 'converted').forEach((p: any) => {
                    cards.push({
                        id: `p-${p.id}`,
                        columnId: 'lead',
                        content: (
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 600 }}>{p.fullName}</span>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>person</span>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{p.phone}</span>
                            </div>
                        )
                    });
                });
            }

            if (bookingsRes.ok) {
                const bData = await bookingsRes.json();
                const bookings = bData.bookings || [];

                bookings.forEach((b: any) => {
                    let colId = 'terdaftar';
                    if (b.bookingStatus === 'confirmed' || b.departure?.status === 'departed') {
                        colId = 'berangkat';
                    } else if (b.paymentStatus === 'paid') {
                        colId = 'lunas';
                    } else if (b.paymentStatus === 'partial') {
                        // could be dp or cicilan, let's just categorize as dp_bayar for now, user can move it
                        colId = 'dp_bayar';
                    } else if (b.bookingStatus === 'pending') {
                        colId = 'terdaftar';
                    }

                    // Allow server override mapping if they actually saved a stage
                    // This relies on the new endpoint logic

                    cards.push({
                        id: `b-${b.id}`,
                        columnId: colId,
                        content: (
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 600 }}>{b.pilgrim?.name}</span>
                                    {b.bookingStatus === 'confirmed' && <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>check_circle</span>}
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{b.departure?.package?.name || 'Paket Umroh'}</span>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    <span style={{ fontSize: '0.7rem', background: 'var(--color-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{b.paymentStatus}</span>
                                </div>
                            </div>
                        )
                    });
                });
            }

            setPipelineCards(cards);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPipeline(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'pipeline') {
            fetchPipelineData();
        }
    }, [activeTab]);

    const handleCardMove = async (cardId: string, targetColumnId: string) => {
        // Optimistic UI update
        setPipelineCards(prev => prev.map(c => c.id === cardId ? { ...c, columnId: targetColumnId } : c));

        if (cardId.startsWith('b-')) {
            const bookingId = cardId.replace('b-', '');
            try {
                await apiFetch(`/api/bookings/${bookingId}/pipeline-stage`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stage: targetColumnId })
                });
            } catch (err) {
                console.error("Failed to update stage on server", err);
                fetchPipelineData(); // Revert on fail
            }
        } else if (cardId.startsWith('p-')) {
            // Cannot reliably move a prospect to booking just by dragging without data, so ignore or show modal
            alert("Prospek harus diconvert menjadi booking dari halaman Kelola Prospek, tidak bisa hanya di-drag.");
            fetchPipelineData(); // Revert
        }
    };

    if (isLoading) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

    return (
        <div>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Sales & Follow-Up Hub</h1>
                    <p style={{ color: 'var(--color-text-light)' }}>Selamat datang, {user?.name}. Kelola prospek dan jamaah Anda di sini.</p>
                </div>
                <button
                    onClick={() => setShowQuickBook(true)}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>bolt</span>
                    Pendaftaran Cepat
                </button>
                <button
                    onClick={() => setShowPriceCalc(true)}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 600 }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>calculate</span>
                    Kalkulator Harga
                </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('overview')}
                    style={{
                        background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
                        color: activeTab === 'overview' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === 'overview' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        fontWeight: activeTab === 'overview' ? 700 : 500,
                        fontSize: '1rem',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('pipeline')}
                    style={{
                        background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
                        color: activeTab === 'pipeline' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === 'pipeline' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        fontWeight: activeTab === 'pipeline' ? 700 : 500,
                        fontSize: '1rem',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Pipeline Kanban
                </button>
                <button
                    onClick={() => setActiveTab('alumni')}
                    style={{
                        background: 'none', border: 'none', padding: '1rem 0', cursor: 'pointer',
                        color: activeTab === 'alumni' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeTab === 'alumni' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        fontWeight: activeTab === 'alumni' ? 700 : 500,
                        fontSize: '1rem',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Alumni Jamaah
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    {/* Target Widget */}
                    <div style={{ marginBottom: '1rem' }}>
                        <TargetWidget />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Jamaah Aktif</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.activeJamaah || 0}</p>
                        </div>
                        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Total Prospek</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.prospectCount || 0}</p>
                        </div>
                        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', borderLeft: '4px solid #ef4444' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Lead Masuk Baru</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{stats?.incomingLeadsCount || 0}</p>
                        </div>
                    </div>

                    {/* Antrian Follow-Up Widget */}
                    <FollowUpQueue />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                        <Link to="/prospects" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.2s' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(200, 168, 81, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>contact_mail</span>
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Kelola Prospek</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>CRM pipeline & follow-up calon jamaah</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/agent/jamaah" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.2s' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(200, 168, 81, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>group</span>
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Data Jamaah</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Pantau kelengkapan & status pembayaran</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/agent/leads" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.2s' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>call_received</span>
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Inbox Lead</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Terima lead dari Cabang/Mitra</p>
                                </div>
                            </div>
                        </Link>

                        <Link to="/marketing-kit" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.2s' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(200, 168, 81, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>imagesmode</span>
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Marketing Kit</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Download flyer & copywriting</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    <ResellerList />

                    {/* Performance Chart */}
                    <div style={{ marginTop: '2rem' }}>
                        <PerformanceChart />
                    </div>
                </>
            )}

            {activeTab === 'pipeline' && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pipeline Jamaah</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Geser kartu ke kolom yang sesuai untuk mengupdate status secara cepat.
                        </p>
                    </div>
                    <KanbanBoard
                        columns={PIPELINE_COLUMNS}
                        cards={pipelineCards}
                        onCardMove={handleCardMove}
                        isLoading={loadingPipeline}
                    />
                </div>
            )}

            {activeTab === 'alumni' && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Data Alumni & Repeat Customer</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Lihat daftar jamaah yang sudah pernah berangkat atau lunas untuk penawaran spesial.
                        </p>
                    </div>
                    <AlumniTab />
                </div>
            )}

            {/* Quick Book Modal */}
            <QuickBookModal
                isOpen={showQuickBook}
                onClose={() => setShowQuickBook(false)}
                onSuccess={(id) => {
                    setShowQuickBook(false);
                    navigate(`/payment/${id}`);
                }}
            />

            {/* Price Calculator Modal */}
            {showPriceCalc && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowPriceCalc(false)} />
                    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', borderRadius: '1rem' }}>
                        <PriceCalculator onClose={() => setShowPriceCalc(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

const FollowUpQueue: React.FC = () => {
    const [queue, setQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await apiFetch('/api/bookings');
                if (res.ok) {
                    const data = await res.json();
                    const allBookings = data.bookings || [];
                    // Filter those needing follow-up
                    const needingFollowUp = allBookings.filter((b: any) =>
                        (b.paymentStatus === 'unpaid' || b.paymentStatus === 'partial') && b.bookingStatus !== 'cancelled'
                    );

                    // Sort descending by bookedAt (newest first)
                    needingFollowUp.sort((a: any, b: any) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime());

                    setQueue(needingFollowUp);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const handleWhatsApp = async (id: string, phone: string, name: string, paymentStatus: string) => {
        let textTemplate = '';
        if (paymentStatus === 'unpaid') {
            textTemplate = `Assalamualaikum Bapak/Ibu ${name}, kami dari tim pendaftaran Al-Madinah ingin mengingatkan bahwa pendaftaran umroh Anda telah berhasil, namun kami belum menerima pembayaran DP. Mohon segera melakukan pembayaran agar seat dapat kami amankan.`;
        } else if (paymentStatus === 'partial') {
            textTemplate = `Assalamualaikum Bapak/Ibu ${name}, terima kasih atas pembayaran DP umroh Anda bersama Al-Madinah. Kami ingin menginformasikan sisa tahapan pelunasan...`;
        }

        const message = encodeURIComponent(textTemplate);
        await apiFetch(`/api/bookings/${id}/follow-up`, { method: 'POST' });
        window.open(`https://wa.me/${phone.replace(/^0/, '62')}?text=${message}`, '_blank');
    };

    if (loading) return null; // Or skeleton loader

    if (queue.length === 0) return null; // Don't show if nothing to follow up

    return (
        <div style={{ background: 'rgb(19, 18, 16)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', overflow: 'hidden', padding: '10px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>pending_actions</span>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Antrian Follow-Up ({queue.length})</h3>
                </div>
                <Link to="/agent/jamaah" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', textDecoration: 'none' }}>Lihat Semua →</Link>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Jamaah</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Hutang</th>
                        <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>Aksi Cepat</th>
                    </tr>
                </thead>
                <tbody>
                    {queue.slice(0, 5).map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '1rem 1.5rem' }}>
                                <div style={{ fontWeight: 600 }}>{b.pilgrim?.name}</div>
                                <div style={{ color: 'var(--color-text-light)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{b.pilgrim?.phone}</div>
                            </td>
                            <td style={{ padding: '1rem 1.5rem' }}>
                                <span style={{
                                    padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700,
                                    backgroundColor: b.paymentStatus === 'unpaid' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                    color: b.paymentStatus === 'unpaid' ? '#ef4444' : '#f59e0b'
                                }}>
                                    {b.paymentStatus === 'unpaid' ? 'Belum DP' : 'Belum Lunas'}
                                </span>
                            </td>
                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                {b.pilgrim?.phone && (
                                    <button
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '0.375rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            backgroundColor: 'rgba(37, 211, 102, 0.1)',
                                            color: '#25D366',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.75rem'
                                        }}
                                        onClick={() => handleWhatsApp(b.id, b.pilgrim.phone, b.pilgrim.name, b.paymentStatus)}
                                        title="Kirim Template WA"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chat</span>
                                        Kirim Reminder
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {queue.length > 5 && (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                    +{queue.length - 5} jamaah lainnya perlu di-follow up.
                </div>
            )}
        </div>
    );
};

const ResellerList: React.FC = () => {
    const [resellers, setResellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch<{ resellers: any[] }>('/api/affiliate/my-resellers');
                setResellers(data.resellers || []);
            } catch { /* ignore */ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const frontendUrl = window.location.origin;

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Daftar Reseller Saya ({resellers.length})</h2>
            </div>

            <div style={{ background: 'rgb(19, 18, 16)', border: '1px solid var(--color-border)', borderRadius: '0.3rem', overflow: 'hidden', padding: '10px' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Reseller Aktif</h3>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</div>
                ) : resellers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</p>
                        <p>Belum ada reseller. Bagikan link rekrut di halaman Afiliasi.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nama</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Email</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Link Afiliasi</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Bergabung</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resellers.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{r.name}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)' }}>{r.email}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {r.affiliateCode ? (
                                            <span style={{
                                                padding: '0.25rem 0.5rem', borderRadius: '4px',
                                                background: 'rgba(200,168,81,0.1)', color: 'var(--color-primary)',
                                                fontFamily: 'monospace', fontSize: '0.75rem', cursor: 'pointer'
                                            }}
                                                onClick={() => navigator.clipboard.writeText(`${frontendUrl}/register?ref=${r.affiliateCode}`)}
                                                title="Klik untuk salin"
                                            >
                                                {r.affiliateCode}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)', fontSize: '0.8rem' }}>
                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
