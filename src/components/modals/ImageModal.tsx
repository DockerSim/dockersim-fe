'use client'

import React, { useState, useEffect } from 'react'
import { useDockerStore } from '../../store/dockerStore'
import './ImageModal.css'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
}

interface OfficialImage {
  id: string
  name: string
  description: string
  downloads: number
  lastUpdated: string
  tags: string[]
  stars: number
  category: string
}

interface LocalImage {
  id: string
  name: string
  tag: string
  imageId: string
  created: string
  size: string
  parentId?: string
  labels?: Record<string, string>
}

interface DownloadState {
  imageId: string
  status: 'downloading' | 'completed' | 'error'
  progress: number
}

// API 연동을 위한 서비스 함수들
const imageService = {
  // 공식 이미지 목록 조회
  async fetchOfficialImages(query?: string, sortBy?: string, category?: string): Promise<OfficialImage[]> {
    // 실제 구현시 Docker Hub API 호출
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'nginx',
            description: '고성능 웹서버 및 리버스 프록시',
            downloads: 1000000000,
            lastUpdated: '2024-01-15',
            tags: ['latest', '1.25', 'alpine'],
            stars: 15000,
            category: 'webserver'
          },
          {
            id: '2',
            name: 'mysql',
            description: '가장 인기 있는 오픈소스 데이터베이스',
            downloads: 500000000,
            lastUpdated: '2024-01-10',
            tags: ['latest', '8.0', '5.7'],
            stars: 12000,
            category: 'database'
          },
          {
            id: '3',
            name: 'node',
            description: 'Node.js 런타임',
            downloads: 800000000,
            lastUpdated: '2024-01-20',
            tags: ['latest', '20', '18', 'alpine'],
            stars: 8000,
            category: 'runtime'
          },
          {
            id: '4',
            name: 'ubuntu',
            description: 'Ubuntu Linux 운영체제',
            downloads: 2000000000,
            lastUpdated: '2024-01-18',
            tags: ['latest', '22.04', '20.04'],
            stars: 20000,
            category: 'os'
          },
          {
            id: '5',
            name: 'redis',
            description: 'In-memory 데이터 구조 저장소',
            downloads: 300000000,
            lastUpdated: '2024-01-12',
            tags: ['latest', '7', '6'],
            stars: 9000,
            category: 'database'
          },
          {
            id: '6',
            name: 'python',
            description: 'Python 프로그래밍 언어',
            downloads: 600000000,
            lastUpdated: '2024-01-22',
            tags: ['latest', '3.12', '3.11'],
            stars: 7000,
            category: 'runtime'
          }
        ])
      }, 500)
    })
  },

  // 로컬 이미지 목록 조회
  async fetchLocalImages(): Promise<LocalImage[]> {
    // 실제 구현시 Docker API 호출
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            name: 'my-app',
            tag: 'latest',
            imageId: 'sha256:123abc...',
            created: '2024-01-20T10:30:00Z',
            size: '245MB',
            labels: { 'version': '1.0.0', 'author': 'developer' }
          },
          {
            id: '2',
            name: 'nginx',
            tag: 'latest',
            imageId: 'sha256:456def...',
            created: '2024-01-18T15:45:00Z',
            size: '187MB'
          }
        ])
      }, 300)
    })
  },

  // 이미지 다운로드
  async downloadImage(imageName: string, tag: string = 'latest', onProgress?: (progress: number) => void): Promise<boolean> {
    // 실제 구현시 Docker pull API 호출
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

  // 로컬 이미지 삭제
  async deleteLocalImage(imageId: string): Promise<boolean> {
    // 실제 구현시 Docker rmi API 호출
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 500)
    })
  }
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose }) => {
  // Docker Store 연동
  const { executeCommand, addMessage } = useDockerStore()
  
  const [activeTab, setActiveTab] = useState<'official' | 'local'>('official')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular')
  const [category, setCategory] = useState<'all' | 'os' | 'database' | 'webserver' | 'runtime'>('all')
  
  const [officialImages, setOfficialImages] = useState<OfficialImage[]>([])
  const [localImages, setLocalImages] = useState<LocalImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [downloadStates, setDownloadStates] = useState<Map<string, DownloadState>>(new Map())
  const [downloadedImages, setDownloadedImages] = useState<Set<string>>(new Set())

  // 카테고리 옵션
  const categoryOptions = [
    { value: 'all', label: '전체', icon: '📦' },
    { value: 'os', label: '운영체제', icon: '🖥️' },
    { value: 'database', label: '데이터베이스', icon: '🗃️' },
    { value: 'webserver', label: '웹서버', icon: '🌐' },
    { value: 'runtime', label: '런타임', icon: '⚡' }
  ]

  // 정렬 옵션
  const sortOptions = [
    { value: 'popular', label: '인기순' },
    { value: 'recent', label: '최신순' },
    { value: 'name', label: '이름순' }
  ]

  // 공식 이미지 로딩
  const loadOfficialImages = async () => {
    setIsLoading(true)
    try {
      const images = await imageService.fetchOfficialImages(searchQuery, sortBy, category)
      setOfficialImages(images)
    } catch (error) {
      console.error('Failed to load official images:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 로컬 이미지 로딩
  const loadLocalImages = async () => {
    setIsLoading(true)
    try {
      const images = await imageService.fetchLocalImages()
      setLocalImages(images)
    } catch (error) {
      console.error('Failed to load local images:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 초기 로딩
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'official') {
        loadOfficialImages()
      } else {
        loadLocalImages()
      }
    }
  }, [isOpen, activeTab])

  // 검색/필터 변경시 재로딩
  useEffect(() => {
    if (isOpen && activeTab === 'official') {
      const debounceTimer = setTimeout(loadOfficialImages, 300)
      return () => clearTimeout(debounceTimer)
    }
  }, [searchQuery, sortBy, category])

  // 모달 외부 클릭 시 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [isOpen, onClose])

  // 이미지 다운로드
  const handleDownload = async (image: OfficialImage, tag: string = 'latest') => {
    const downloadId = `${image.name}:${tag}`
    
    // 터미널에 Docker 명령어 표시
    executeCommand(`docker pull ${image.name}:${tag}`)
    
    setDownloadStates(prev => new Map(prev.set(downloadId, {
      imageId: downloadId,
      status: 'downloading',
      progress: 0
    })))

    try {
      await imageService.downloadImage(image.name, tag, (progress) => {
        setDownloadStates(prev => new Map(prev.set(downloadId, {
          imageId: downloadId,
          status: 'downloading',
          progress
        })))
      })

      // 완료 상태로 변경
      setDownloadStates(prev => new Map(prev.set(downloadId, {
        imageId: downloadId,
        status: 'completed',
        progress: 100
      })))

      // 다운로드된 이미지 목록에 추가
      setDownloadedImages(prev => new Set([...prev, downloadId]))

      // 터미널에 완료 메시지 표시 (흰색 텍스트)
      addMessage(`✅ ${image.name}:${tag} 이미지 다운로드가 완료되었습니다.`)

      // 3초 후 상태 초기화
      setTimeout(() => {
        setDownloadStates(prev => {
          const next = new Map(prev)
          next.delete(downloadId)
          return next
        })
        // 로컬 이미지 목록 갱신
        if (activeTab === 'local') {
          loadLocalImages()
        }
      }, 3000)

    } catch (error) {
      setDownloadStates(prev => new Map(prev.set(downloadId, {
        imageId: downloadId,
        status: 'error',
        progress: 0
      })))
      addMessage(`❌ ${image.name}:${tag} 이미지 다운로드에 실패했습니다.`)
    }
  }

  // 다운로드된 공식 이미지 삭제
  const handleRemoveDownloaded = async (image: OfficialImage, tag: string = 'latest') => {
    const downloadId = `${image.name}:${tag}`
    
    if (!confirm(`정말로 다운로드된 ${image.name}:${tag} 이미지를 삭제하시겠습니까?`)) {
      return
    }

    try {
      // 터미널에 Docker 명령어 표시
      executeCommand(`docker rmi ${image.name}:${tag}`)
      
      await imageService.deleteLocalImage(downloadId)
      
      // 다운로드된 이미지 목록에서 제거
      setDownloadedImages(prev => {
        const next = new Set(prev)
        next.delete(downloadId)
        return next
      })
      
      // 성공 메시지 (흰색 텍스트)
      addMessage(`🗑️ ${image.name}:${tag} 이미지가 삭제되었습니다.`)
      
      // 로컬 이미지 목록 갱신
      if (activeTab === 'local') {
        loadLocalImages()
      }
    } catch (error) {
      console.error('Failed to delete image:', error)
      addMessage(`❌ ${image.name}:${tag} 이미지 삭제에 실패했습니다.`)
      alert('이미지 삭제에 실패했습니다.')
    }
  }

  // 로컬 이미지 삭제
  const handleDeleteLocal = async (image: LocalImage) => {
    if (!confirm(`정말로 ${image.name}:${image.tag} 이미지를 삭제하시겠습니까?`)) {
      return
    }

    try {
      // 터미널에 Docker 명령어 표시
      executeCommand(`docker rmi ${image.name}:${image.tag}`)
      
      await imageService.deleteLocalImage(image.imageId)
      await loadLocalImages() // 목록 새로고침
      
      // 성공 메시지 (흰색 텍스트)
      addMessage(`🗑️ ${image.name}:${image.tag} 이미지가 삭제되었습니다.`)
    } catch (error) {
      console.error('Failed to delete image:', error)
      addMessage(`❌ ${image.name}:${image.tag} 이미지 삭제에 실패했습니다.`)
      alert('이미지 삭제에 실패했습니다.')
    }
  }

  // 필터링된 이미지 목록
  const filteredOfficialImages = officialImages.filter(img => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (category === 'all' || img.category === category)
  ).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.downloads - a.downloads
      case 'recent':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const filteredLocalImages = localImages.filter(img => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="image-modal-backdrop" onClick={handleBackdropClick}>
      <div className="image-modal-container">
        {/* 모달 헤더 */}
        <div className="image-modal-header">
          <h2 className="image-modal-title">
            <span className="control-panel-icon">📦</span>
            Docker 이미지 관리
          </h2>
          <button className="image-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="image-modal-tabs">
          <button
            className={`image-tab ${activeTab === 'official' ? 'active' : ''}`}
            onClick={() => setActiveTab('official')}
          >
            <span className="tab-icon">🛡️</span>
            공식 이미지
            <div className="tab-description">Docker Hub 공식 이미지</div>
          </button>
          <button
            className={`image-tab ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => setActiveTab('local')}
          >
            <span className="tab-icon">💻</span>
            로컬 이미지  
            <div className="tab-description">내 컴퓨터 저장된 이미지</div>
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="image-modal-content">
          {activeTab === 'official' ? (
            <div className="official-content">
              {/* 통합된 검색 및 필터 */}
              <div className="search-and-filters">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="🔍 이미지 검색... (예: nginx, mysql, node, ubuntu)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <div className="filters">
                  {/* 카테고리 필터 */}
                  <div className="filter-section">
                    <div className="filter-label">카테고리</div>
                    <div className="category-filters">
                      {categoryOptions.map(option => (
                        <button
                          key={option.value}
                          className={`category-btn ${category === option.value ? 'active' : ''}`}
                          onClick={() => setCategory(option.value as any)}
                        >
                          <span>{option.icon}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 정렬 옵션 */}
                  <div className="filter-section">
                    <div className="filter-label">정렬 기준</div>
                    <div className="sort-filters">
                      {sortOptions.map(option => (
                        <button
                          key={option.value}
                          className={`sort-btn ${sortBy === option.value ? 'active' : ''}`}
                          onClick={() => setSortBy(option.value as any)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 이미지 목록 */}
              <div className="images-grid">
                {filteredOfficialImages.map(image => {
                  const downloadId = `${image.name}:latest`
                  const downloadState = downloadStates.get(downloadId)
                  const isDownloaded = downloadedImages.has(downloadId)
                  
                  return (
                    <div key={image.id} className="image-card">
                      <div className="image-card-header">
                        <h3 className="image-name">{image.name}</h3>
                        <span className="image-downloads">
                          {image.downloads.toLocaleString()} 다운로드
                        </span>
                      </div>
                      <p className="image-description">{image.description}</p>
                      <div className="image-meta">
                        <span className="last-updated">
                          업데이트: {new Date(image.lastUpdated).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      
                      {/* 다운로드 섹션 */}
                      <div className="download-section">
                        {downloadState?.status === 'downloading' && (
                          <div className="download-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${downloadState.progress}%` }}
                              ></div>
                            </div>
                            <span className="progress-text">
                              다운로드 중... {Math.round(downloadState.progress)}%
                            </span>
                          </div>
                        )}
                        
                        {downloadState?.status === 'completed' && (
                          <div className="download-complete">
                            <span className="complete-text">✅ 다운로드 완료!</span>
                          </div>
                        )}

                        {/* 액션 버튼들 */}
                        <div className="action-buttons">
                          {!downloadState && !isDownloaded && (
                            <button 
                              className="download-btn"
                              onClick={() => handleDownload(image)}
                            >
                              📥 다운로드
                            </button>
                          )}
                          
                          {isDownloaded && !downloadState && (
                            <>
                              <button 
                                className="download-btn"
                                onClick={() => handleDownload(image)}
                              >
                                🔄 재다운로드
                              </button>
                              <button 
                                className="remove-downloaded-btn"
                                onClick={() => handleRemoveDownloaded(image)}
                              >
                                🗑️ 삭제
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="local-content">
              {/* 검색 */}
              <div className="search-and-filters">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="🔍 로컬 이미지 검색... (이름:태그)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {/* 로컬 이미지 목록 */}
              <div className="local-images-list">
                {filteredLocalImages.map(image => (
                  <div key={image.id} className="local-image-item">
                    <div className="local-image-info">
                      <h3 className="local-image-name">📦 {image.name}:{image.tag}</h3>
                      <div className="local-image-details">
                        <span className="image-id">ID: {image.imageId.slice(0, 12)}</span>
                        <span className="image-created">
                          생성일: {new Date(image.created).toLocaleDateString('ko-KR')}
                        </span>
                        <span className="image-size">크기: {image.size}</span>
                      </div>
                    </div>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteLocal(image)}
                    >
                      🗑️삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 로딩 스피너 */}
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>{activeTab === 'official' ? '공식 이미지를 불러오는 중...' : '로컬 이미지를 불러오는 중...'}</span>
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && (
          <>
            {activeTab === 'official' && filteredOfficialImages.length === 0 && (
              <div className="empty-state">
                <span>검색 결과가 없습니다.</span>
              </div>
            )}
            {activeTab === 'local' && filteredLocalImages.length === 0 && (
              <div className="empty-state">
                <span>로컬 이미지가 없습니다.</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ImageModal 