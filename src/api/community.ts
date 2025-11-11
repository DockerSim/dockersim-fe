// dockersim-fe/src/api/community.ts
import axiosInstance from './axiosInstance';

// PostType을 이 파일에 직접 정의하여 순환 참조를 제거합니다.
export type PostType = 'QUESTION' | 'SIMULATION' | 'TECHNICAL';

// ... (나머지 인터페이스 정의는 이전과 동일) ...

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  author: string;
  type: PostType;
  createdAt: string;
  likesCount: number;
  views: number;
  tags: string;
  commentsCount: number;
}

export interface PostRequest {
  title: string;
  content: string;
  type: PostType;
  tags?: string;
}

export interface PostCommentResponse {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
}

export interface PostCommentRequest {
  content: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  code: string | null;
  errorMessage: string | null;
}

// Post API
export const communityApi = {
  // 게시글 생성
  createPost: async (postData: PostRequest): Promise<ApiResponse<PostResponse>> => {
    const response = await axiosInstance.post<ApiResponse<PostResponse>>('/posts', postData);
    return response.data;
  },

  // 모든 게시글 조회
  getAllPosts: async (keyword?: string, type?: PostType): Promise<ApiResponse<PostResponse[]>> => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (type) params.append('type', type);
    const response = await axiosInstance.get<ApiResponse<PostResponse[]>>(`/posts?${params.toString()}`);
    return response.data;
  },

  // 특정 게시글 조회
  getPost: async (postId: number): Promise<ApiResponse<PostResponse>> => {
    const response = await axiosInstance.get<ApiResponse<PostResponse>>(`/posts/${postId}`);
    return response.data;
  },

  // 게시글 수정
  updatePost: async (postId: number, postData: PostRequest): Promise<ApiResponse<PostResponse>> => {
    const response = await axiosInstance.put<ApiResponse<PostResponse>>(`/posts/${postId}`, postData);
    return response.data;
  },

  // 게시글 삭제
  deletePost: async (postId: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/posts/${postId}`);
    return response.data;
  },

  // 게시글 좋아요 토글
  toggleLike: async (postId: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.post<ApiResponse<void>>(`/posts/${postId}/like`);
    return response.data;
  },

  // 게시글 좋아요 수 조회
  getLikesCount: async (postId: number): Promise<ApiResponse<number>> => {
    const response = await axiosInstance.get<ApiResponse<number>>(`/posts/${postId}/likes`);
    return response.data;
  },

  // 댓글 작성
  createComment: async (postId: number, commentData: PostCommentRequest): Promise<ApiResponse<PostCommentResponse>> => {
    const response = await axiosInstance.post<ApiResponse<PostCommentResponse>>(`/posts/${postId}/comments`, commentData);
    return response.data;
  },

  // 특정 게시글의 모든 댓글 조회
  getCommentsByPostId: async (postId: number): Promise<ApiResponse<PostCommentResponse[]>> => {
    const response = await axiosInstance.get<ApiResponse<PostCommentResponse[]>>(`/posts/${postId}/comments`);
    return response.data;
  },

  // 댓글 수정
  updateComment: async (postId: number, commentId: number, commentData: PostCommentRequest): Promise<ApiResponse<PostCommentResponse>> => {
    const response = await axiosInstance.put<ApiResponse<PostCommentResponse>>(`/posts/${postId}/comments/${commentId}`, commentData);
    return response.data;
  },

  // 댓글 삭제
  deleteComment: async (postId: number, commentId: number): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(`/posts/${postId}/comments/${commentId}`);
    return response.data;
  },

  // 내가 작성한 게시글 조회
  getMyPosts: async (): Promise<ApiResponse<PostResponse[]>> => {
    const response = await axiosInstance.get<ApiResponse<PostResponse[]>>('/posts/my-posts');
    return response.data;
  },

  // 내가 좋아요한 게시글 조회
  getMyLikedPosts: async (): Promise<ApiResponse<PostResponse[]>> => {
    const response = await axiosInstance.get<ApiResponse<PostResponse[]>>('/posts/my-likes');
    return response.data;
  },
};
