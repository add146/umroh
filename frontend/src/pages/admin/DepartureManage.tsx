import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Calendar, Plane, Users, CheckCircle, Clock, AlertCircle, Eye, RefreshCw, BarChart3, Backpack } from 'lucide-react';
import { Link } from 'react-router-dom';

const DepartureManage: React.FC = () => {
    const [departures, setDepartures] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchDepartures = async () => {
        try {
            const data = await apiFetch<{ departures: any[], summary: any }>('/api/departures');
            setDepartures(data.departures || []);
            setSummary(data.summary || null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchDepartures();
    }, []);

    // Helper functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-[#10b981]/10 text-emerald-500 border-emerald-500/20';
            case 'last_call': return 'bg-[#f59e0b]/10 text-amber-500 border-amber-500/20';
            case 'full': return 'bg-[#ef4444]/10 text-red-500 border-red-500/20';
            case 'departed': return 'bg-[#3b82f6]/10 text-blue-500 border-blue-500/20';
            default: return 'bg-[#64748b]/10 text-gray-500 border-gray-500/20';
        }
    };

    const getSiskoColor = (status: string) => {
        switch (status) {
            case 'synced': return 'bg-[#22c55e]/10 text-green-500';
            case 'pending': return 'bg-[#eab308]/10 text-yellow-500';
            case 'error': return 'bg-[#ef4444]/10 text-red-500';
            default: return 'bg-[#64748b]/10 text-gray-500';
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--color-border)] pb-8 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Jadwal Keberangkatan</h1>
                    <p className="text-gray-400">Pantau seluruh jadwal keberangkatan, status kuota, dan sinkronisasi SISKOPATUH.</p>
                </div>
                <button
                    onClick={fetchDepartures}
                    className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-gray-300 hover:bg-white/5 transition-all text-sm font-bold"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Segarkan Data
                </button>
            </div>

            {/* Summary Metrics */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="dark-card p-6 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center text-blue-500">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Jadwal</p>
                            <p className="text-2xl font-black text-white">{summary.totalDepartures}</p>
                        </div>
                    </div>
                    <div className="dark-card p-6 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-bg)] flex items-center justify-center text-primary">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Kursi Terisi</p>
                            <p className="text-2xl font-black text-white">{summary.bookedSeats} <span className="text-sm text-gray-500">/ {summary.totalSeats}</span></p>
                        </div>
                    </div>
                    <div className="dark-card p-6 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#22c55e]/10 flex items-center justify-center text-green-500">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Sisko Tersinkron</p>
                            <p className="text-2xl font-black text-white">{summary.siskopatuh?.synced || 0}</p>
                        </div>
                    </div>
                    <div className="dark-card p-6 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#eab308]/10 flex items-center justify-center text-yellow-500">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Sisko Pending</p>
                            <p className="text-2xl font-black text-white">{summary.siskopatuh?.pending || 0}</p>
                            {summary.siskopatuh?.error > 0 && <span className="text-xs text-red-400 font-bold ml-2">({summary.siskopatuh?.error} Error)</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Departures List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : departures.length === 0 ? (
                <div className="dark-card p-16 text-center rounded-3xl border border-[var(--color-border)] shadow-xl flex flex-col items-center justify-center">
                    <div className="bg-[var(--color-primary-bg)] w-24 h-24 rounded-full flex items-center justify-center mb-6">
                        <Backpack className="w-12 h-12 text-primary opacity-80" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-3 tracking-wide">Belum Ada Jadwal</h3>
                    <p className="text-sm text-gray-400 font-medium max-w-md mx-auto leading-relaxed">Jadwal keberangkatan ditambahkan melalui tab <span className="text-white font-bold">Keberangkatan</span> pada halaman kelola detail masing-masing paket.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {departures.map(dep => {
                        const progress = dep.totalSeats > 0 ? (dep.bookedSeats / dep.totalSeats) * 100 : 0;
                        return (
                            <div key={dep.id} className="dark-card rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col hover:border-white/20 transition-all">
                                {/* Card Header */}
                                <div className="p-6 border-b border-white/5 flex justify-between items-start gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${getStatusColor(dep.status)}`}>
                                                {dep.status.replace('_', ' ')}
                                            </span>
                                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-1 ${getSiskoColor(dep.siskopatuhStatus)}`}>
                                                {dep.siskopatuhStatus === 'synced' ? <CheckCircle className="w-3 h-3" /> : dep.siskopatuhStatus === 'error' ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                Sisko: {dep.siskopatuhStatus}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white leading-tight mb-1">{dep.tripName || dep.package?.name || 'Paket Reguler'}</h3>
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(dep.departureDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            {dep.departureAirline && (
                                                <span className="flex items-center gap-1">
                                                    <Plane className="w-3.5 h-3.5" />
                                                    {dep.departureAirline.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-black text-white">{dep.departureAirport?.code || dep.airport}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">({dep.departureAirport?.city || 'CGK'})</div>
                                    </div>
                                </div>

                                {/* Body / Detailed info */}
                                <div className="p-6 bg-[#131210]/30 flex-1 space-y-5">
                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Keterisian Kuota</span>
                                            <span className="text-sm font-black text-white">{dep.bookedSeats} <span className="text-gray-500">/ {dep.totalSeats} Pax</span></span>
                                        </div>
                                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden w-full">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? 'bg-red-500' : progress > 75 ? 'bg-yellow-500' : 'bg-primary'}`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Room Badges */}
                                    {dep.roomTypes && dep.roomTypes.length > 0 && (
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Opsi Kamar Aktif</span>
                                            <div className="flex flex-wrap gap-2">
                                                {dep.roomTypes.map((room: any) => (
                                                    <span key={room.id} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-gray-300">
                                                        {room.name} ({room.capacity} Pax)
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="p-4 border-t border-white/5 bg-[#131210] flex justify-between items-center gap-2">
                                    <div className="flex gap-2">
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/export/siskopatuh/${dep.id}`}
                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                            onClick={(e) => { e.preventDefault(); alert('Modul Export Siskopatuh belum aktif di env ini.'); }}
                                        >
                                            <BarChart3 className="w-3.5 h-3.5" /> SISKO
                                        </a>
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/export/manifest/${dep.id}`}
                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                            onClick={(e) => { e.preventDefault(); alert('Modul Export Manifest belum aktif di env ini.'); }}
                                        >
                                            <Users className="w-3.5 h-3.5" /> Manifest
                                        </a>
                                    </div>
                                    <Link
                                        to={`/admin/packages/${dep.packageId}`}
                                        className="px-4 py-2 bg-[var(--color-primary-bg)] text-primary hover:bg-[#a88a36]/20 hover:scale-105 active:scale-95 transition-all text-xs font-bold rounded-lg flex items-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" /> Kelola Detail
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DepartureManage;
