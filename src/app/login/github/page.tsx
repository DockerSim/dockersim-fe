'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

function GitHubCallback() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login } = useAuthStore();

    useEffect(() => {
        // URL에서 'code' 파라미터를 추출합니다.
        const code = searchParams.get('code');

        async function getToken() {
            if (code) {
                try {
                    // 1. 백엔드 API로 'code'를 쿼리 파라미터에 담아 GET 요청을 보냅니다.
                    const response = await fetch(`/api/auth/github/callback?code=${code}`);

                    const data = await response.json();

                    if (response.ok && data.accessToken) {
                        // 2. 성공적으로 accessToken을 받으면, Zustand 스토어에 저장합니다.
                        login(data.accessToken, 'dummy-refresh-token');
                        
                        // 3. 로그인 성공 후 사용자를 홈 페이지로 리디렉션합니다.
                        router.push('/');
                    } else {
                        // 에러 처리: 로그인 페이지나 에러 페이지로 리디렉션
                        console.error('Failed to get access token:', data.error);
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

    // 인증 처리 중 사용자에게 보여줄 로딩 화면
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <h2>로그인 중입니다...</h2>
        </div>
    );
}

// Suspense로 감싸서 useSearchParams 사용에 대한 Next.js의 권장 사항을 따릅니다.
export default function GitHubCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GitHubCallback />
        </Suspense>
    );
}
