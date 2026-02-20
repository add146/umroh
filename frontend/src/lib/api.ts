import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { accessToken, updateAccessToken, logout } = useAuthStore.getState();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (response.status === 401 && !endpoint.includes('/auth/login')) {
            // Token expired, attempt refresh
            try {
                const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, { method: 'POST' });
                if (refreshRes.ok) {
                    const { accessToken: newToken } = await refreshRes.json();
                    updateAccessToken(newToken);
                    // Retry original request (re-calling ensures we get latest state)
                    return apiFetch<T>(endpoint, options);
                } else {
                    // Refresh failed, logout
                    logout();
                    window.location.href = '/login';
                    throw new Error('Session expired');
                }
            } catch (err) {
                logout();
                window.location.href = '/login';
                throw err;
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        return response.json();
    } catch (error: any) {
        console.error('API Fetch Error:', error);
        throw error;
    }
}

// Convenience wrapper object
export const apiClient = {
    get: (endpoint: string) => apiFetch(`/api${endpoint}`),
    post: (endpoint: string, body: any) => apiFetch(`/api${endpoint}`, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint: string, body: any) => apiFetch(`/api${endpoint}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint: string) => apiFetch(`/api${endpoint}`, { method: 'DELETE' }),
};
