import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../lib/api';

declare global {
    interface Window {
        fbq?: (...args: any[]) => void;
        _fbq?: any;
    }
}

export default function MetaPixel() {
    const location = useLocation();

    useEffect(() => {
        apiFetch<{ settings: Record<string, any> }>('/api/landing-settings')
            .then(data => {
                const pixelId = data.settings?.facebook_pixel_id;
                if (!pixelId) return;

                if (!window.fbq) {
                    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
                        if (f.fbq) return;
                        n = f.fbq = function () {
                            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                        };
                        if (!f._fbq) f._fbq = n;
                        n.push = n;
                        n.loaded = true;
                        n.version = '2.0';
                        n.queue = [];
                        t = b.createElement(e);
                        t.async = true;
                        t.src = v;
                        s = b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t, s);
                    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

                    window.fbq!('init', pixelId);
                }

                // Initial page view
                window.fbq!('track', 'PageView');
            })
            .catch(console.error);
    }, []);

    // Track PageView on every route change
    useEffect(() => {
        if (window.fbq) {
            window.fbq('track', 'PageView');
        }
    }, [location]);

    return null;
}
