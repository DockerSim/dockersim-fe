'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { dummyPosts } from '@/domains/board/data';

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 상단 네비게이션 */}
        <div className="mb-6">
          <Link href="/board" className="text-blue-600 hover:text-blue-800 font-medium">
            ← 게시판으로 돌아가기
          </Link>
        </div>

        {/* 게시글 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${POST_TYPE_COLORS[post.type]}`}>
              {POST_TYPE_LABELS[post.type]}
            </span>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>👁️ {post.views}</span>
              <span>💬 {post.comments.length}</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium text-gray-900">{post.author}</p>
                <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isLiked ? '❤️' : '🤍'} {likes}
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                공유하기
              </button>
            </div>
          </div>
        </div>

        {/* 게시글 내용 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          {renderContent(post.content)}
        </div>

        {/* 태그 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">태그</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            댓글 {post.comments.length}개
          </h3>

          {/* 댓글 작성 */}
          <form onSubmit={handleCommentSubmit} className="mb-8">
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                댓글 등록
              </button>
            </div>
          </form>

          {/* 댓글 목록 */}
          <div className="space-y-6">
            {post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-blue-200 pl-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{comment.author}</span>
                      <span className="text-sm text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <button className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                      ❤️ {comment.likes}
                    </button>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 