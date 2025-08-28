import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ImageSelectionModal.css';

// 백엔드 API 응답(DockerImageResponse)에 맞춰 인터페이스 수정
interface DockerImage {
  imageId: string;
  name: string;
  namespace: string;
  tag: string;
  description?: string;
  starCount: number;
  pullCount: number;
  createdAt: string; // LocalDateTime은 JSON에서 string으로 변환됨
  logoUrl?: string;
  // 'type'은 UI에서 탭을 구분하기 위해 프론트엔드에서 추가
  type: 'local' | 'official';
}

interface ImageSelectionModalProps {
  open: boolean;
  onSelect: (image: string) => void;
  onClose: () => void;
}

const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({ open, onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'official'>('official');
  const [searchTerm, setSearchTerm] = useState('');
  // API로부터 받아온 이미지를 저장할 state
  const [officialImages, setOfficialImages] = useState<DockerImage[]>([]);
  const [localImages, setLocalImages] = useState<DockerImage[]>([]); // 로컬 이미지 state (현재는 비어있음)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트가 열릴 때 API를 호출하여 공식 이미지 목록을 가져옴
  useEffect(() => {
    if (open) {
      const fetchImages = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/images'); // 백엔드 API 엔드포인트
          if (!response.ok) {
            throw new Error('Failed to fetch images');
          }
          const result = await response.json();
          // 백엔드 응답이 ApiResponse로 감싸져 있으므로 result.data 사용
          // 모든 이미지를 'official' 타입으로 지정
          const imagesWithType = result.data.map((img: any) => ({ ...img, type: 'official' }));
          setOfficialImages(imagesWithType);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setIsLoading(false);
        }
      };

      fetchImages();
    }
  }, [open]); // open 상태가 변경될 때마다 실행

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const imagesToDisplay = activeTab === 'official' ? officialImages : localImages;

  const filteredImages = imagesToDisplay.filter(image =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    image.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectImage = (image: DockerImage) => {
    // 백엔드의 namespace와 name을 조합하여 전체 이미지 이름을 전달
    onSelect(`${image.namespace}/${image.name}:${image.tag}`);
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
            공식 이미지 ({officialImages.length})
            <div className="tab-description">Docker Hub 공식 이미지</div>
          </button>
          <button
            className={`image-selection-tab ${activeTab === 'local' ? 'active' : ''}`}
            onClick={() => setActiveTab('local')}
          >
            <span className="tab-icon">💻</span>
            로컬 이미지 ({localImages.length})
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
            {isLoading ? (
              <div className="image-selection-empty-state"><p>이미지를 불러오는 중입니다...</p></div>
            ) : error ? (
              <div className="image-selection-empty-state"><p>오류: {error}</p></div>
            ) : filteredImages.length === 0 ? (
              <div className="image-selection-empty-state">
                <p>사용 가능한 {activeTab === 'official' ? '공식' : '로컬'} 이미지가 없습니다.</p>
              </div>
            ) : (
              filteredImages.map(image => (
                <div
                  key={image.imageId} // key를 고유한 imageId로 변경
                  className="image-selection-item"
                  onClick={() => handleSelectImage(image)}
                >
                  <div className="image-selection-info">
                    <div className="image-selection-header">
                      {/* namespace 추가 */}
                      <span className="image-selection-name">{image.namespace}/{image.name}</span>
                      <span className="image-selection-tag">{image.tag}</span>
                    </div>
                    <p className="image-selection-description">{image.description}</p>
                    <div className="image-selection-details">
                      {/* 백엔드 데이터에 맞게 수정 */}
                      <span>⭐ {image.starCount}</span>
                      <span>⬇️ {image.pullCount}</span>
                      <span>🗓️ {new Date(image.createdAt).toLocaleDateString()}</span>
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