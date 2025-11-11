// dockersim-fe/src/api/auth.ts
import axiosInstance from './axiosInstance';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isAdditionalInfoRequired: boolean;
}

// 이전에 제가 생성한 ApiResponse 인터페이스는 axios 응답 구조와 맞지 않아 제거합니다.
// axios는 응답 본문을 바로 data 속성에 담아줍니다.

export const authApi = {
  githubLogin: async (code: string): Promise<LoginResponse> => {
    // baseURL('/api') 뒤에 붙는 올바른 경로로 수정합니다.
    const response = await axiosInstance.get<LoginResponse>(`/auth/github/callback?code=${code}`);
    return response.data;
  },
  // TODO: 필요하다면 refreshToken을 사용하여 accessToken을 갱신하는 API 추가
};
