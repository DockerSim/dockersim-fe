'use client';

import React from 'react';
import { Post, PostType } from '../types';

export interface PostListPresentationProps {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  
  // 필터 상태
  selectedType: PostType | 'all';
  searchTerm: string;
  sortBy: 'latest' | 'popular';
  
  // 이벤트 핸들러
  onPostDelete: (id: number) => void;
  onTypeFilter: (type: PostType | 'all') => void;
  onSearch: (term: string) => void;
  onSort: (sortOption: 'latest' | 'popular') => void;
  onRefresh: () => void;
  onResetFilters: () => void;
}

/**
 * PostListPresentation - 게시글 목록 UI를 담당하는 Presentation 컴포넌트
 * Container/Presentational Pattern 적용
 */
export const PostListPresentation: React.FC<PostListPresentationProps> = ({
  posts,
  isLoading,
  error,
  selectedType,
  searchTerm,
  sortBy,
  onPostDelete,
  onTypeFilter,
  onSearch,
  onSort,
  onRefresh,
  onResetFilters,
}) => {
  const typeLabels: Record<PostType | 'all', string> = {
    all: '전체',
    question: '질문',
    share: '공유',
    discussion: '토론',
    notice: '공지',
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getTypeColor = (type: PostType) => {
    const colors = {
      question: '#3b82f6',
      share: '#10b981',
      discussion: '#8b5cf6',
      notice: '#f59e0b',
    };
    return colors[type];
  };

  return (
    <div className="post-list-container">
      {/* 헤더 */}
      <div className="header">
        <div className="title-section">
          <h1>🗂️ 게시판</h1>
          <p>Docker 관련 질문, 정보 공유, 토론을 위한 공간입니다</p>
        </div>
        <button className="refresh-button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? '🔄' : '새로고침'}
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div className="filters">
        <div className="filter-group">
          <div className="type-filters">
            {(Object.keys(typeLabels) as (PostType | 'all')[]).map(type => (
              <button
                key={type}
                className={`type-button ${selectedType === type ? 'active' : ''}`}
                onClick={() => onTypeFilter(type)}
              >
                {typeLabels[type]}
              </button>
            ))}
          </div>
          
          <div className="sort-buttons">
            <button
              className={`sort-button ${sortBy === 'latest' ? 'active' : ''}`}
              onClick={() => onSort('latest')}
            >
              최신순
            </button>
            <button
              className={`sort-button ${sortBy === 'popular' ? 'active' : ''}`}
              onClick={() => onSort('popular')}
            >
              인기순
            </button>
          </div>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="제목, 내용, 작성자로 검색..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="search-input"
          />
          <button onClick={onResetFilters} className="reset-button">
            초기화
          </button>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* 로딩 표시 */}
      {isLoading && (
        <div className="loading">
          <div className="loading-spinner">🔄</div>
          <p>게시글을 불러오는 중...</p>
        </div>
      )}

      {/* 게시글 목록 */}
      {!isLoading && !error && (
        <div className="posts-grid">
          {posts.length === 0 ? (
            <div className="no-posts">
              <p>📝 게시글이 없습니다.</p>
              <p>첫 번째 게시글을 작성해보세요!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <span
                    className="post-type"
                    style={{ backgroundColor: getTypeColor(post.type) }}
                  >
                    {typeLabels[post.type]}
                  </span>
                  <button
                    className="delete-button"
                    onClick={() => onPostDelete(post.id)}
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
                
                <h3 className="post-title">{post.title}</h3>
                <p className="post-content">{post.content.substring(0, 100)}...</p>
                
                <div className="post-meta">
                  <span className="author">✏️ {post.author}</span>
                  <span className="date">📅 {formatDate(post.createdAt)}</span>
                </div>
                
                <div className="post-stats">
                  <span className="views">👁️ {post.views}</span>
                  <span className={`likes ${post.isLiked ? 'liked' : ''}`}>
                    ❤️ {post.likes}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .post-list-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .title-section h1 {
          margin: 0;
          color: #1a202c;
          font-size: 2rem;
        }

        .title-section p {
          margin: 5px 0 0 0;
          color: #718096;
        }

        .refresh-button {
          background: #3182ce;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .refresh-button:hover:not(:disabled) {
          background: #2c5aa0;
        }

        .refresh-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .filters {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .filter-group {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .type-filters {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .type-button, .sort-button {
          padding: 8px 16px;
          border: 2px solid #e2e8f0;
          background: white;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .type-button.active, .sort-button.active {
          background: #3182ce;
          color: white;
          border-color: #3182ce;
        }

        .type-button:hover, .sort-button:hover {
          border-color: #3182ce;
        }

        .sort-buttons {
          display: flex;
          gap: 8px;
        }

        .search-section {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
        }

        .search-input:focus {
          outline: none;
          border-color: #3182ce;
        }

        .reset-button {
          padding: 12px 20px;
          background: #e2e8f0;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .reset-button:hover {
          background: #cbd5e0;
        }

        .error-message {
          background: #fed7d7;
          color: #c53030;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        .loading-spinner {
          font-size: 2rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .no-posts {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px;
          color: #718096;
        }

        .post-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .post-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .post-type {
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .delete-button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .delete-button:hover {
          opacity: 1;
        }

        .post-title {
          margin: 0 0 10px 0;
          color: #1a202c;
          font-size: 1.1rem;
          line-height: 1.4;
        }

        .post-content {
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 15px;
        }

        .post-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
          color: #718096;
        }

        .post-stats {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #718096;
        }

        .likes.liked {
          color: #e53e3e;
        }
      `}</style>
    </div>
  );
}; 