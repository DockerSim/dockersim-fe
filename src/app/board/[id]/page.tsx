'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { dummyPosts } from '@/domains/board/data';
import Header from '@/components/common/Header';

const POST_TYPE_LABELS = {
  question: '질문',
  simulation: '시뮬레이션'
} as const;

const POST_TYPE_COLORS = {
  question: 'bg-blue-100 text-blue-800',
  simulation: 'bg-green-100 text-green-800'
} as const;

export default function PostDetailPage() {
  const params = useParams();
  const postId = parseInt(params.id as string);
  const post = dummyPosts.find(p => p.id === postId);

  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post?.likes || 0);
  const [newComment, setNewComment] = useState('');

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">게시글을 찾을 수 없습니다</h1>
          <Link href="/board" className="text-blue-600 hover:text-blue-800">
            게시판으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      // 실제로는 API 호출을 통해 댓글을 저장
      console.log('새 댓글:', newComment);
      setNewComment('');
      alert('댓글이 등록되었습니다!');
    }
  };

  const renderContent = (content: string) => {
    // 간단한 마크다운 렌더링 (실제로는 마크다운 라이브러리 사용 권장)
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let language = '';

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // 코드 블록 종료
          elements.push(
            <div key={`code-${index}`} className="my-4">
              <div className="bg-gray-800 text-gray-200 rounded-t-lg px-4 py-2 text-sm font-mono">
                {language || 'code'}
              </div>
              <pre className="bg-gray-900 text-gray-200 p-4 rounded-b-lg overflow-x-auto">
                <code>{codeLines.join('\n')}</code>
              </pre>
            </div>
          );
          codeLines = [];
          inCodeBlock = false;
          language = '';
        } else {
          // 코드 블록 시작
          language = line.substring(3);
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        codeLines.push(line);
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={index} className="ml-4 mb-1">
            {line.substring(2)}
          </li>
        );
      } else if (line.match(/^\d+\. /)) {
        const match = line.match(/^(\d+)\. (.*)$/);
        if (match) {
          elements.push(
            <li key={index} className="ml-4 mb-1 list-decimal">
              {match[2]}
            </li>
          );
        }
      } else if (line.includes('`') && !line.startsWith('```')) {
        // 인라인 코드
        const parts = line.split('`');
        const rendered = parts.map((part, i) => 
          i % 2 === 1 ? (
            <code key={i} className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
              {part}
            </code>
          ) : part
        );
        elements.push(
          <p key={index} className="mb-3 leading-relaxed">
            {rendered}
          </p>
        );
      } else if (line.trim()) {
        elements.push(
          <p key={index} className="mb-3 leading-relaxed">
            {line}
          </p>
        );
      } else {
        elements.push(<br key={index} />);
      }
    });

    return <div className="prose max-w-none">{elements}</div>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header />
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {/* 상단 네비게이션 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link 
            href="/board" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#228be6',
              fontWeight: '500',
              textDecoration: 'none'
            }}
          >
            <span>←</span>
            <span>게시판으로 돌아가기</span>
          </Link>
        </div>

        {/* 게시글 헤더 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{
              padding: '0.35rem 1rem',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
            className={POST_TYPE_COLORS[post.type]}
            >
              {POST_TYPE_LABELS[post.type]}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
              <span>👁️ {post.views}</span>
              <span>💬 {post.comments.length}</span>
            </div>
          </div>

          <h1 style={{ 
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#333',
            marginBottom: '1.5rem',
            lineHeight: '1.4'
          }}>
            {post.title}
          </h1>

          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #eee',
            paddingTop: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#e9ecef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#495057',
                fontWeight: '600',
                fontSize: '1.25rem'
              }}>
                {post.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '500', color: '#333' }}>{post.author}</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6c757d' }}>{formatDate(post.createdAt)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={handleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: isLiked ? '#ffe3e3' : '#f1f3f5',
                  color: isLiked ? '#e03131' : '#495057'
                }}
              >
                {isLiked ? '❤️' : '🤍'} {likes}
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: '#f1f3f5',
                  color: '#495057'
                }}
              >
                공유하기
              </button>
            </div>
          </div>
        </div>

        {/* 게시글 내용 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          {renderContent(post.content)}
        </div>

        {/* 태그 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1rem' }}>태그</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '0.35rem 0.75rem',
                  backgroundColor: '#e7f5ff',
                  color: '#1971c2',
                  fontSize: '0.875rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#333', marginBottom: '1.5rem' }}>
            댓글 {post.comments.length}개
          </h3>

          {/* 댓글 작성 */}
          <form onSubmit={handleCommentSubmit} style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  fontSize: '1rem',
                  resize: 'none'
                }}
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={!newComment.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#228be6',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '500',
                  cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                  opacity: newComment.trim() ? 1 : 0.7
                }}
              >
                댓글 등록
              </button>
            </div>
          </form>

          {/* 댓글 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} style={{ 
                  borderLeft: '4px solid #dee2e6',
                  paddingLeft: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#495057',
                        fontWeight: '600'
                      }}>
                        {comment.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span style={{ fontWeight: '500', color: '#333' }}>{comment.author}</span>
                        <span style={{ fontSize: '0.875rem', color: '#6c757d', marginLeft: '0.5rem' }}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p style={{ margin: 0, lineHeight: '1.5', color: '#495057' }}>{comment.content}</p>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center',
                padding: '2rem 0',
                color: '#6c757d'
              }}>
                아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}