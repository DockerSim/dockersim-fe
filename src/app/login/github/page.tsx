'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

function GitHubCallback() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login } = useAuthStore();

    useEffect(() => {
        const code = searchParams.get('code');

        async function getToken() {
            if (code) {
                try {
                    console.log("--- GitHub Login Callback Debug Info ---");
                    console.log("Fetching GitHub access token with code:", code);
                    
                    const data = await authApi.githubLogin(code);
                    console.log("Received data from authApi.githubLogin:", data);

                    if (data.accessToken && data.user) {
                        console.log("Calling authStore.login with:", {
                            accessToken: data.accessToken ? "Present" : "Missing",
                            refreshToken: data.refreshToken ? "Present" : "Missing",
                            user: data.user,
                            userPublicId: data.user.userPublicId // userPublicId 필드 확인
                        });
                        login(data.accessToken, data.refreshToken, data.user);
                        console.log("AuthStore state after login:", useAuthStore.getState()); // 로그인 후 스토어 상태 확인
                        router.push('/');
                    } else {
                        console.error('Failed to get access token or user data:', data);
                        router.push('/login?error=auth_failed');
                    }
                } catch (error) {
                    console.error('Callback handler error:', error);
                    router.push('/login?error=internal_error');
                }
            }
        }

        getToken();
    }, [searchParams, router, login]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h2>로그인 중입니다...</h2>
        </div>
    );
}

export default function GitHubCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GitHubCallback />
        </Suspense>
    );
}
