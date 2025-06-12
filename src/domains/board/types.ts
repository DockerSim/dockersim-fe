export type PostType = 'question' | 'simulation';

export interface Post {
  id: number;
  title: string;
  content: string;
  type: PostType;
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  tags: string[];
  comments: Comment[];
}

export interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface CreatePostData {
  title: string;
  content: string;
  type: PostType;
  tags: string[];
} 