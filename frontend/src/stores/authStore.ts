import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = {
    id: string;
    email: string;
    name: string;
    role: 'pusat' | 'cabang' | 'mitra' | 'agen' | 'reseller';
};

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string) => void;
    logout: () => void;
    updateAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
            logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
            updateAccessToken: (accessToken) => set({ accessToken }),
        }),
        {
            name: 'umroh-auth-storage',
        }
    )
);
