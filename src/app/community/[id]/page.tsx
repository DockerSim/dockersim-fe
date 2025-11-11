'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import '../../../styles/PostDetail.css'
import { communityApi, PostResponse, PostCommentResponse } from '@/api/community'; // communityApi 임포트

// PostType은 community/page.tsx에서 export 했으므로 재사용
import { PostType } from '@/app/community/page';

const POST_TYPE_LABELS: Record<PostType, string> = {
  QUESTION: '질문',
  SIMULATION: '시뮬레이션',
  TECHNICAL: '기술'
} as const

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = parseInt(params.id as string); // postId를 숫자로 파싱
  
  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<PostCommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false); // TODO: 실제 좋아요 상태를 백엔드에서 가져와야 함

  const [editingComment, setEditingComment] = useState<{ id: number; content: string } | null>(null);

  const fetchPostAndComments = useCallback(async () => {
    if (isNaN(postId)) { // postId가 유효한 숫자인지 확인
      setError('유효하지 않은 게시글 ID입니다.');
      setIsLoading(false);
      return;
    }
    if (!editingComment) {
        setIsLoading(true);
    }
    setError(null);
    try {
      const [postResult, commentsResult] = await Promise.all([
        communityApi.getPost(postId),
        communityApi.getCommentsByPostId(postId)
      ]);

      if (postResult.code === 'SUCCESS') {
        setPost(postResult.data);
      } else {
        throw new Error(postResult.message || '게시글을 불러오는데 실패했습니다.');
      }

      if (commentsResult.code === 'SUCCESS') {
        setComments(commentsResult.data || []);
      } else {
        throw new Error(commentsResult.message || '댓글을 불러오는데 실패했습니다.');
      }

      // TODO: 사용자의 좋아요 여부도 백엔드에서 가져와 설정해야 함
      // setIsLiked(postResult.data.isLikedByUser);

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
    if (!newComment.trim() || isNaN(postId)) return;
    try {
      const result = await communityApi.createComment(postId, { content: newComment });
      if (result.code === 'SUCCESS') {
        setNewComment('');
        fetchPostAndComments();
      } else {
        throw new Error(result.message || '댓글 작성에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleLike = async () => {
    if (isNaN(postId)) return;
    try {
      const result = await communityApi.toggleLike(postId);
      if (result.code === 'SUCCESS') {
        // 좋아요 상태 토글 및 게시글 데이터 새로고침
        setIsLiked(prev => !prev);
        fetchPostAndComments(); // 좋아요 수 업데이트를 위해 다시 불러옴
      } else {
        throw new Error(result.message || '좋아요 처리에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const handlePostDelete = async () => {
    if (isNaN(postId) || !confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    try {
      const result = await communityApi.deletePost(postId);
      if (result.code === 'SUCCESS') {
        alert('게시글이 삭제되었습니다.');
        router.push('/community');
      } else {
        throw new Error(result.message || '게시글 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (isNaN(postId) || !confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
    try {
      const result = await communityApi.deleteComment(postId, commentId);
      if (result.code === 'SUCCESS') {
        alert('댓글이 삭제되었습니다.');
        fetchPostAndComments();
      } else {
        throw new Error(result.message || '댓글 삭제에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleCommentUpdate = async (commentId: number) => {
    if (isNaN(postId) || !editingComment || editingComment.id !== commentId) return;
    try {
      const result = await communityApi.updateComment(postId, commentId, { content: editingComment.content });
      if (result.code === 'SUCCESS') {
        setEditingComment(null);
        fetchPostAndComments();
      } else {
        throw new Error(result.message || '댓글 수정에 실패했습니다.');
      }
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
                  <>
                    <div className="comment-header">
                      <div className="comment-author">{comment.author}</div>
                      <div className="comment-date">{formatDate(comment.createdAt)}</div>
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
