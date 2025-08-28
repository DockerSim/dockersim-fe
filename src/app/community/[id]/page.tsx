'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import '../../../styles/PostDetail.css'

// 백엔드 DTO에 맞춘 타입 정의
interface Comment {
  id: number;
  content: string;
  author: string;
  createdAt: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  type: 'QUESTION' | 'SIMULATION' | 'TECHNICAL';
  createdAt: string;
  likesCount: number;
  views: number;
  tags: string;
}

const POST_TYPE_LABELS: Record<Post['type'], string> = {
  QUESTION: '질문',
  SIMULATION: '시뮬레이션',
  TECHNICAL: '기술'
} as const

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // 댓글 수정을 위한 상태 추가
  const [editingComment, setEditingComment] = useState<{ id: number; content: string } | null>(null);

  const fetchPostAndComments = useCallback(async () => {
    if (!postId) return;
    if (!editingComment) {
        setIsLoading(true);
    }
    setError(null);
    try {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/${postId}`),
        fetch(`/api/posts/${postId}/comments`)
      ]);

      if (!postRes.ok) throw new Error('게시글을 불러오는데 실패했습니다.');
      if (!commentsRes.ok) throw new Error('댓글을 불러오는데 실패했습니다.');

      const postResult = await postRes.json();
      const commentsResult = await commentsRes.json();

      setPost(postResult.data);
      setComments(commentsResult.data || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [postId, editingComment]);

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      if (!response.ok) throw new Error('댓글 작성에 실패했습니다.');
      setNewComment('');
      fetchPostAndComments();
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleLike = async () => {
    if (!postId) return;
    try {
      const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (!response.ok) throw new Error('좋아요 처리에 실패했습니다.');
      const postRes = await fetch(`/api/posts/${postId}`);
      const postResult = await postRes.json();
      setPost(postResult.data);
      setIsLiked(!isLiked);
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  // 게시글 삭제 핸들러
  const handlePostDelete = async () => {
    if (!postId || !confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('게시글 삭제에 실패했습니다.');
      alert('게시글이 삭제되었습니다.');
      router.push('/community');
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  // 댓글 삭제 핸들러
  const handleCommentDelete = async (commentId: number) => {
    if (!postId || !confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('댓글 삭제에 실패했습니다.');
      alert('댓글이 삭제되었습니다.');
      fetchPostAndComments(); // 댓글 목록 새로고침
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  // 댓글 수정 핸들러 추가
  const handleCommentUpdate = async (commentId: number) => {
    if (!postId || !editingComment || editingComment.id !== commentId) return;
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingComment.content }),
      });
      if (!response.ok) throw new Error('댓글 수정에 실패했습니다.');
      setEditingComment(null);
      fetchPostAndComments();
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  if (isLoading) return <div className="post-detail-page"><div className="loading-state">Loading...</div></div>;
  if (error) return <div className="post-detail-page"><div className="error-state">{error}</div></div>;
  if (!post) return <div className="post-detail-page"><div className="empty-state">게시글을 찾을 수 없습니다.</div></div>;

  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        <div className="back-navigation">
          <Link href="/community" className="back-button">← 목록으로 돌아가기</Link>
        </div>

        <article className="post-detail-card">
          <header className="post-detail-header">
            <div className="post-detail-meta">
              <span className={`post-type ${post.type.toLowerCase()}`}>{POST_TYPE_LABELS[post.type]}</span>
              <span className="post-date">{formatDate(post.createdAt)}</span>
            </div>
            <div className="post-title-wrapper">
              <h1 className="post-detail-title">{post.title}</h1>
              {/* 게시글 수정/삭제 버튼 */}
              <div className="post-actions">
                <Link href={`/community/${postId}/edit`} className="action-btn edit-btn">✏️ 수정</Link>
                <button onClick={handlePostDelete} className="action-btn delete-btn">🗑️ 삭제</button>
              </div>
            </div>
            <div className="post-detail-info">
              <span className="post-author">작성자: {post.author}</span>
              <div className="post-stats">
                <span className="stat-item">👀 {post.views}</span>
                <span className="stat-item">💬 {comments.length}</span>
              </div>
            </div>
          </header>

          <div className="post-detail-content">
            <div className="post-content-text">
              {post.content.split('\n').map((line, index) => (
                <p key={index}>{line || '\u00A0'}</p>
              ))}
            </div>
            <div className="post-tags">
              {post.tags && post.tags.split(',').map((tag, index) => (
                <span key={index} className="tag">#{tag.trim()}</span>
              ))}
            </div>
          </div>

          <footer className="post-detail-footer">
            <button className={`like-button ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
              👍 {post.likesCount}
            </button>
          </footer>
        </article>

        <section className="comments-section">
          <h2 className="comments-title">댓글 ({comments.length})</h2>
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 작성해보세요..."
              className="comment-input"
              rows={3}
            />
            <button type="submit" className="comment-submit-button">댓글 작성</button>
          </form>

          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className="comment-card">
                {editingComment?.id === comment.id ? (
                  // 수정 모드
                  <div className="comment-edit-form">
                    <textarea
                      value={editingComment.content}
                      onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                      className="comment-edit-input"
                      rows={3}
                    />
                    <div className="comment-edit-actions">
                      <button onClick={() => handleCommentUpdate(comment.id)} className="action-btn-comment save-btn">저장</button>
                      <button onClick={() => setEditingComment(null)} className="action-btn-comment cancel-btn">취소</button>
                    </div>
                  </div>
                ) : (
                  // 일반 모드
                  <>
                    <div className="comment-header">
                      <div className="comment-author">{comment.author}</div>
                      <div className="comment-date">{formatDate(comment.createdAt)}</div>
                      {/* 댓글 수정/삭제 버튼 */}
                      <div className="comment-actions">
                        <button onClick={() => setEditingComment({ id: comment.id, content: comment.content })} className="action-btn-comment edit-btn-comment">✏️</button>
                        <button onClick={() => handleCommentDelete(comment.id)} className="action-btn-comment delete-btn-comment">🗑️</button>
                      </div>
                    </div>
                    <div className="comment-content">{comment.content}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}