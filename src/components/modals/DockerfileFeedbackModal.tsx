import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './DockerfileFeedbackModal.css';
import axiosInstance from '../../api/axiosInstance';

interface DockerfileFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const DockerfileFeedbackModal: React.FC<DockerfileFeedbackModalProps> = ({ open, onClose }) => {
  const [dockerfileContent, setDockerfileContent] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // 모달이 열릴 때 샘플 Dockerfile 제공
      const sampleDockerfile = `# Dockerfile 예시
# 아래 내용을 수정하거나 새로 작성해보세요

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]`;

      setDockerfileContent(sampleDockerfile);
      setFeedbackContent('');
    }
  }, [open]);

  const handleGetFeedback = async () => {
    if (!dockerfileContent.trim()) {
      alert('Dockerfile 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setFeedbackContent('🤖 Gemini AI가 Dockerfile을 분석 중입니다...\n\n이 과정은 몇 초 정도 소요될 수 있습니다.');

    try {
      // DockerFileController의 /api/dockerfiles/feedback 호출
      const response = await axiosInstance.post('/dockerfiles/feedback', {
        dockerfileContent: dockerfileContent
      });

      const result = response.data;

      // 백엔드 응답 형식: { success, data: { original, optimized, analysisMethod, processingTimeMs, errorMessage }, errorMessage }
      if (result.success && result.data) {
        const feedbackData = result.data;

        if (feedbackData.errorMessage) {
          setFeedbackContent(`❌ 오류 발생:\n${feedbackData.errorMessage}`);
          return;
        }

        let feedbackText = '✨ Gemini AI 분석 결과\n\n';

        if (feedbackData.optimized) {
          feedbackText += `📋 최적화된 Dockerfile:\n\n${feedbackData.optimized}\n\n`;
        }

        if (feedbackData.analysisMethod) {
          feedbackText += `🔍 분석 방법: ${feedbackData.analysisMethod}\n`;
        }

        if (feedbackData.processingTimeMs) {
          feedbackText += `⏱️ 처리 시간: ${feedbackData.processingTimeMs}ms\n`;
        }

        setFeedbackContent(feedbackText || '피드백을 받아오지 못했습니다.');
      } else {
        throw new Error(result.errorMessage || '피드백을 받아오지 못했습니다.');
      }
    } catch (error: any) {
      console.error('Dockerfile 피드백 요청 실패:', error);
      const errorMessage = error.response?.data?.errorMessage || error.message || '알 수 없는 오류가 발생했습니다.';
      setFeedbackContent(`❌ 피드백 요청 중 오류가 발생했습니다:\n\n${errorMessage}`);
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
            <h4>Dockerfile 작성</h4>
            <textarea
              className="feedback-textarea"
              value={dockerfileContent}
              onChange={(e) => setDockerfileContent(e.target.value)}
              placeholder="Dockerfile을 작성해주세요. 예: FROM, RUN, COPY, CMD 등"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <div className="feedback-section">
            <h4>Gemini AI 피드백 및 최적화</h4>
            <textarea
              className="feedback-textarea"
              value={feedbackContent}
              readOnly
              placeholder="AI 피드백 받기 버튼을 클릭하면 Gemini AI가 Dockerfile을 분석하고 최적화된 버전을 제공합니다."
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="action-btn" onClick={onClose}>
            닫기
          </button>
          <button className="action-btn primary" onClick={handleGetFeedback} disabled={isLoading || !dockerfileContent.trim()}>
            {isLoading ? '🤖 AI 분석 중...' : '🚀 AI 피드백 받기'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DockerfileFeedbackModal;