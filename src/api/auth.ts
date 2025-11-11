// dockersim-fe/src/api/auth.ts
import axiosInstance from './axiosInstance';
import { User } from '@/store/authStore'; // authStore에서 User 타입 임포트

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isAdditionalInfoRequired: boolean;
  user: User; // 사용자 정보 필드 추가
}

export const authApi = {
  githubLogin: async (code: string): Promise<LoginResponse> => {
    const response = await axiosInstance.get<LoginResponse>(`/login/github?code=${code}`); // <-- 이 줄을 변경
    return response.data;
  },
  // TODO: 필요하다면 refreshToken을 사용하여 accessToken을 갱신하는 API 추가
};
