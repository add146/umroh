import React, { useEffect, useState } from 'react';
import PackageCard from '../components/PackageCard';
import { apiFetch } from '../lib/api';

const Landing: React.FC = () => {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await apiFetch('/api/packages');
                // For each package, we'd ideally fetch its earliest departure
                // Simplified here: just showing active packages
                setPackages(data.packages || []);
            } catch (error) {
                console.error('Failed to fetch packages:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                {/* Background Overlay */}
                <div className="absolute inset-0 bg-brand-primary/40 z-10"></div>
                <img
                    src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=2000"
                    alt="Ka'bah"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="relative z-20 text-center px-4 max-w-4xl">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg leading-tight">
                        Wujudkan Niat Suci Anda <br className="hidden md:block" />
                        Ke <span className="text-brand-secondary">Baitullah</span> Bersama Kami
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
                        Layanan Umroh amanah dengan bimbingan sesuai Sunnah, fasilitas bintang lima, dan pendampingan profesional dari keberangkatan hingga kepulangan.
                    </p>

                    <div className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto border border-brand-secondary/30">
                        <div className="flex-1 flex items-center px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">
                            <span className="text-2xl mr-3 opacity-50">🕋</span>
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-bold text-gray-400">Pilih Paket</p>
                                <select className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 w-full cursor-pointer">
                                    <option>Umroh Reguler</option>
                                    <option>Umroh Plus Turki</option>
                                    <option>Haji Furoda</option>
                                </select>
                            </div>
                        </div>
                        <div className="w-px bg-gray-100 hidden md:block my-2"></div>
                        <div className="flex-1 flex items-center px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors">
                            <span className="text-2xl mr-3 opacity-50">📅</span>
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-bold text-gray-400">Bulan</p>
                                <select className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 w-full cursor-pointer">
                                    <option>Maret 2024</option>
                                    <option>April 2024</option>
                                    <option>Ramadhan 2024</option>
                                </select>
                            </div>
                        </div>
                        <button className="bg-brand-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg active:scale-95">
                            Cari Paket
                        </button>
                    </div>
                </div>
            </section>

            {/* Featured Packages */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Pilihan Paket <span className="text-brand-primary">Terbaik</span></h2>
                        <p className="text-gray-500">Temukan jadwal keberangkatan yang sesuai dengan rencana Anda.</p>
                    </div>
                    <button className="text-brand-primary font-bold hover:underline flex items-center">
                        Lihat Semua <span className="ml-2">→</span>
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[450px] bg-gray-100 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {packages.map((pkg) => (
                            <PackageCard
                                key={pkg.id}
                                id={pkg.id}
                                name={pkg.name}
                                description={pkg.description}
                                basePrice={pkg.basePrice}
                                image={pkg.image}
                                onBook={(id) => window.location.href = `/register?package=${id}`}
                            />
                        ))}
                        {packages.length === 0 && (
                            <div className="col-span-3 py-20 text-center text-gray-400 border-2 border-dashed rounded-2xl">
                                Belum ada paket yang tersedia saat ini.
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Landing;
