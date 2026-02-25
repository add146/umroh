import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface Testimonial {
    id: string;
    pilgrimName: string;
    departureInfo: string;
    content: string;
    photoR2Key: string | null;
    videoUrl: string | null;
    rating: number;
    createdAt: string;
}

export const TestimonialGallery: React.FC = () => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await apiFetch('/api/testimonials');
                if (res.ok) {
                    const data = await res.json();
                    setTestimonials(data);
                }
            } catch (e) {
                console.error('Failed to fetch testimonials', e);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    if (loading) {
        return (
            <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
            </div>
        );
    }

    if (testimonials.length === 0) {
        return null; // Don't show the section if there are no published testimonials
    }

    // A helper to safely embed youtube videos
    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1];
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return '';
    };

    return (
        <section className="py-24 bg-neutral-950 relative overflow-hidden" id="testimonials">
            <div className="absolute inset-0 max-w-[100vw] overflow-hidden">
                <div className="absolute top-1/4 -left-[20%] w-[40%] aspect-square bg-amber-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 -right-[20%] w-[40%] aspect-square bg-yellow-500/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="absolute top-0 right-0 p-32 opacity-[0.03] pointer-events-none mix-blend-screen">
                <span className="material-symbols-outlined text-amber-500" style={{ fontSize: '400px' }}>format_quote</span>
            </div>

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                <div className="text-center mb-20">
                    <span className="flex items-center justify-center gap-4 text-amber-500 font-semibold tracking-widest text-sm mb-6 uppercase">
                        <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-500/50"></span>
                        Testimoni Jamaah
                        <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-500/50"></span>
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-display tracking-tight">
                        Kisah Inspiratif <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 font-serif italic pr-2">Baitullah</span>
                    </h2>
                    <p className="text-neutral-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Dengarkan langsung pengalaman dan cerita indah dari para jamaah yang telah mempercayakan perjalanan spiritual mereka bersama kami.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((item) => (
                        <div key={item.id} className="group bg-neutral-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-800/60 p-8 sm:p-10 flex flex-col hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.1)] hover:border-amber-500/40 transition-all duration-500 relative overflow-hidden">
                            {/* Decorative gradient blob inside card */}
                            <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/10 rounded-full blur-[60px] group-hover:bg-amber-500/20 transition-all duration-700 pointer-events-none"></div>

                            {/* Stars & Quote Icon */}
                            <div className="flex gap-1 mb-8 text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)] relative border-b border-neutral-800/80 pb-6 w-full">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`material-symbols-outlined text-xl ${i < item.rating ? 'font-variation-fill' : 'text-neutral-800'}`}>
                                        star
                                    </span>
                                ))}
                                <span className="material-symbols-outlined absolute right-0 top-0 text-5xl text-neutral-800/50 group-hover:text-amber-500/20 transition-colors duration-500 font-variation-fill" style={{ transform: 'rotate(180deg)', top: '-10px' }}>
                                    format_quote
                                </span>
                            </div>

                            {/* Content */}
                            <p className="text-neutral-300 italic flex-1 mb-10 relative z-10 text-lg leading-relaxed font-serif font-light">
                                "{item.content}"
                            </p>

                            {/* Video if exists */}
                            {item.videoUrl && getEmbedUrl(item.videoUrl) && (
                                <div className="mb-8 rounded-xl overflow-hidden aspect-video bg-neutral-950 border border-neutral-800/80 relative z-10 ring-1 ring-white/5 shadow-2xl">
                                    <iframe
                                        src={getEmbedUrl(item.videoUrl)}
                                        className="w-full h-full"
                                        title={`Testimonial Video by ${item.pilgrimName}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {/* User Info */}
                            <div className="flex items-center gap-5 mt-auto relative z-10 bg-gradient-to-t from-neutral-900/80 to-transparent -mx-10 -mb-10 px-10 pb-10 pt-10 border-t border-neutral-800/50">
                                {item.photoR2Key ? (
                                    <div className="relative shrink-0">
                                        <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-600 to-yellow-300 rounded-full blur-[6px] opacity-40 group-hover:opacity-80 transition duration-700"></div>
                                        <img
                                            src={`/api/documents/${item.photoR2Key}`}
                                            alt={item.pilgrimName}
                                            className="w-16 h-16 rounded-full object-cover border border-neutral-800 relative z-10 ring-2 ring-neutral-900 group-hover:ring-amber-500/50 transition-all duration-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative shrink-0">
                                        <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-600 to-yellow-300 rounded-full blur-[6px] opacity-40 group-hover:opacity-80 transition duration-700"></div>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-700 text-amber-500 flex items-center justify-center font-bold text-2xl relative z-10 ring-2 ring-neutral-900 group-hover:ring-amber-500/50 transition-all duration-500">
                                            {item.pilgrimName.charAt(0)}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-white text-lg tracking-wide group-hover:text-amber-400 transition-colors duration-300">{item.pilgrimName}</h4>
                                    <p className="text-xs text-amber-500/70 uppercase tracking-widest font-semibold mt-1.5">{item.departureInfo || 'Jamaah Al Madinah'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
