import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ComposeFileModal.css';
import { useDockerStore } from '../../store/dockerStore'; // dockerStore 임포트

interface ComposeFileModalProps {
  open: boolean;
  onClose: () => void;
  simulationPublicId: string | null; // 시뮬레이션 ID를 prop으로 받음 (사용하지 않지만 호환성 유지)
}

const ComposeFileModal: React.FC<ComposeFileModalProps> = ({ open, onClose }) => {
  const { generateComposeFile } = useDockerStore(); // generateComposeFile 가져오기
  const [composeFileContent, setComposeFileContent] = useState<string>('');

  useEffect(() => {
    if (open) {
      const content = generateComposeFile(); // Docker Compose 파일 생성
      setComposeFileContent(content); // 생성된 내용으로 설정
    }
  }, [open, generateComposeFile]);

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
    if (composeFileContent) {
      return (
        <pre className="compose-file-content">
          {highlightedContent(composeFileContent)}
        </pre>
      );
    }
    return (
      <div className="empty-state">
        <p>Docker Compose 파일 내용이 없습니다.</p>
      </div>
    );
  };

  const isActionDisabled = !composeFileContent;

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