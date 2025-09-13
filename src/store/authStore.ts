import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    isLoggedIn: boolean;
    login: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
    setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
    // persist를 사용하면 상태가 localStorage에 저장되어 새로고침해도 유지됩니다.
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            isLoggedIn: false,
            login: (accessToken, refreshToken) => set({
                accessToken,
                refreshToken,
                isLoggedIn: true,
            }),
            logout: () => set({
                accessToken: null,
                refreshToken: null,
                isLoggedIn: false,
            }),
            setAccessToken: (token) => set({ accessToken: token }),
        }),
        {
            name: 'auth-storage', // localStorage에 저장될 때 사용될 키 이름
        }
    )
);