import { PostType, BasePost, BaseComment } from '../../types/shared';

// 도메인 특화 Post 인터페이스
export interface Post extends BasePost {
  comments: Comment[];
}

// 도메인 특화 Comment 인터페이스  
export interface Comment extends BaseComment {}

// 게시글 생성 요청 타입
export interface CreatePostData {
  title: string;
  content: string;
  type: PostType;
  tags?: string[];
}

// 게시글 수정 요청 타입
export interface UpdatePostData extends Partial<CreatePostData> {
  id: number;
}

// 댓글 생성 요청 타입
export interface CreateCommentData {
  postId: number;
  content: string;
  author: string;
} 