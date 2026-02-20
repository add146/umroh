import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">Terjadi Kesalahan</p>
                        <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tighter">Ups, aplikasi bermasalah</h2>
                        <p className="text-gray-500 text-sm mb-2">
                            Terdapat kesalahan tak terduga. Tim kami telah diberitahu.
                        </p>
                        {this.state.error && (
                            <p className="text-[11px] font-mono text-gray-400 bg-gray-100 rounded-lg p-3 mb-6 text-left break-all">
                                {this.state.error.message}
                            </p>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-opacity-90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                        >
                            Muat Ulang Halaman
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
