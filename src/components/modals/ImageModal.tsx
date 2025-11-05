'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useDockerStore, DockerImage } from '../../store/dockerStore'
import './ImageModal.css'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect?: (image: string) => void
  showSelectionButton?: boolean
}

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

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, onSelect, showSelectionButton }) => {
  const { executeCommand, localImages, addMessage } = useDockerStore()
  
  const [activeTab, setActiveTab] = useState<'official' | 'local'>('official')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular')
  
  const [officialImages, setOfficialImages] = useState<OfficialDockerImage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sortOptions = [
    { value: 'popular', label: '인기순' },
    { value: 'recent', label: '최신순' },
    { value: 'name', label: '이름순' }
  ]

  const loadOfficialImages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/officialimage') // 오타 수정: officeimage -> officialimage
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const result = await response.json()
      setOfficialImages(result.data || [])
    } catch (error) {
      console.error('Failed to load official images:', error)
      addMessage(`❌ 공식 이미지 로딩에 실패했습니다.`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'official') {
        loadOfficialImages();
      }
    }
  }, [isOpen, activeTab]);

  const handleDownloadAndSelect = (image: OfficialDockerImage) => {
    const imageNameWithTag = `${image.namespace}/${image.name}:${image.tag}`;
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

  const imagesToDisplay = activeTab === 'official' ? officialImages : localImages;

  const filteredAndSortedImages = useMemo(() => imagesToDisplay
    .filter(img => `${(img as any).namespace || ''}/${img.name}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular': return (b as OfficialDockerImage).pullCount - (a as OfficialDockerImage).pullCount;
        case 'recent': return new Date((b as OfficialDockerImage).createdAt).getTime() - new Date((a as OfficialDockerImage).createdAt).getTime();
        case 'name': return `${(a as OfficialDockerImage).namespace || ''}/${a.name}`.localeCompare(`${(b as OfficialDockerImage).namespace || ''}/${b.name}`);
        default: return 0;
      }
    }), [imagesToDisplay, searchQuery, sortBy]);

  if (!isOpen) return null

  const renderImageGrid = (images: (DockerImage | OfficialDockerImage)[], isLocal: boolean) => (
    <div className={isLocal ? "local-images-list" : "images-grid"}>
      {isLoading ? (
        <div className="loading-spinner" style={{gridColumn: '1 / -1'}}><div className="spinner"></div></div>
      ) : images.length === 0 ? (
        <div className="empty-state" style={{gridColumn: '1 / -1'}}><span>{isLocal ? '로컬 이미지가 없습니다.' : '검색 결과가 없습니다.'}</span></div>
      ) : (
        images.map(image => {
          const imageId = image.id || `${image.name}:${image.tag}`; // key를 위한 고유 ID 생성
          const imageNameWithTag = `${image.name}:${image.tag}`;
          const isDownloaded = localImages.some(localImg => localImg.name === image.name && localImg.tag === image.tag);

          return (
            <div key={imageId} className={isLocal ? "local-image-item" : "image-card"}>
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
                    {showSelectionButton && (
                      <button className="select-btn" onClick={() => handleSelectImage(image as DockerImage)}>선택</button>
                    )}
                    <button className="delete-btn" onClick={() => executeCommand(`docker rmi ${imageNameWithTag}`)}>삭제</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="image-card-header">
                    <h3 className="image-name">{(image as OfficialDockerImage).namespace || ''}/{(image as OfficialDockerImage).name}</h3>
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
          )
        })
      )}
    </div>
  )

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
            <div className="tab-description">Docker Hub 공식 이미지</div>
          </button>
          <button className={`image-tab ${activeTab === 'local' ? 'active' : ''}`} onClick={() => setActiveTab('local')}>
            <span className="tab-icon">💻</span> 로컬 이미지
            <div className="tab-description">내 컴퓨터 저장된 이미지</div>
          </button>
        </div>

        <div className="image-modal-content">
          <div className="search-and-filters">
            <div className="search-container">
              <input type="text" placeholder={`🔍 ${activeTab === 'official' ? '공식' : '로컬'} 이미지 검색...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
            </div>
            {activeTab === 'official' && (
              <div className="filters">
                <div className="filter-section">
                  <div className="filter-label">정렬 기준</div>
                  <div className="sort-filters">
                    {sortOptions.map(option => (
                      <button key={option.value} className={`sort-btn ${sortBy === option.value ? 'active' : ''}`} onClick={() => setSortBy(option.value as any)}>{option.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          {renderImageGrid(filteredAndSortedImages, activeTab === 'local')}
        </div>
      </div>
    </div>
  )
}

export default ImageModal