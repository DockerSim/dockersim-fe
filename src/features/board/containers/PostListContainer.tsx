'use client';

import React from 'react';
import { PostListPresentation } from '../components/PostList';
import { usePosts } from '../hooks/usePosts';
import { usePostFilters } from '../hooks/usePostFilters';
import { PostType } from '../types';

/**
 * PostListContainer - 게시글 목록의 비즈니스 로직을 관리하는 Container 컴포넌트
 * 
 * 책임:
 * - 게시글 데이터 로딩 및 관리
 * - 필터링 및 정렬 로직
 * - 페이지네이션 처리
 * - 사용자 액션 이벤트 처리
 */
export const PostListContainer: React.FC = () => {
  // 게시글 관련 로직
  const {
    posts,
    isLoading,
    error,
    refreshPosts,
    deletePost,
  } = usePosts();

  // 필터링 및 정렬 로직
  const {
    filteredPosts,
    selectedType,
    searchTerm,
    sortBy,
    setSelectedType,
    setSearchTerm,
    setSortBy,
    resetFilters,
  } = usePostFilters(posts);

  // 이벤트 핸들러들
  const handlePostDelete = async (id: number) => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      await deletePost(id);
    }
  };

  const handleTypeFilter = (type: PostType | 'all') => {
    setSelectedType(type);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSort = (sortOption: 'latest' | 'popular') => {
    setSortBy(sortOption);
  };

  // Presentation 컴포넌트에 전달할 props
  const presentationProps = {
    posts: filteredPosts,
    isLoading,
    error,
    
    // 필터 상태
    selectedType,
    searchTerm,
    sortBy,
    
    // 이벤트 핸들러
    onPostDelete: handlePostDelete,
    onTypeFilter: handleTypeFilter,
    onSearch: handleSearch,
    onSort: handleSort,
    onRefresh: refreshPosts,
    onResetFilters: resetFilters,
  };

  return <PostListPresentation {...presentationProps} />;
}; 