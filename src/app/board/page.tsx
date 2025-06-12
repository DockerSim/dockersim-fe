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
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header />
      
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        gap: '2rem',
        padding: '2rem'
      }}>
        {/* 왼쪽 사이드바 - 고정 */}
        <div style={{ 
          width: '250px',
          position: 'sticky',
          top: '2rem',
          alignSelf: 'flex-start',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          padding: '1.5rem'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#333',
              marginBottom: '1rem'
            }}>
              게시판
            </h2>
            
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <div 
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <span>
                  {selectedType === 'all' ? '전체' : 
                   selectedType === 'question' ? '질문' : '시뮬레이션'}
                </span>
                <span>{showCategoryDropdown ? '▲' : '▼'}</span>
              </div>
              
              {showCategoryDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  marginTop: '0.25rem',
                  zIndex: 10,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: selectedType === 'all' ? '#f1f3f5' : 'white',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px',
                      fontWeight: selectedType === 'all' ? '500' : 'normal'
                    }}
                    onClick={() => {
                      setSelectedType('all');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    전체
                  </div>
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: selectedType === 'question' ? '#f1f3f5' : 'white',
                      fontWeight: selectedType === 'question' ? '500' : 'normal'
                    }}
                    onClick={() => {
                      setSelectedType('question');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    질문
                  </div>
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      backgroundColor: selectedType === 'simulation' ? '#f1f3f5' : 'white',
                      borderBottomLeftRadius: '8px',
                      borderBottomRightRadius: '8px',
                      fontWeight: selectedType === 'simulation' ? '500' : 'normal'
                    }}
                    onClick={() => {
                      setSelectedType('simulation');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    시뮬레이션
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ 
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#495057',
              lineHeight: '1.5'
            }}>
              <p style={{ margin: '0 0 0.75rem 0', fontWeight: '500' }}>커뮤니티 이용 안내</p>
              <p style={{ margin: '0 0 0.5rem 0' }}>• <strong>질문</strong>: Docker 사용 중 발생한 문제나 궁금한 점을 자유롭게 질문해보세요.</p>
              <p style={{ margin: '0' }}>• <strong>시뮬레이션</strong>: Docker 실습 경험이나 시뮬레이션 결과를 공유해보세요.</p>
            </div>
          </div>
        </div>
        
        {/* 오른쪽 메인 콘텐츠 - 스크롤 가능 */}
        <div style={{ flex: 1 }}>
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
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>✏️</span>
                <span>글 작성하기</span>
              </Link>
            </div>

            {/* 검색 */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              marginBottom: '1.5rem'
            }}>
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
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
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

          {/* 게시글 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Link key={post.id} href={`/board/${post.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #e9ecef',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.borderColor = '#228be6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.03)';
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
                borderRadius: '12px'
              }}>
                <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}