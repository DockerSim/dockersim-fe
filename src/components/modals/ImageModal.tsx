'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useDockerStore, DockerImage } from '../../store/dockerStore';
import './ImageModal.css';

// Props 타입 정의
interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (image: string) => void;
  showSelectionButton?: boolean;
}

// 공식 이미지 API 응답을 위한 타입
interface OfficialDockerImage {
  imageId: string;
  name: string;
  namespace: string;
  description: string;
  pullCount: number;
  createdAt: string;
  logoUrl?: string;
  tag: string;
  starCount: number;
}

// --- 임시 더미 데이터 --- 
const dummyOfficialImages: OfficialDockerImage[] = [
  {
    imageId: 'official-nginx-1',
    name: 'nginx',
    namespace: 'library',
    description: 'Official build of Nginx. Nginx is an HTTP and reverse proxy server, a mail proxy server, and a generic TCP/UDP proxy server.',
    pullCount: 1000000000,
    createdAt: '2023-10-26T10:00:00Z',
    tag: 'latest',
    starCount: 18000,
  },
  {
    imageId: 'official-redis-1',
    name: 'redis',
    namespace: 'library',
    description: 'Redis is an in-memory data structure store, used as a database, cache, and message broker.',
    pullCount: 1000000000,
    createdAt: '2023-10-25T11:00:00Z',
    tag: 'latest',
    starCount: 12500,
  },
  {
    imageId: 'official-postgres-1',
    name: 'postgres',
    namespace: 'library',
    description: 'The PostgreSQL object-relational database system provides reliability and data integrity.',
    pullCount: 1000000000,
    createdAt: '2023-10-24T12:00:00Z',
    tag: 'latest',
    starCount: 11000,
  },
  {
    imageId: 'official-mysql-1',
    name: 'mysql',
    namespace: 'library',
    description: 'MySQL is a widely used, open-source relational database management system (RDBMS).',
    pullCount: 1000000000,
    createdAt: '2023-10-23T13:00:00Z',
    tag: 'latest',
    starCount: 13200,
  }
];

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, onSelect, showSelectionButton }) => {
  const { executeCommand, localImages, addMessage } = useDockerStore();
  
  const [activeTab, setActiveTab] = useState<'official' | 'local'>('official');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');
  
  const [officialImages, setOfficialImages] = useState<OfficialDockerImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sortOptions = [
    { value: 'popular', label: '인기순' },
    { value: 'recent', label: '최신순' },
    { value: 'name', label: '이름순' }
  ];

  // API 호출 대신 더미 데이터를 사용하도록 수정
  const loadOfficialImages = async () => {
    setIsLoading(true);
    setTimeout(() => {
        setOfficialImages(dummyOfficialImages);
        setIsLoading(false);
    }, 300); // 약간의 로딩 시간 시뮬레이션
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'official') {
        loadOfficialImages();
      }
    }
  }, [isOpen, activeTab]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownloadAndSelect = (image: OfficialDockerImage) => {
    const imageNameWithTag = `${image.namespace === 'library' ? image.name : `${image.namespace}/${image.name}`}:${image.tag}`;
    executeCommand(`docker pull ${imageNameWithTag}`);
    if (onSelect) {
        onSelect(imageNameWithTag);
        onClose();
    }
  };

  const handleSelectImage = (image: DockerImage) => {
    if (onSelect) {
      onSelect(`${image.name}:${image.tag}`);
      onClose();
    }
  };

  const imagesToDisplay = activeTab === 'official' ? officialImages : (localImages || []);

  const filteredAndSortedImages = useMemo(() => {
    if (!imagesToDisplay) return [];
    return imagesToDisplay
      .filter(img => `${(img as any).namespace || ''}/${img.name}`.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (activeTab === 'official') {
          switch (sortBy) {
            case 'popular': return (b as OfficialDockerImage).pullCount - (a as OfficialDockerImage).pullCount;
            case 'recent': return new Date((b as OfficialDockerImage).createdAt).getTime() - new Date((a as OfficialDockerImage).createdAt).getTime();
            case 'name': return `${(a as OfficialDockerImage).namespace}/${a.name}`.localeCompare(`${(b as OfficialDockerImage).namespace}/${b.name}`);
            default: return 0;
          }
        }
        return 0;
      });
  }, [imagesToDisplay, searchQuery, sortBy, activeTab]);

  if (!isOpen) return null;

  const renderImageGrid = (images: (DockerImage | OfficialDockerImage)[], isLocal: boolean) => (
    <div className={isLocal ? "local-images-list" : "images-grid"}>
      {isLoading ? (
        <div className="loading-spinner" style={{gridColumn: '1 / -1'}}><div className="spinner"></div></div>
      ) : images.length === 0 ? (
        <div className="empty-state" style={{gridColumn: '1 / -1'}}><span>{isLocal ? '로컬 이미지가 없습니다.' : '검색 결과가 없습니다.'}</span></div>
      ) : (
        images.map(image => {
          const key = (image as any).imageId || image.id || `${(image as any).namespace}/${image.name}:${image.tag}`;
          const imageName = (image as any).namespace && (image as any).namespace !== 'library' ? `${(image as any).namespace}/${image.name}` : image.name;
          const imageNameWithTag = `${imageName}:${image.tag}`;
          const isDownloaded = (localImages || []).some(localImg => localImg.name === imageName && localImg.tag === image.tag);

          return (
            <div key={key} className={isLocal ? "local-image-item" : "image-card"}>
              {isLocal ? (
                <>
                  <div className="local-image-info">
                    <h3 className="local-image-name">📦 {image.name}:{image.tag}</h3>
                    <div className="local-image-details">
                      <span className="image-id">ID: {image.id.slice(0, 12)}</span>
                      <span className="image-created">생성일: {new Date(image.created).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="local-image-actions">
                    {showSelectionButton && <button className="select-btn" onClick={() => handleSelectImage(image as DockerImage)}>선택</button>}
                    <button className="delete-btn" onClick={() => executeCommand(`docker rmi ${imageNameWithTag}`)}>삭제</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="image-card-header">
                    <h3 className="image-name">{imageName}</h3>
                    <span className="image-downloads">{(image as OfficialDockerImage).pullCount?.toLocaleString()} 다운로드</span>
                  </div>
                  <p className="image-description">{(image as OfficialDockerImage).description}</p>
                  <div className="image-meta">
                    <span className="last-updated">업데이트: {new Date((image as OfficialDockerImage).createdAt).toLocaleDateString('ko-KR')}</span>
                    <span className="image-stars">⭐ {(image as OfficialDockerImage).starCount?.toLocaleString()}</span>
                  </div>
                  <div className="action-buttons">
                    {showSelectionButton ? (
                      isDownloaded ? (
                        <button className="select-btn" onClick={() => handleSelectImage(image as DockerImage)}>선택</button>
                      ) : (
                        <button className="download-btn" onClick={() => handleDownloadAndSelect(image as OfficialDockerImage)}>다운로드 후 선택</button>
                      )
                    ) : (
                      !isDownloaded && <button className="download-btn" onClick={() => executeCommand(`docker pull ${imageNameWithTag}`)}>📥 다운로드</button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="image-modal-backdrop" onClick={handleBackdropClick}>
      <div className="image-modal-container">
        <div className="image-modal-header">
          <h2 className="image-modal-title"><span className="control-panel-icon">📦</span> Docker 이미지 {showSelectionButton ? '선택' : '관리'}</h2>
          <button className="image-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="image-modal-tabs">
          <button className={`image-tab ${activeTab === 'official' ? 'active' : ''}`} onClick={() => setActiveTab('official')}>
            <span className="tab-icon">🛡️</span> 공식 이미지
          </button>
          <button className={`image-tab ${activeTab === 'local' ? 'active' : ''}`} onClick={() => setActiveTab('local')}>
            <span className="tab-icon">💻</span> 로컬 이미지
          </button>
        </div>
        <div className="image-modal-content">
          <div className="search-and-filters">
            <input type="text" placeholder={`🔍 ${activeTab === 'official' ? '공식' : '로컬'} 이미지 검색...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
            {activeTab === 'official' && (
              <div className="filters">
                {sortOptions.map(option => (
                  <button key={option.value} className={`sort-btn ${sortBy === option.value ? 'active' : ''}`} onClick={() => setSortBy(option.value as any)}>{option.label}</button>
                ))}
              </div>
            )}
          </div>
          {renderImageGrid(filteredAndSortedImages, activeTab === 'local')}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;