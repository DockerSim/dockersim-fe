import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// API 서버의 기본 URL을 설정합니다.
// 환경 변수를 사용하여 유연하게 관리하는 것이 좋습니다.
// const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'; // 이 줄을 주석 처리하거나 삭제
const baseURL = '/api'; // Next.js 개발 서버의 프록시를 사용하도록 변경

const axiosInstance = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// 요청 인터셉터 (Request Interceptor)
// 모든 요청이 서버로 전송되기 전에 실행됩니다.
axiosInstance.interceptors.request.use(
    (config) => {
        // Zustand 스토어에서 상태를 가져옵니다.
        // 컴포넌트 밖에서는 hook을 사용할 수 없으므로 .getState()를 사용합니다.
        const { accessToken } = useAuthStore.getState();

        // accessToken이 있는 경우, Authorization 헤더에 추가합니다.
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        // 요청 설정 중 에러가 발생한 경우
        return Promise.reject(error);
    }
);

export default axiosInstance;