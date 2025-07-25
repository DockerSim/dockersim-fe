import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ImageSelectionModal.css';

interface DockerImage {
  id: string;
  name: string;
  tag: string;
  size: string;
  created: string;
  type: 'local' | 'official';
  description?: string;
}

interface ImageSelectionModalProps {
  open: boolean;
  onSelect: (image: string) => void;
  onClose: () => void;
}

const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({ open, onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'official'>('official');
  const [searchTerm, setSearchTerm] = useState('');

  // 더미 데이터 - 실제로는 docker images 명령어 결과를 사용해야 함
  const [downloadedImages] = useState<DockerImage[]>([
    // 공식 이미지들
    {
      id: '1',
      name: 'nginx',
      tag: 'latest',
      size: '142MB',
      created: '2024-01-15',
      type: 'official',
      description: '고성능 웹 서버 및 리버스 프록시'
    },
    {
      id: '2',
      name: 'mysql',
      tag: '8.0',
      size: '514MB',
      created: '2024-01-10',
      type: 'official',
      description: '인기 있는 오픈소스 관계형 데이터베이스'
    },
    {
      id: '3',
      name: 'redis',
      tag: '7-alpine',
      size: '32MB',
      created: '2024-01-12',
      type: 'official',
      description: '인메모리 데이터 구조 저장소'
    },
    {
      id: '4',
      name: 'postgres',
      tag: '15',
      size: '379MB',
      created: '2024-01-08',
      type: 'official',
      description: '강력한 오픈소스 객체 관계형 데이터베이스'
    },
    // 로컬 이미지들
    {
      id: '5',
      name: 'my-app',
      tag: 'v1.0',
      size: '256MB',
      created: '2024-01-20',
      type: 'local',
      description: '사용자 정의 애플리케이션 이미지'
    },
    {
      id: '6',
      name: 'custom-nginx',
      tag: 'dev',
      size: '180MB',
      created: '2024-01-18',
      type: 'local',
      description: '커스텀 설정이 적용된 Nginx 이미지'
    }
  ]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const filteredImages = downloadedImages
    .filter(image => image.type === activeTab)
    .filter(image => 
      image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleSelectImage = (image: DockerImage) => {
    onSelect(`${image.name}:${image.tag}`);
    onClose();
  };

  return createPortal(
    <div className="image-selection-modal-backdrop" onClick={handleBackdropClick}>
      <div className="image-selection-modal-container">
        {/* 모달 헤더 */}
        <div className="image-selection-modal-header">
          <h2 className="image-selection-modal-title">
            <span className="control-panel-icon">📦</span>
            이미지 선택
          </h2>
          <button className="image-selection-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        {/* 탭 네비게이션 */}
        <div className="image-selection-modal-tabs">
          <button
            className={`image-selection-tab ${activeTab === 'official' ? 'active' : ''}`}
            onClick={() => setActiveTab('official')}
          >
            <span className="tab-icon">🛡️</span>
            공식 이미지 ({downloadedImages.filter(img => img.type === 'official').length})
            <div className="tab-description">Docker Hub 공식 이미지</div>
          </button>
          <button
            className={`image-selection-tab ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => setActiveTab('local')}
          >
            <span className="tab-icon">💻</span>
            로컬 이미지 ({downloadedImages.filter(img => img.type === 'local').length})
            <div className="tab-description">내 컴퓨터 저장된 이미지</div>
          </button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="image-selection-modal-content">
          {/* 검색 바 */}
          <div className="image-selection-search-section">
            <div className="image-selection-search-container">
              <input
                type="text"
                placeholder="🔍 이미지 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="image-selection-search-input"
              />
            </div>
          </div>

          {/* 이미지 리스트 */}
          <div className="image-selection-list">
            {filteredImages.length === 0 ? (
              <div className="image-selection-empty-state">
                <p>다운로드된 {activeTab === 'official' ? '공식' : '로컬'} 이미지가 없습니다.</p>
                <small>Docker Hub에서 이미지를 다운로드하거나 로컬에서 빌드해보세요.</small>
              </div>
            ) : (
              filteredImages.map(image => (
                <div
                  key={image.id}
                  className="image-selection-item"
                  onClick={() => handleSelectImage(image)}
                >
                  <div className="image-selection-info">
                    <div className="image-selection-header">
                      <span className="image-selection-name">{image.name}</span>
                      <span className="image-selection-tag">{image.tag}</span>
                    </div>
                    <p className="image-selection-description">{image.description}</p>
                    <div className="image-selection-details">
                      <span>크기: {image.size}</span>
                      <span>생성: {image.created}</span>
                    </div>
                  </div>
                  <div className="image-selection-actions">
                    <span className="select-icon">선택 →</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImageSelectionModal; 