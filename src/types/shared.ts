// 공유 타입 정의

export type PostType = 'question' | 'share' | 'discussion' | 'notice' | 'simulation';

export const POST_TYPE_CONFIG = {
  question: { 
    label: '질문', 
    color: '#3b82f6',
    description: 'Docker 사용 중 궁금한 점이나 문제를 질문해보세요'
  },
  share: { 
    label: '공유', 
    color: '#10b981',
    description: '유용한 Docker 팁이나 경험을 공유해보세요'
  },
  discussion: { 
    label: '토론', 
    color: '#8b5cf6',
    description: 'Docker 관련 주제로 토론해보세요'
  },
  notice: { 
    label: '공지', 
    color: '#f59e0b',
    description: '중요한 공지사항입니다'
  },
  simulation: { 
    label: '시뮬레이션', 
    color: '#06b6d4',
    description: 'Docker 실습이나 시뮬레이션 내용을 공유해보세요'
  },
} as const;

// 타입 가드 함수들
export const isValidPostType = (type: string): type is PostType => {
  return Object.keys(POST_TYPE_CONFIG).includes(type);
};

export const assertPostType = (type: unknown): PostType => {
  if (typeof type === 'string' && isValidPostType(type)) {
    return type;
  }
  throw new Error(`Invalid post type: ${type}`);
};

// 기본 엔티티 타입들
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BasePost extends BaseEntity {
  title: string;
  content: string;
  type: PostType;
  author: string;
  views: number;
  likes: number;
  isLiked?: boolean;
  tags?: string[];
}

export interface BaseComment extends BaseEntity {
  postId: number;
  author: string;
  content: string;
  likes: number;
}

// API 관련 공통 타입들
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} 