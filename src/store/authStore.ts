import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 사용자 정보 타입
export interface User {
    id: number;
    userPublicId: string; // publicId -> userPublicId로 변경
    name: string;
    email: string;
    // 기타 필요한 사용자 정보
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    isLoggedIn: boolean;
    user: User | null; // 사용자 정보 추가
    login: (accessToken: string, refreshToken: string, user: User) => void; // user 정보도 함께 저장
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
            user: null, // 초기값 null
            login: (accessToken, refreshToken, user) => set({
                accessToken,
                refreshToken,
                isLoggedIn: true,
                user, // 로그인 시 사용자 정보 저장
            }),
            logout: () => set({
                accessToken: null,
                refreshToken: null,
                isLoggedIn: false,
                user: null, // 로그아웃 시 사용자 정보 제거
            }),
            setAccessToken: (token) => set({ accessToken: token }),
        }),
        {
            name: 'auth-storage', // localStorage에 저장될 때 사용될 키 이름
            // user 객체가 persist 되지 않는 문제를 해결하기 위해 partialize 추가
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isLoggedIn: state.isLoggedIn,
                user: state.user, // user 객체를 명시적으로 포함
            }),
        }
    )
);