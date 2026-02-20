import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
            <div className="text-center max-w-md">
                {/* Brand Icon */}
                <div className="w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-brand-primary/20">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                {/* Error Code */}
                <p className="text-sm font-black text-brand-secondary uppercase tracking-widest mb-2">Error 404</p>
                <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter">
                    Halaman Tidak Ditemukan
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
                    Silakan kembali ke beranda.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/"
                        className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                    >
                        Kembali ke Beranda
                    </Link>
                    <Link
                        to="/dashboard"
                        className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                    >
                        Buka Dashboard
                    </Link>
                </div>
            </div>

            {/* Footer branding */}
            <p className="absolute bottom-8 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                AL MADINAH UMROH &amp; HAJI
            </p>
        </div>
    );
};

export default NotFound;
