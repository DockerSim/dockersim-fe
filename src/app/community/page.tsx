'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import Link from 'next/link'
import '../../styles/Community.css'

// 1. 백엔드 PostResponse DTO에 맞춰 타입 정의 수정
interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  type: 'QUESTION' | 'SIMULATION' | 'TECHNICAL'; // 백엔드 Enum 타입
  createdAt: string;
  likesCount: number;
  views: number;
  tags: string; // 백엔드는 쉼표로 구분된 문자열로 전달
}

// PostType을 백엔드 Enum과 일치시킴
type PostType = 'QUESTION' | 'SIMULATION' | 'TECHNICAL';

const POST_TYPE_LABELS: Record<PostType, string> = {
  QUESTION: '질문',
  SIMULATION: '시뮬레이션',
  TECHNICAL: '기술' // 새로운 타입 추가
} as const

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]); // 2. 더미 데이터 대신 API 데이터를 저장할 state
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  // 3. 백엔드 API 호출 로직
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('keyword', searchTerm);
        if (selectedType !== 'all') params.append('type', selectedType);
        
        const response = await fetch(`/api/posts?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const result = await response.json();
        setPosts(result.data || []);
      } catch (error) {
        console.error("게시글 로딩 실패:", error);
        // 사용자에게 에러 메시지를 보여주는 로직 추가 가능
      } finally {
        setIsLoading(false);
      }
    };

    // 디바운싱 적용: 사용자가 입력을 멈춘 후 300ms 뒤에 API 호출
    const handler = setTimeout(() => {
        fetchPosts();
    }, 300);

    return () => {
        clearTimeout(handler);
    };
  }, [selectedType, searchTerm]); // 필터링 조건 변경 시 API 재호출


  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }, [])

  // 4. API로 받아온 posts를 기준으로 정렬 로직 수행
  const sortedPosts = useMemo(() => {
    const sortablePosts = [...posts];
    sortablePosts.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likesCount - a.likesCount; // likes -> likesCount
        case 'latest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return sortablePosts;
  }, [posts, sortBy]);

  return (
    <div className="community-page">
      <div className="community-container">
        <div className="community-sidebar">
          <div>
            <h2 className="sidebar-title">게시판</h2>
            <div className="category-selector">
              <div className="category-button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                <span>{selectedType === 'all' ? '전체' : POST_TYPE_LABELS[selectedType]}</span>
                <span>{showCategoryDropdown ? '▲' : '▼'}</span>
              </div>
              {showCategoryDropdown && (
                <div className="category-dropdown">
                  <div className={`category-item ${selectedType === 'all' ? 'active' : ''}`} onClick={() => { setSelectedType('all'); setShowCategoryDropdown(false); }}>전체</div>
                  <div className={`category-item ${selectedType === 'QUESTION' ? 'active' : ''}`} onClick={() => { setSelectedType('QUESTION'); setShowCategoryDropdown(false); }}>질문</div>
                  <div className={`category-item ${selectedType === 'SIMULATION' ? 'active' : ''}`} onClick={() => { setSelectedType('SIMULATION'); setShowCategoryDropdown(false); }}>시뮬레이션</div>
                  <div className={`category-item ${selectedType === 'TECHNICAL' ? 'active' : ''}`} onClick={() => { setSelectedType('TECHNICAL'); setShowCategoryDropdown(false); }}>기술</div>
                </div>
              )}
            </div>
          </div>
          <div className="community-info">
            <p className="info-title">커뮤니티 이용 안내</p>
            <p className="info-text">• <strong>질문</strong>: Docker 사용 중 발생한 문제나 궁금한 점을 자유롭게 질문해보세요.</p>
            <p className="info-text">• <strong>시뮬레이션</strong>: Docker 실습 경험이나 시뮬레이션 결과를 공유해보세요.</p>
            <p className="info-text">• <strong>기술</strong>: 유용한 Docker 관련 기술 팁을 공유해주세요.</p>
          </div>
        </div>
        
        <div className="community-main">
          <div className="community-header">
            <div className="header-top">
              <div>
                <h1 className="page-title">Docker 커뮤니티</h1>
                <p className="page-description">질문과 시뮬레이션을 공유하는 공간입니다</p>
              </div>
              <Link href="/community/write" className="write-button">
                <span>✏️</span>
                <span>글 작성하기</span>
              </Link>
            </div>
            <div className="search-section">
              <div className="search-container">
                <input type="text" placeholder="제목, 내용, 태그로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="sort-select">
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                </select>
              </div>
            </div>
          </div>

          <div className="posts-list">
            {isLoading ? (
              <div className="loading-state"><span>Loading...</span></div>
            ) : sortedPosts.length > 0 ? (
              sortedPosts.map((post) => (
                <Link key={post.id} href={`/community/${post.id}`} className="post-link">
                  <div className="post-card">
                    <div className="post-header">
                      <div className="post-meta">
                        <span className={`post-type ${post.type.toLowerCase()}`}>{POST_TYPE_LABELS[post.type]}</span>
                        <span className="post-date">{formatDate(post.createdAt)}</span>
                      </div>
                      <div className="post-stats">
                        <span className="stat-item">👍 {post.likesCount}</span>
                        <span className="stat-item">👀 {post.views}</span>
                      </div>
                    </div>
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-content">{post.content}</p>
                    <div className="post-footer">
                      <div className="post-tags">
                        {post.tags && post.tags.split(',').map((tag, index) => (
                          <span key={index} className="tag">#{tag.trim()}</span>
                        ))}
                      </div>
                      <span className="post-author">작성자: {post.author}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                <p>게시글이 없습니다.</p>
                <p>다른 검색어나 카테고리를 시도해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}