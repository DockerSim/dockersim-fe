'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { dummyPosts } from '@/domains/board/data';
import { PostType } from '@/domains/board/types';
import Header from '@/components/common/Header';

// 게시판 페이지 로드 확인용 로그
console.log('Board page loaded!');

const POST_TYPE_LABELS = {
  question: '질문',
  simulation: '시뮬레이션'
} as const;

const POST_TYPE_COLORS = {
  question: 'bg-blue-50 text-blue-700 border-blue-200',
  simulation: 'bg-green-50 text-green-700 border-green-200'
} as const;

export default function BoardPage() {
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  }, []);

  const filteredPosts = useMemo(() => {
    console.log('Filtering posts...', { selectedType, searchTerm, sortBy });
    let filtered = [...dummyPosts];

    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.type === selectedType);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes;
        case 'latest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [selectedType, searchTerm, sortBy]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 헤더 섹션 */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: '600', 
                color: '#333',
                margin: '0 0 0.5rem 0'
              }}>
                Docker 커뮤니티
              </h1>
              <p style={{ 
                color: '#666', 
                fontSize: '1rem',
                margin: 0
              }}>
                질문과 시뮬레이션을 공유하는 공간입니다
              </p>
            </div>
            <Link
              href="/board/write"
              style={{
                backgroundColor: '#228be6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
            >
              글 작성하기
            </Link>
          </div>

          {/* 필터 및 검색 */}
          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* 타입 필터 */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedType('all')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: selectedType === 'all' ? '#228be6' : '#e9ecef',
                    color: selectedType === 'all' ? 'white' : '#495057',
                    transition: 'all 0.2s'
                  }}
                >
                  전체
                </button>
                <button
                  onClick={() => setSelectedType('question')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: selectedType === 'question' ? '#228be6' : '#e9ecef',
                    color: selectedType === 'question' ? 'white' : '#495057',
                    transition: 'all 0.2s'
                  }}
                >
                  질문
                </button>
                <button
                  onClick={() => setSelectedType('simulation')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: selectedType === 'simulation' ? '#228be6' : '#e9ecef',
                    color: selectedType === 'simulation' ? 'white' : '#495057',
                    transition: 'all 0.2s'
                  }}
                >
                  시뮬레이션
                </button>
              </div>

              {/* 검색 및 정렬 */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="제목, 내용, 태그로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Link key={post.id} href={`/board/${post.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#228be6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#e9ecef';
                }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: '1px solid'
                      }}
                      className={POST_TYPE_COLORS[post.type]}
                      >
                        {POST_TYPE_LABELS[post.type]}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                        <span>❤️ {post.likes}</span>
                        <span>💬 {post.comments.length}</span>
                      </div>
                    </div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#333',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      {post.title}
                    </h2>
                  </div>

                  <p style={{
                    color: '#666',
                    fontSize: '1rem',
                    lineHeight: '1.5',
                    margin: '0 0 1rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {post.content.replace(/```[\s\S]*?```/g, '[코드]').substring(0, 150)}
                    {post.content.length > 150 ? '...' : ''}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#f1f3f4',
                            color: '#5f6368',
                            fontSize: '0.75rem',
                            borderRadius: '4px'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#f1f3f4',
                          color: '#5f6368',
                          fontSize: '0.75rem',
                          borderRadius: '4px'
                        }}>
                          +{post.tags.length - 3}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {post.author} · {formatDate(post.createdAt)}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div style={{
          marginTop: '2rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600', 
            color: '#333',
            margin: '0 0 1rem 0'
          }}>
            커뮤니티 현황
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#228be6' }}>
                {dummyPosts.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>전체 게시글</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#28a745' }}>
                {dummyPosts.filter(p => p.type === 'simulation').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>시뮬레이션</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fd7e14' }}>
                {dummyPosts.filter(p => p.type === 'question').length}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>질문</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6f42c1' }}>
                {dummyPosts.reduce((sum, post) => sum + post.comments.length, 0)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>총 댓글</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 