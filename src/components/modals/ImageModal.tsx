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

// 공식 이미지 API 응답을 위한 타입 (백엔드 DTO와 일치)
interface OfficialDockerImage {
  id: number;
  hexId: string;
  shortHexId: string;
  namespace: string;
  name: string;
  tag: string;
  description: string;
  layer: string;
  starCount: number;
  pullCount: number;
  lastUpdated: string; // LocalDateTime은 string으로 받음
  dateRegistered: string;
  logoUrl?: string;
}

// 백엔드 API 응답 래퍼 타입 (백엔드 ApiResponse.java와 일치하도록 수정)
interface ApiResponse<T> {
    success: boolean;
    code: string;
    errorMessage: string;
    data: T;
}

const API_BASE_URL = 'http://localhost:8080'; // TODO: 환경 변수로 분리하는 것이 좋음

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, onSelect, showSelectionButton }) => {
  const { executeCommand, localImages, addMessage } = useDockerStore();
  
  const [activeTab, setActiveTab] = useState<'official' | 'local'>('official');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');
  
  const [officialImages, setOfficialImages] = useState<OfficialDockerImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortOptions = [
    { value: 'popular', label: '인기순' },
    { value: 'recent', label: '최신순' },
    { value: 'name', label: '이름순' }
  ];

  // 임시 simulationId와 userId. 실제 값은 사용자 세션 또는 전역 상태에서 가져와야 합니다.
  const SIMULATION_ID = "test-simulation-id"; // TODO: 실제 simulationId로 교체 필요
  const USER_ID = 1; // TODO: 실제 userId로 교체 필요

  // 공식 이미지 API 호출 (응답 처리 로직 수정)
  const fetchOfficialImages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 검색어가 있으면 /search, 없으면 /list 호출
      const endpoint = searchQuery ? `/api/officeimage/search?name=${encodeURIComponent(searchQuery)}` : '/api/officeimage/list';
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }
      
      const responseData: ApiResponse<OfficialDockerImage[]> = await response.json();
      
      if (responseData.success) {
        // data가 null일 경우를 대비하여 빈 배열로 처리
        setOfficialImages(responseData.data || []);
      } else {
        throw new Error(responseData.errorMessage || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (e: any) {
      setError(e.message);
      setOfficialImages([]); // 에러 발생 시 목록 비우기
    } finally {
      setIsLoading(false);
    }
  };

  // 모달이 열리거나 탭이 변경될 때, 또는 검색어가 변경될 때 이미지 로드
  useEffect(() => {
    if (isOpen && activeTab === 'official') {
      const timer = setTimeout(() => {
        fetchOfficialImages();
      }, 300); // 디바운싱: 사용자가 타이핑을 멈춘 후 300ms 뒤에 API 호출
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, searchQuery]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownloadAndSelect = (image: OfficialDockerImage) => {
    const imageNameWithTag = `${image.namespace === 'library' ? image.name : `${image.namespace}/${image.name}`}:${image.tag}`;
    executeCommand(`docker pull ${imageNameWithTag}`, SIMULATION_ID, USER_ID);
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

  // 정렬 로직
  const sortedImages = useMemo(() => {
    if (!imagesToDisplay) return [];
    return [...imagesToDisplay].sort((a, b) => {
        if (activeTab === 'official') {
          const imgA = a as OfficialDockerImage;
          const imgB = b as OfficialDockerImage;
          switch (sortBy) {
            case 'popular': return imgB.pullCount - imgA.pullCount;
            case 'recent': return new Date(imgB.lastUpdated).getTime() - new Date(imgA.lastUpdated).getTime();
            case 'name': return `${imgA.namespace}/${imgA.name}`.localeCompare(`${imgB.namespace}/${imgB.name}`);
            default: return 0;
          }
        }
        // 로컬 이미지 정렬이 필요한 경우 여기에 로직 추가
        return 0;
      });
  }, [imagesToDisplay, sortBy, activeTab]);

  if (!isOpen) return null;

  const renderImageGrid = (images: (DockerImage | OfficialDockerImage)[], isLocal: boolean) => (
    <div className={isLocal ? "local-images-list" : "images-grid"}>
      {isLoading ? (
        <div className="loading-spinner" style={{gridColumn: '1 / -1'}}><div className="spinner"></div></div>
      ) : error ? (
        <div className="empty-state" style={{gridColumn: '1 / -1'}}><span>오류: {error}</span></div>
      ) : images.length === 0 ? (
        <div className="empty-state" style={{gridColumn: '1 / -1'}}><span>{isLocal ? '로컬 이미지가 없습니다.' : '검색 결과가 없습니다.'}</span></div>
      ) : (
        images.map(image => {
          if (isLocal) {
            const localImg = image as DockerImage;
            const key = localImg.id || `${localImg.name}:${localImg.tag}`;
            const imageNameWithTag = `${localImg.name}:${localImg.tag}`;
            return (
              <div key={key} className="local-image-item">
                <div className="local-image-info">
                  <h3 className="local-image-name">📦 {localImg.name}:{localImg.tag}</h3>
                  <div className="local-image-details">
                    <span className="image-id">ID: {localImg.id.slice(0, 12)}</span>
                    <span className="image-created">생성일: {new Date(localImg.created).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <div className="local-image-actions">
                  {showSelectionButton && <button className="select-btn" onClick={() => handleSelectImage(localImg)}>선택</button>}
                  <button className="delete-btn" onClick={() => executeCommand(`docker rmi ${imageNameWithTag}`, SIMULATION_ID, USER_ID)}>삭제</button>
                </div>
              </div>
            );
          } else {
            const officialImg = image as OfficialDockerImage;
            const key = officialImg.id;
            const imageName = officialImg.namespace && officialImg.namespace !== 'library' ? `${officialImg.namespace}/${officialImg.name}` : officialImg.name;
            const imageNameWithTag = `${imageName}:${officialImg.tag}`;
            const isDownloaded = (localImages || []).some(localImg => localImg.name === imageName && localImg.tag === officialImg.tag);

            return (
              <div key={key} className="image-card">
                <div className="image-card-header">
                  <h3 className="image-name">{imageName}</h3>
                  <span className="image-downloads">{officialImg.pullCount?.toLocaleString()} 다운로드</span>
                </div>
                <p className="image-description">{officialImg.description}</p>
                <div className="image-meta">
                  <span className="last-updated">업데이트: {new Date(officialImg.lastUpdated).toLocaleDateString('ko-KR')}</span>
                  <span className="image-stars">⭐ {officialImg.starCount?.toLocaleString()}</span>
                </div>
                <div className="action-buttons">
                  {showSelectionButton ? (
                    isDownloaded ? (
                      <button className="select-btn" onClick={() => handleSelectImage({ id: officialImg.hexId, name: imageName, tag: officialImg.tag, created: officialImg.lastUpdated, size: 'N/A' })}>선택</button>
                    ) : (
                      <button className="download-btn" onClick={() => handleDownloadAndSelect(officialImg)}>다운로드 후 선택</button>
                    )
                  ) : (
                    !isDownloaded && <button className="download-btn" onClick={() => executeCommand(`docker pull ${imageNameWithTag}`, SIMULATION_ID, USER_ID)}>📥 다운로드</button>
                  )}
                </div>
              </div>
            );
          }
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
          {renderImageGrid(sortedImages, activeTab === 'local')}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;