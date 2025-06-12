import React, { useState, useRef, useCallback } from 'react';
import { useDockerStore } from '../store/dockerStore';
import type { ImageInfo, LocalImage } from '../store/dockerStore';
import styles from './ImageList.module.css';
import detailStyles from './DockerMasterDetail.module.css';
import { SearchBar } from './SearchBar';

export function ImageList() {
  const viewMode = useDockerStore(state => state.viewMode);
  const localImages = useDockerStore(state => state.localImages);
  const remoteResults = useDockerStore(state => state.remoteResults);
  const selectedImage = useDockerStore(state => state.selectedImage);
  const setSelectedImage = useDockerStore(state => state.setSelectedImage);
  const searchImages = useDockerStore(state => state.searchImages);
  const isLoading = useDockerStore(state => state.isLoading);
  const hasMore = useDockerStore(state => state.hasMore);
  const currentPage = useDockerStore(state => state.currentPage);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredImages, setFilteredImages] = useState<ImageInfo[]>([]);
  
  const observer = useRef<IntersectionObserver>();
  const lastImageElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) {
          searchImages(searchQuery, currentPage + 1);
        }
      },
      { rootMargin: '100px' }
    );
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, searchQuery, currentPage, searchImages]);

  // 이미지 상태 확인 함수
  const getImageStatus = (repo: string, tag: string): 'pulled' | 'missing' => {
    const foundImage = localImages.find(img => img.repo === repo && img.tag === tag);
    return foundImage?.status || 'missing';
  };

  // 검색 처리
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (viewMode === 'registry') {
      searchImages(query, 1); // 페이지 초기화하여 검색
    }
  }, [viewMode, searchImages]);

  // 이미지 필터링
  React.useEffect(() => {
    let filtered: ImageInfo[] = [];
    
    if (viewMode === 'local') {
      // 로컬 탭: pulled 상태인 이미지만 표시
      filtered = localImages.filter(image => image.status === 'pulled');
    } else {
      // 원격 탭: 전체 레지스트리 이미지
      filtered = remoteResults;
    }
    
    // 검색어 필터링
    if (searchQuery) {
      filtered = filtered.filter(image => 
        `${image.repo}:${image.tag}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredImages(filtered);
  }, [localImages, remoteResults, searchQuery, viewMode]);

  return (
    <div className={`${styles.container} ${detailStyles.imageListContainer}`}>
      <SearchBar
        viewMode={viewMode}
        onSearch={handleSearch}
        isLoading={isLoading}
      />
      
      <div className={styles.list}>
        {filteredImages.map((image, index) => {
          const isLastElement = index === filteredImages.length - 1;
          // 원격 탭에서 이미지의 로컬 상태 확인
          const localStatus = viewMode === 'registry' ? getImageStatus(image.repo, image.tag) : undefined;
          
          return (
            <div
              key={`${image.repo}:${image.tag}`}
              ref={isLastElement && viewMode === 'registry' ? lastImageElementRef : null}
              className={`${styles.item} ${
                selectedImage && 
                selectedImage.repo === image.repo && 
                selectedImage.tag === image.tag 
                  ? styles.active 
                  : ''
              }`}
              onClick={() => setSelectedImage(image)}
            >
              <div className={styles.imageInfo}>
                <span className={styles.name}>{image.repo}:{image.tag}</span>
                {viewMode === 'local' && (
                  <span className={styles.status}>
                    <span className={styles.statusPulled}>●</span>
                  </span>
                )}
                {viewMode === 'registry' && (
                  <span className={styles.status}>
                    {localStatus === 'pulled' ? (
                      <span className={styles.statusPulled} title="다운로드됨">●</span>
                    ) : (
                      <span className={styles.statusMissing} title="다운로드 필요">○</span>
                    )}
                  </span>
                )}
              </div>
              <div className={styles.meta}>
                <span>{image.size}</span>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <div className={styles.spinner} />
            <span>이미지 로딩 중...</span>
          </div>
        )}
        
        {!isLoading && filteredImages.length === 0 && (
          <div className={styles.emptyState}>
            <p>검색 결과가 없습니다</p>
            {searchQuery && <p>다른 검색어로 시도해보세요</p>}
          </div>
        )}
      </div>
    </div>
  );
} 