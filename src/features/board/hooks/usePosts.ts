import { useState, useCallback } from 'react';
import { Post, CreatePostData, UpdatePostData } from '../types';

interface UsePostsReturn {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  refreshPosts: () => Promise<void>;
  createPost: (data: CreatePostData) => Promise<void>;
  updatePost: (data: UpdatePostData) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  toggleLike: (id: number) => Promise<void>;
}

/**
 * usePosts - 게시글 데이터 관리를 담당하는 커스텀 훅
 * 
 * 책임:
 * - 게시글 목록 상태 관리
 * - CRUD 작업 처리
 * - 로딩 상태 및 에러 처리
 */
export const usePosts = (): UsePostsReturn => {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 게시글 목록 새로고침
   */
  const refreshPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // API 호출 시뮬레이션
      await simulateDelay(1000);
      
      // 실제로는 API에서 데이터를 가져옴
      setPosts([...mockPosts]);
    } catch (err) {
      setError('게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 새 게시글 생성
   */
  const createPost = useCallback(async (data: CreatePostData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await simulateDelay(500);
      
      const newPost: Post = {
        id: Date.now(),
        ...data,
        author: '현재 사용자', // 실제로는 인증된 사용자 정보
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        likes: 0,
        isLiked: false,
      };
      
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      setError('게시글 작성에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 게시글 수정
   */
  const updatePost = useCallback(async (data: UpdatePostData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await simulateDelay(500);
      
      setPosts(prev => 
        prev.map(post => 
          post.id === data.id 
            ? { ...post, ...data, updatedAt: new Date() }
            : post
        )
      );
    } catch (err) {
      setError('게시글 수정에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 게시글 삭제
   */
  const deletePost = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await simulateDelay(500);
      
      setPosts(prev => prev.filter(post => post.id !== id));
    } catch (err) {
      setError('게시글 삭제에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 좋아요 토글
   */
  const toggleLike = useCallback(async (id: number) => {
    try {
      await simulateDelay(200);
      
      setPosts(prev => 
        prev.map(post => 
          post.id === id 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1
              }
            : post
        )
      );
    } catch (err) {
      setError('좋아요 처리에 실패했습니다.');
    }
  }, []);

  return {
    posts,
    isLoading,
    error,
    refreshPosts,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
  };
};

/**
 * 모의 게시글 데이터
 */
const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Docker Container 최적화 방법',
    content: 'Docker 컨테이너를 효율적으로 관리하는 방법에 대해 공유합니다...',
    author: 'dockerPro',
    type: 'share',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    views: 150,
    likes: 12,
    isLiked: false,
  },
  {
    id: 2,
    title: 'Next.js에서 Docker 이미지 빌드 시 문제',
    content: 'Next.js 프로젝트를 Docker로 빌드할 때 자꾸 에러가 발생합니다. 도움 부탁드립니다.',
    author: 'nextjsNewbie',
    type: 'question',
    createdAt: new Date('2024-03-14'),
    updatedAt: new Date('2024-03-14'),
    views: 89,
    likes: 5,
    isLiked: true,
  },
  {
    id: 3,
    title: 'Docker Compose 네트워킹 토론',
    content: 'Docker Compose에서 서비스 간 네트워킹에 대해 논의해봅시다.',
    author: 'networkGuru',
    type: 'discussion',
    createdAt: new Date('2024-03-13'),
    updatedAt: new Date('2024-03-13'),
    views: 67,
    likes: 8,
    isLiked: false,
  },
];

/**
 * 비동기 작업 시뮬레이션
 */
function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 