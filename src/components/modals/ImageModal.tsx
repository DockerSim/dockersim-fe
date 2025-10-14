'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useDockerStore } from '../../store/dockerStore'
import './ImageModal.css'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect?: (image: string) => void
  showSelectionButton?: boolean
}

interface DockerImage {
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

interface DownloadState {
  imageId: string
  status: 'downloading' | 'completed' | 'error'
  progress: number
}

const imageService = {
  async downloadImage(imageName: string, tag: string = 'latest', onProgress?: (progress: number) => void): Promise<boolean> {
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          onProgress?.(progress)
          clearInterval(interval)
          resolve(true)
        } else {
          onProgress?.(progress)
        }
      }, 200)
    })
  },
  async deleteLocalImage(imageId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 500)
    })
  }
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, onSelect, showSelectionButton }) => {
  const { executeCommand, addMessage } = useDockerStore()
  
  const [activeTab, setActiveTab] = useState<'official' | 'local'>('official')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular')
  
  const [officialImages, setOfficialImages] = useState<DockerImage[]>([])
  const [localImages, setLocalImages] = useState<DockerImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [downloadStates, setDownloadStates] = useState<Map<string, DownloadState>>(new Map())
  const [downloadedImages, setDownloadedImages] = useState<Set<string>>(new Set())

  const sortOptions = [
    { value: 'popular', label: '인기순' },
    { value: 'recent', label: '최신순' },
    { value: 'name', label: '이름순' }
  ]

  const loadOfficialImages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/officeimage')
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

  const loadLocalImages = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/images')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const result = await response.json()
      setLocalImages(result.data || [])
    } catch (error) {
      console.error('Failed to load local images:', error)
      addMessage(`❌ 로컬 이미지 로딩에 실패했습니다.`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      // When modal opens, load data for the currently active tab.
      if (activeTab === 'official') {
        loadOfficialImages();
      } else {
        loadLocalImages();
      }
    }
  }, [isOpen, activeTab]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [isOpen, onClose])

  const handleDownload = async (image: DockerImage) => {
    const downloadId = `${image.namespace}/${image.name}:${image.tag}`
    executeCommand(`docker pull ${downloadId}`)
    setDownloadStates(prev => new Map(prev.set(downloadId, { imageId: downloadId, status: 'downloading', progress: 0 })))
    try {
      await imageService.downloadImage(image.name, image.tag, (progress) => {
        setDownloadStates(prev => new Map(prev.set(downloadId, { imageId: downloadId, status: 'downloading', progress })))
      })
      setDownloadStates(prev => new Map(prev.set(downloadId, { imageId: downloadId, status: 'completed', progress: 100 })))
      setDownloadedImages(prev => new Set([...prev, downloadId]))
      addMessage(`✅ ${downloadId} 이미지 다운로드가 완료되었습니다.`)
      // Automatically switch to local tab and reload after download
      setTimeout(() => {
        setActiveTab('local');
        loadLocalImages();
        setDownloadStates(prev => { const next = new Map(prev); next.delete(downloadId); return next });
      }, 2000);
    } catch (error) {
      setDownloadStates(prev => new Map(prev.set(downloadId, { imageId: downloadId, status: 'error', progress: 0 })))
      addMessage(`❌ ${downloadId} 이미지 다운로드에 실패했습니다.`)
    }
  }

  const handleDeleteLocal = async (image: DockerImage) => {
    if (!confirm(`정말로 ${image.namespace}/${image.name}:${image.tag} 이미지를 삭제하시겠습니까?`)) return
    try {
      executeCommand(`docker rmi ${image.namespace}/${image.name}:${image.tag}`)
      await imageService.deleteLocalImage(image.imageId)
      await loadLocalImages()
      addMessage(`🗑️ ${image.namespace}/${image.name}:${image.tag} 이미지가 삭제되었습니다.`)
    } catch (error) {
      console.error('Failed to delete image:', error)
      addMessage(`❌ 이미지 삭제에 실패했습니다.`)
    }
  }

  const handleSelectImage = (image: DockerImage) => {
    if (onSelect) {
      onSelect(`${image.namespace}/${image.name}:${image.tag}`);
      onClose();
    }
  };

  const imagesToDisplay = activeTab === 'official' ? officialImages : localImages;

  const filteredAndSortedImages = useMemo(() => imagesToDisplay
    .filter(img => `${(img as any).namespace || ''}/${img.name}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular': return b.pullCount - a.pullCount;
        case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name': return `${a.namespace}/${a.name}`.localeCompare(`${b.namespace}/${b.name}`);
        default: return 0;
      }
    }), [imagesToDisplay, searchQuery, sortBy]);

  if (!isOpen) return null

  const renderImageGrid = (images: DockerImage[], isLocal: boolean) => (
    <div className={isLocal ? "local-images-list" : "images-grid"}>
      {isLoading ? (
        <div className="loading-spinner" style={{gridColumn: '1 / -1'}}><div className="spinner"></div></div>
      ) : images.length === 0 ? (
        <div className="empty-state" style={{gridColumn: '1 / -1'}}><span>{isLocal ? '로컬 이미지가 없습니다.' : '검색 결과가 없습니다.'}</span></div>
      ) : (
        images.map(image => {
          const downloadId = `${image.namespace}/${image.name}:${image.tag}`;
          const downloadState = downloadStates.get(downloadId);
          const isDownloaded = downloadedImages.has(downloadId) || localImages.some(localImg => localImg.name === image.name && localImg.tag === image.tag);

          return (
            <div key={image.imageId} className={isLocal ? "local-image-item" : "image-card"}>
              {isLocal ? (
                <>
                  <div className="local-image-info">
                    <h3 className="local-image-name">📦 {image.namespace}/{image.name}:{image.tag}</h3>
                    <div className="local-image-details">
                      <span className="image-id">ID: {image.imageId.slice(7, 19)}</span>
                      <span className="image-created">생성일: {new Date(image.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="local-image-actions">
                    {showSelectionButton && (
                      <button className="select-btn" onClick={() => handleSelectImage(image)}>선택</button>
                    )}
                    <button className="delete-btn" onClick={() => handleDeleteLocal(image)}>삭제</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="image-card-header">
                    <h3 className="image-name">{image.namespace}/{image.name}</h3>
                    <span className="image-downloads">{image.pullCount.toLocaleString()} 다운로드</span>
                  </div>
                  <p className="image-description">{image.description}</p>
                  <div className="image-meta">
                    <span className="last-updated">업데이트: {new Date(image.createdAt).toLocaleDateString('ko-KR')}</span>
                    <span className="image-stars">⭐ {image.starCount.toLocaleString()}</span>
                  </div>
                  <div className="download-section">
                    {downloadState?.status === 'downloading' && (
                      <div className="download-progress">
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${downloadState.progress}%` }}></div></div>
                        <span className="progress-text">다운로드 중... {Math.round(downloadState.progress)}%</span>
                      </div>
                    )}
                    {downloadState?.status === 'completed' && <div className="download-complete"><span className="complete-text">✅ 다운로드 완료!</span></div>}
                    <div className="action-buttons">
                      {showSelectionButton ? (
                        isDownloaded ? (
                          <button className="select-btn" onClick={() => handleSelectImage(image)}>선택</button>
                        ) : (
                          !downloadState && <button className="download-btn" onClick={() => handleDownload(image)}>다운로드 후 선택</button>
                        )
                      ) : (
                        !downloadState && !isDownloaded && <button className="download-btn" onClick={() => handleDownload(image)}>📥 다운로드</button>
                      )}
                    </div>
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