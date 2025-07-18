'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import '../../../styles/PostDetail.css'

interface Comment {
  id: number
  content: string
  author: string
  createdAt: string
  likes: number
}

interface Post {
  id: number
  title: string
  content: string
  author: string
  type: 'question' | 'simulation'
  createdAt: string
  likes: number
  views: number
  tags: string[]
  comments: Comment[]
}

// 더미 데이터 (실제로는 API에서 가져옴)
const dummyPost: Post = {
  id: 1,
  title: 'Docker 컨테이너 실행 오류 해결 방법',
  content: `Docker 컨테이너를 실행할 때 "Cannot connect to the Docker daemon" 오류가 발생합니다. 
  
어제까지 잘 동작하던 Docker가 갑자기 이런 오류를 발생시키고 있습니다.

시도해본 방법:
1. Docker Desktop 재시작
2. 컴퓨터 재부팅
3. Docker 재설치

하지만 여전히 같은 오류가 발생합니다. 어떻게 해결할 수 있을까요?

환경:
- OS: Windows 11
- Docker Desktop: 4.25.0
- WSL2 사용

도움을 주시면 감사하겠습니다.`,
  author: 'docker_user',
  type: 'question',
  createdAt: '2024-01-15T10:30:00Z',
  likes: 5,
  views: 120,
  tags: ['docker', 'error', 'daemon'],
  comments: [
    {
      id: 1,
      content: '저도 같은 문제를 겪었는데, WSL2를 업데이트하고 Docker Desktop을 관리자 권한으로 실행하니 해결됐습니다.',
      author: 'helper1',
      createdAt: '2024-01-15T11:00:00Z',
      likes: 3
    },
    {
      id: 2,
      content: '혹시 Windows 서비스에서 Docker Desktop Service가 실행되고 있는지 확인해보세요. 서비스가 중지되어 있을 수 있습니다.',
      author: 'docker_expert',
      createdAt: '2024-01-15T11:30:00Z',
      likes: 7
    }
  ]
}

const POST_TYPE_LABELS = {
  question: '질문',
  simulation: '시뮬레이션'
} as const

export default function PostDetailPage() {
  const params = useParams()
  const postId = params.id as string
  
  const [post] = useState<Post>(dummyPost)
  const [newComment, setNewComment] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [currentLikes, setCurrentLikes] = useState(post.likes)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleLike = () => {
    if (isLiked) {
      setCurrentLikes(currentLikes - 1)
    } else {
      setCurrentLikes(currentLikes + 1)
    }
    setIsLiked(!isLiked)
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      // 실제로는 API 호출
      console.log('New comment:', newComment)
      setNewComment('')
    }
  }

  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        {/* 뒤로 가기 버튼 */}
        <div className="back-navigation">
          <Link href="/community" className="back-button">
            ← 목록으로 돌아가기
          </Link>
        </div>

        {/* 게시글 내용 */}
        <article className="post-detail-card">
          <header className="post-detail-header">
            <div className="post-detail-meta">
              <span className={`post-type ${post.type}`}>
                {POST_TYPE_LABELS[post.type]}
              </span>
              <span className="post-date">{formatDate(post.createdAt)}</span>
            </div>
            <h1 className="post-detail-title">{post.title}</h1>
            <div className="post-detail-info">
              <span className="post-author">작성자: {post.author}</span>
              <div className="post-stats">
                <span className="stat-item">👀 {post.views}</span>
                <span className="stat-item">💬 {post.comments.length}</span>
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
              {post.tags.map((tag, index) => (
                <span key={index} className="tag">#{tag}</span>
              ))}
            </div>
          </div>

          <footer className="post-detail-footer">
            <button 
              className={`like-button ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              👍 {currentLikes}
            </button>
          </footer>
        </article>

        {/* 댓글 섹션 */}
        <section className="comments-section">
          <h2 className="comments-title">댓글 ({post.comments.length})</h2>
          
          {/* 댓글 작성 폼 */}
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 작성해보세요..."
              className="comment-input"
              rows={3}
            />
            <button type="submit" className="comment-submit-button">
              댓글 작성
            </button>
          </form>

          {/* 댓글 목록 */}
          <div className="comments-list">
            {post.comments.map(comment => (
              <div key={comment.id} className="comment-card">
                <div className="comment-header">
                  <div className="comment-author">{comment.author}</div>
                  <div className="comment-date">{formatDate(comment.createdAt)}</div>
                </div>
                <div className="comment-content">{comment.content}</div>
                <div className="comment-actions">
                  <button className="comment-like-button">
                    👍 {comment.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
} 