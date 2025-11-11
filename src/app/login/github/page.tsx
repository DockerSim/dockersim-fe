'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth'; // authApi 임포트

function GitHubCallback() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login } = useAuthStore();

    useEffect(() => {
        const code = searchParams.get('code');

        async function getToken() {
            if (code) {
                try {
                    // authApi.githubLogin 호출
                    const data = await authApi.githubLogin(code);

                    if (data.accessToken) {
                        login(data.accessToken, data.refreshToken); // refreshToken도 저장하도록 수정
                        router.push('/');
                    } else {
                        console.error('Failed to get access token:', data);
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
