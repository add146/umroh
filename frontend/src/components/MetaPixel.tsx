import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../lib/api';

declare global {
    interface Window {
        fbq?: (...args: any[]) => void;
        _fbq?: any;
    }
}

let isPixelInitialized = false;

export default function MetaPixel() {
    const location = useLocation();

    useEffect(() => {
        apiFetch<{ settings: Record<string, any> }>('/api/landing-settings')
            .then(data => {
                const pixelId = data.settings?.facebook_pixel_id;
                if (!pixelId) return;

                if (!window.fbq) {
                    const fbq = function (...args: any[]) {
                        (fbq as any).callMethod ? (fbq as any).callMethod.apply(fbq, args) : (fbq as any).queue.push(args);
                    };
                    (fbq as any).push = fbq;
                    (fbq as any).loaded = true;
                    (fbq as any).version = '2.0';
                    (fbq as any).queue = [];
                    window.fbq = fbq;
                    window._fbq = fbq;

                    const script = document.createElement('script');
                    script.async = true;
                    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
                    document.head.appendChild(script);
                }

                if (!isPixelInitialized) {
                    window.fbq!('init', pixelId);
                    isPixelInitialized = true;
                    // Initial page view
                    window.fbq!('track', 'PageView');
                }
            })
            .catch(console.error);
    }, []);

    // Track PageView on every route change
    useEffect(() => {
        if (isPixelInitialized && window.fbq) {
            try {
                window.fbq('track', 'PageView');
            } catch (e) {
                console.error('Meta Pixel PageView tracking failed:', e);
            }
        }
    }, [location]);

    return null;
}
