import { NextRequest, NextResponse } from 'next/server';

// GET 요청을 처리하는 핸들러 함수
export async function GET(request: NextRequest) {
    try {
        // 1. URL 쿼리 파라미터에서 'code'를 추출합니다.
        const code = request.nextUrl.searchParams.get('code');

        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        if (!code || !clientId || !clientSecret) {
            return NextResponse.json(
                { error: 'Missing required environment variables or code.' },
                { status: 400 }
            );
        }

        // 2. GitHub에 Access Token을 요청합니다.
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST', // GitHub로의 요청은 여전히 POST 방식입니다.
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // 응답을 JSON 형식으로 받기 위해 Accept 헤더 설정
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
            }),
        });

        const tokenData = await tokenResponse.json();

        // 3. GitHub 응답에 에러가 있는지 확인합니다.
        if (tokenData.error) {
            return NextResponse.json(
                { error: tokenData.error_description || 'Failed to fetch access token' },
                { status: 400 }
            );
        }

        // 4. 성공적으로 받은 Access Token을 클라이언트에 반환합니다.
        return NextResponse.json({ accessToken: tokenData.access_token });

    } catch (error) {
        console.error('Auth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
