'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = '로그인 중 알 수 없는 오류가 발생했습니다.';
  if (error === 'auth_failed') {
    errorMessage = '로그인에 실패했습니다. GitHub 인증을 다시 시도해주세요.';
  } else if (error === 'internal_error') {
    errorMessage = '서버 내부 오류로 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', textAlign: 'center' }}>
      <h1>로그인 오류</h1>
      <p>{errorMessage}</p>
      <Link href="/">홈으로 돌아가기</Link>
      {/* 필요하다면 GitHub 로그인 재시도 버튼 추가 */}
      {/* <Link href="YOUR_GITHUB_AUTH_URL_HERE">GitHub 로그인 다시 시도</Link> */}
    </div>
  );
}
