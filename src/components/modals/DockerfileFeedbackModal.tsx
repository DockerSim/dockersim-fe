import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './DockerfileFeedbackModal.css';
import { useDockerStore } from '../../store/dockerStore';
import axiosInstance from '../../api/axiosInstance'; // axiosInstance 사용

interface DockerfileFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const DockerfileFeedbackModal: React.FC<DockerfileFeedbackModalProps> = ({ open, onClose }) => {
  const { generateComposeFile } = useDockerStore(); // generateComposeFile 가져오기
  const [beforeText, setBeforeText] = useState(''); // 초기값 변경
  const [afterText, setAfterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const composeFileContent = generateComposeFile(); // Docker Compose 파일 생성
      setBeforeText(composeFileContent); // 생성된 내용으로 설정
      setAfterText('');
    }
  }, [open, generateComposeFile]); // generateComposeFile을 의존성 배열에 추가

  const handleGetFeedback = async () => {
    setIsLoading(true);
    setAfterText('AI 피드백을 생성 중입니다...');

    try {
      const response = await axiosInstance.post('/dockerfiles/feedback', {
        dockerComposeContent: beforeText
      });

      // axiosInstance는 자동으로 인증 토큰을 추가하고 JSON 파싱을 해줍니다
      const result = response.data;

      // 백엔드 응답 형식: { success, data: { feedback, original, optimized, ... }, errorMessage }
      if (result.success && result.data) {
        const feedbackData = result.data;
        let feedbackText = '';

        if (feedbackData.feedback) {
          feedbackText += `${feedbackData.feedback}\n\n`;
        }

        if (feedbackData.optimized) {
          feedbackText += `=== 최적화된 Docker Compose ===\n${feedbackData.optimized}\n\n`;
        }

        if (feedbackData.analysisMethod) {
          feedbackText += `분석 방법: ${feedbackData.analysisMethod}\n`;
        }

        if (feedbackData.processingTimeMs) {
          feedbackText += `처리 시간: ${feedbackData.processingTimeMs}ms\n`;
        }

        setAfterText(feedbackText || '피드백을 받아오지 못했습니다.');
      } else {
        throw new Error(result.errorMessage || '피드백을 받아오지 못했습니다.');
      }
    } catch (error: any) {
      console.error('피드백 요청 실패:', error);
      const errorMessage = error.response?.data?.errorMessage || error.message || '알 수 없는 오류가 발생했습니다.';
      setAfterText(`피드백 요청 중 오류가 발생했습니다:\n${errorMessage}`);
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
            <span>Dockerfile 피드백</span>
          </div>
        </div>
        <div className="modal-content" style={{ display: 'flex', flexDirection: 'row' }}>
          <div className="feedback-section">
            <h4>현재 Docker Compose 파일</h4> {/* 제목 변경 */}
            <textarea
              className="feedback-textarea"
              value={beforeText}
              readOnly // 읽기 전용으로 변경
              placeholder="Docker Compose 파일 내용이 여기에 표시됩니다."
            />
          </div>
          <div className="feedback-section">
            <h4>AI 피드백</h4> {/* 제목 변경 */}
            <textarea
              className="feedback-textarea"
              value={afterText}
              readOnly
              placeholder="피드백 결과가 여기에 표시됩니다."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="action-btn" onClick={onClose}>
            닫기
          </button>
          <button className="action-btn primary" onClick={handleGetFeedback} disabled={isLoading}>
            {isLoading ? '분석 중...' : 'AI 피드백 받기'} {/* 버튼 텍스트 변경 */}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DockerfileFeedbackModal;