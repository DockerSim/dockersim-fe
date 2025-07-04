import { PostType, BasePost } from '../../../types/shared';

// Feature 레벨의 Post 인터페이스
export interface Post extends BasePost {}

// 게시글 필터 타입
export interface PostFilters {
  selectedType: PostType | 'all';
  searchTerm: string;
  sortBy: 'latest' | 'popular';
}

// 게시글 생성 요청 타입
export interface CreatePostData {
  title: string;
  content: string;
  type: PostType;
}

// 게시글 수정 요청 타입
export interface UpdatePostData extends Partial<CreatePostData> {
  id: number;
}

// Hook 반환 타입들
export interface UsePostsReturn {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  refreshPosts: () => Promise<void>;
  createPost: (data: CreatePostData) => Promise<void>;
  updatePost: (data: UpdatePostData) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  toggleLike: (id: number) => Promise<void>;
}

export interface UsePostFiltersReturn {
  filteredPosts: Post[];
  selectedType: PostType | 'all';
  searchTerm: string;
  sortBy: 'latest' | 'popular';
  setSelectedType: (type: PostType | 'all') => void;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: 'latest' | 'popular') => void;
  resetFilters: () => void;
} 