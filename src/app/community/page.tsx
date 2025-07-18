'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import '../../styles/Community.css'

// 더미 데이터 타입 정의
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
}

// 더미 데이터
const dummyPosts: Post[] = [
  {
    id: 1,
    title: 'Docker 컨테이너 실행 오류 해결 방법',
    content: 'Docker 컨테이너를 실행할 때 "Cannot connect to the Docker daemon" 오류가 발생합니다. 어떻게 해결하나요?',
    author: 'docker_user',
    type: 'question',
    createdAt: '2024-01-15T10:30:00Z',
    likes: 5,
    views: 120,
    tags: ['docker', 'error', 'daemon']
  },
  {
    id: 2,
    title: 'Docker 시뮬레이션 실습 후기',
    content: 'Docker 시뮬레이션을 통해 컨테이너 관리를 실습해보았습니다. 너무 유용한 도구네요!',
    author: 'sim_lover',
    type: 'simulation',
    createdAt: '2024-01-14T15:45:00Z',
    likes: 8,
    views: 85,
    tags: ['simulation', 'practice', 'review']
  },
  {
    id: 3,
    title: 'Docker 볼륨 마운트 관련 질문',
    content: '컨테이너와 호스트 간 볼륨 마운트가 제대로 작동하지 않습니다. 설정을 어떻게 해야 하나요?',
    author: 'volume_user',
    type: 'question',
    createdAt: '2024-01-13T09:20:00Z',
    likes: 3,
    views: 67,
    tags: ['volume', 'mount', 'configuration']
  },
  {
    id: 4,
    title: 'Docker 네트워크 시뮬레이션 성공 사례',
    content: '여러 컨테이너 간 네트워크 통신 시뮬레이션을 성공적으로 완료했습니다. 과정을 공유합니다.',
    author: 'network_pro',
    type: 'simulation',
    createdAt: '2024-01-12T11:15:00Z',
    likes: 12,
    views: 156,
    tags: ['network', 'communication', 'success']
  },
  {
    id: 5,
    title: 'Docker Compose 설정 도움 요청',
    content: 'Docker Compose로 여러 서비스를 연동하려고 하는데 설정이 복잡합니다. 도움을 주세요.',
    author: 'compose_newbie',
    type: 'question',
    createdAt: '2024-01-11T14:30:00Z',
    likes: 7,
    views: 93,
    tags: ['compose', 'configuration', 'help']
  }
]

type PostType = 'question' | 'simulation'

const POST_TYPE_LABELS = {
  question: '질문',
  simulation: '시뮬레이션'
} as const

const POST_TYPE_COLORS = {
  question: 'bg-blue-50 text-blue-700 border-blue-200',
  simulation: 'bg-green-50 text-green-700 border-green-200'
} as const

export default function CommunityPage() {
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '오늘'
    } else if (diffDays === 1) {
      return '어제'
    } else if (diffDays < 7) {
      return `${diffDays}일 전`
    } else {
      return date.toLocaleDateString('ko-KR')
    }
  }, [])

  const filteredPosts = useMemo(() => {
    let filtered = [...dummyPosts]

    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.type === selectedType)
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes
        case 'latest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [selectedType, searchTerm, sortBy])

  return (
    <div className="community-page">
      <div className="community-container">
        {/* 왼쪽 사이드바 */}
        <div className="community-sidebar">
          <div>
            <h2 className="sidebar-title">게시판</h2>
            
            <div className="category-selector">
              <div 
                className="category-button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <span>
                  {selectedType === 'all' ? '전체' : 
                   selectedType === 'question' ? '질문' : '시뮬레이션'}
                </span>
                <span>{showCategoryDropdown ? '▲' : '▼'}</span>
              </div>
              
              {showCategoryDropdown && (
                <div className="category-dropdown">
                  <div
                    className={`category-item ${selectedType === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedType('all')
                      setShowCategoryDropdown(false)
                    }}
                  >
                    전체
                  </div>
                  <div
                    className={`category-item ${selectedType === 'question' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedType('question')
                      setShowCategoryDropdown(false)
                    }}
                  >
                    질문
                  </div>
                  <div
                    className={`category-item ${selectedType === 'simulation' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedType('simulation')
                      setShowCategoryDropdown(false)
                    }}
                  >
                    시뮬레이션
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="community-info">
            <p className="info-title">커뮤니티 이용 안내</p>
            <p className="info-text">• <strong>질문</strong>: Docker 사용 중 발생한 문제나 궁금한 점을 자유롭게 질문해보세요.</p>
            <p className="info-text">• <strong>시뮬레이션</strong>: Docker 실습 경험이나 시뮬레이션 결과를 공유해보세요.</p>
          </div>
        </div>
        
        {/* 오른쪽 메인 콘텐츠 */}
        <div className="community-main">
          {/* 헤더 섹션 */}
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

            {/* 검색 */}
            <div className="search-section">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="제목, 내용, 태그로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="sort-select"
                >
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                </select>
              </div>
            </div>
          </div>

          {/* 게시글 목록 */}
          <div className="posts-list">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Link key={post.id} href={`/community/${post.id}`} className="post-link">
                  <div className="post-card">
                    <div className="post-header">
                      <div className="post-meta">
                        <span className={`post-type ${post.type}`}>
                          {POST_TYPE_LABELS[post.type]}
                        </span>
                        <span className="post-date">{formatDate(post.createdAt)}</span>
                      </div>
                      <div className="post-stats">
                        <span className="stat-item">👍 {post.likes}</span>
                        <span className="stat-item">👀 {post.views}</span>
                      </div>
                    </div>
                    
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-content">{post.content}</p>
                    
                    <div className="post-footer">
                      <div className="post-tags">
                        {post.tags.map((tag, index) => (
                          <span key={index} className="tag">#{tag}</span>
                        ))}
                      </div>
                      <span className="post-author">작성자: {post.author}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                <p>검색 결과가 없습니다.</p>
                <p>다른 검색어나 카테고리를 시도해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 