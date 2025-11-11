import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/store/authStore'; // useAuthStore 임포트
import './ComposeFileModal.css';

// 백엔드 API 응답 래퍼 타입
interface ApiResponse<T> {
  success: boolean;
  code: string;
  errorMessage: string;
  data: T;
}

// docker-compose.yml 생성 응답 타입
interface ComposeGenerationResponse {
  simulationPublicId: string;
  yamlContent: string;
  errorMessage?: string;
}

interface ComposeFileModalProps {
  open: boolean;
  onClose: () => void;
  simulationPublicId: string | null; // 시뮬레이션 ID를 prop으로 받음
}

const API_BASE_URL = 'http://localhost:8080'; // TODO: 환경 변수로 분리

const ComposeFileModal: React.FC<ComposeFileModalProps> = ({ open, onClose, simulationPublicId }) => {
  const { accessToken } = useAuthStore(); // accessToken 가져오기
  const [composeFileContent, setComposeFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (simulationPublicId) {
        generateComposeFile(simulationPublicId);
      } else {
        setError('시뮬레이션을 먼저 저장해야 docker-compose.yml 파일을 생성할 수 있습니다.');
        setComposeFileContent(''); // 내용 초기화
      }
    }
  }, [open, simulationPublicId, accessToken]); // accessToken을 의존성 배열에 추가

  const generateComposeFile = async (simId: string) => {
    setIsLoading(true);
    setError(null);
    setComposeFileContent('');

    if (!accessToken) {
      setError('인증 정보가 없어 docker-compose.yml 파일을 생성할 수 없습니다. 다시 로그인해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/simulations/${simId}/compose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` // Authorization 헤더 추가
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.errorMessage || `서버 응답 오류: ${response.status}`);
      }

      const result: ApiResponse<ComposeGenerationResponse> = await response.json();

      if (result.success && result.data) {
        setComposeFileContent(result.data.yamlContent);
      } else {
        throw new Error(result.errorMessage || 'docker-compose.yml 파일을 생성하지 못했습니다.');
      }
    } catch (e: any) {
      setError(e.message);
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

  const handleDownload = () => {
    if (!composeFileContent) return;
    const blob = new Blob([composeFileContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'docker-compose.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!composeFileContent) return;
    navigator.clipboard.writeText(composeFileContent).then(() => {
      alert('클립보드에 복사되었습니다!');
    }, (err) => {
      console.error('복사 실패: ', err);
    });
  };

  const highlightedContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('#')) {
        return <div key={index}><span className="comment">{line}</span></div>;
      }
      const parts = line.split(/:(.*)/s);
      if (parts.length > 1) {
        const key = parts[0];
        const value = parts[1];
        return (
          <div key={index}>
            <span className="key">{key}:</span>
            <span className="string">{value}</span>
          </div>
        );
      }
      return <div key={index}>{line}</div>;
    });
  };

  const renderContent = () => {
    if (!simulationPublicId) {
      return (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>docker-compose.yml 파일을 생성 중입니다...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="error-container">
          <p>오류가 발생했습니다: {error}</p>
          <button onClick={() => simulationPublicId && generateComposeFile(simulationPublicId)}>재시도</button>
        </div>
      );
    }
    if (composeFileContent) {
      return (
        <pre className="compose-file-content">
          {highlightedContent(composeFileContent)}
        </pre>
      );
    }
    return null;
  };

  const isActionDisabled = !composeFileContent || isLoading || !simulationPublicId;

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">📄</span>
            <span>docker-compose.yml</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-content">
          {renderContent()}
        </div>
        <div className="modal-footer">
          <button className="action-btn" onClick={handleCopy} disabled={isActionDisabled}>
            📋 복사
          </button>
          <button className="action-btn primary" onClick={handleDownload} disabled={isActionDisabled}>
            💾 다운로드
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ComposeFileModal;