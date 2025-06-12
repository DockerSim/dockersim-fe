import React, { useState, useEffect } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  viewMode: 'local' | 'registry';
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ viewMode, onSearch, isLoading }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 디바운스된 쿼리로 검색 실행
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={viewMode === 'local' ? "로컬 이미지 검색..." : "Docker Hub 검색..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {isLoading && <div className={styles.loadingSpinner} />}
      </div>
    </div>
  );
} 