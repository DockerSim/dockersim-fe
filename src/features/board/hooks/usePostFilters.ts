import { useState, useCallback, useMemo } from 'react';
import { Post, PostType } from '../types';

interface UsePostFiltersReturn {
  filteredPosts: Post[];
  selectedType: PostType | 'all';
  searchTerm: string;
  sortBy: 'latest' | 'popular';
  setSelectedType: (type: PostType | 'all') => void;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: 'latest' | 'popular') => void;
  resetFilters: () => void;
}

/**
 * usePostFilters - 게시글 필터링 및 정렬을 담당하는 커스텀 훅
 * 
 * 책임:
 * - 게시글 필터링 (타입, 검색어)
 * - 게시글 정렬 (최신순, 인기순)
 * - 필터 상태 관리
 */
export const usePostFilters = (posts: Post[]): UsePostFiltersReturn => {
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  /**
   * 필터링된 게시글 목록 계산
   */
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    // 타입별 필터링
    if (selectedType !== 'all') {
      filtered = filtered.filter(post => post.type === selectedType);
    }

    // 검색어 필터링
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(term) ||
        post.content.toLowerCase().includes(term) ||
        post.author.toLowerCase().includes(term)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // 인기순: 좋아요 + 조회수 조합
        const scoreA = a.likes * 2 + a.views;
        const scoreB = b.likes * 2 + b.views;
        return scoreB - scoreA;
      }
    });

    return filtered;
  }, [posts, selectedType, searchTerm, sortBy]);

  /**
   * 모든 필터 초기화
   */
  const resetFilters = useCallback(() => {
    setSelectedType('all');
    setSearchTerm('');
    setSortBy('latest');
  }, []);

  return {
    filteredPosts,
    selectedType,
    searchTerm,
    sortBy,
    setSelectedType,
    setSearchTerm,
    setSortBy,
    resetFilters,
  };
}; 