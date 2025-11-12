import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './DockerfileFeedbackModal.css';
import { useDockerStore } from '../../store/dockerStore';
import axiosInstance from '../../api/axiosInstance';

interface ComposeFileModalProps {
  open: boolean;
  onClose: () => void;
  simulationPublicId: string | null;
}

const ComposeFileModal: React.FC<ComposeFileModalProps> = ({ open, onClose, simulationPublicId }) => {
  const { generateComposeFile } = useDockerStore();
  const [composeContent, setComposeContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // 로컬에서 docker-compose.yml 생성
      const localComposeContent = generateComposeFile();

      // 내용이 거의 비어있는지 확인
      const isEmpty = localComposeContent.trim().split('\n').length <= 3 ||
                      !localComposeContent.includes('image:');

      if (isEmpty) {
        setComposeContent('# Docker Compose 파일을 생성하려면 먼저 컨테이너를 생성해주세요.\n# 터미널에서 "docker create" 또는 "docker run" 명령어를 사용하거나\n# 좌측 메뉴에서 "Create Container" 버튼을 클릭하세요.\n\n' + localComposeContent);
      } else {
        setComposeContent(localComposeContent);
      }
    }
  }, [open, generateComposeFile]);

  const handleGenerateCompose = async () => {
    if (!simulationPublicId) {
      alert('시뮬레이션 ID가 필요합니다. 먼저 시뮬레이션을 저장해주세요.');
      return;
    }

    setIsLoading(true);
    setComposeContent('AI가 최적화된 Docker Compose 파일을 생성 중입니다...');

    try {
      // DockerComposeController의 AI 기반 자동 생성 API 호출
      const response = await axiosInstance.post(`/simulations/${simulationPublicId}/compose`);

      const result = response.data;

      if (result.success && result.data) {
        const composeData = result.data;
        if (composeData.composeFileContent) {
          setComposeContent(composeData.composeFileContent);
        } else {
          setComposeContent('생성된 Docker Compose 파일 내용이 없습니다.');
        }
      } else {
        throw new Error(result.errorMessage || 'Docker Compose 파일을 생성하지 못했습니다.');
      }
    } catch (error: any) {
      console.error('Docker Compose 생성 요청 실패:', error);
      const errorMessage = error.response?.data?.errorMessage || error.message || '알 수 없는 오류가 발생했습니다.';
      setComposeContent(`파일 생성 중 오류가 발생했습니다:\n${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
      <div className="modal-backdrop" onClick={handleBackdropClick}>
        <div className="modal-container" style={{ maxWidth: '90vw', width: '1600px' }}>
          <div className="modal-header">
            <div className="modal-title">
              <span className="modal-icon">📝</span>
              <span>Docker Compose 파일 생성</span>
            </div>
          </div>
          <div className="modal-content">
            <div className="feedback-section">
              <h4>생성된 docker-compose.yml</h4>
              <textarea
                  className="feedback-textarea"
                  value={composeContent}
                  readOnly
                  placeholder="Docker Compose 파일 내용이 여기에 표시됩니다."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="action-btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>,
      document.body
  );
};

export default ComposeFileModal;