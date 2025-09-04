'use client';

import React from 'react';

export const handleGithubLogin = () => {
    const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const REDIRECT_URI = 'http://localhost:3000/login/github';

    const GITHUB_AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;

    console.log('Redirecting to:', GITHUB_AUTH_URL);

    window.location.href = GITHUB_AUTH_URL;
};

const GithubLoginButton = () => {
    return (
        <button onClick={handleGithubLogin} className="github-login-button">
            GitHub으로 로그인
        </button>
    );
};

export default GithubLoginButton;
