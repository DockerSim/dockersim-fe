'use client'

import React, { useRef } from 'react';
import './ComposeFileModal.css';

interface ComposeFileModalProps {
  composeFileContent: string;
  open: boolean;
  onClose: () => void;
}

const ComposeFileModal: React.FC<ComposeFileModalProps> = ({ composeFileContent, open, onClose }) => {
  const contentRef = useRef<HTMLPreElement>(null);

  if (!open) return null;

  const handleDownload = () => {
    const blob = new Blob([composeFileContent], { type: 'text/yaml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'docker-compose.yml');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    if (!navigator.clipboard) {
      // 대체 방법 (for non-secure contexts)
      const textArea = document.createElement("textarea");
      textArea.value = composeFileContent;
      textArea.style.position = "fixed"; // 화면에 보이지 않게 처리
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('컴포즈 파일 내용이 클립보드에 복사되었습니다.');
      } catch (err) {
        console.error('대체 복사 방식 실패:', err);
      }
      document.body.removeChild(textArea);
      return;
    }

    // 최신 Clipboard API
    navigator.clipboard.writeText(composeFileContent)
      .then(() => alert('컴포즈 파일 내용이 클립보드에 복사되었습니다.'))
      .catch(err => console.error('복사 실패:', err));
  };

  return (
    <div className="compose-modal-backdrop" onClick={onClose}>
      <div className="compose-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="compose-modal-header">
          <h2>Docker Compose 파일</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="compose-modal-content">
          <pre ref={contentRef}>{composeFileContent}</pre>
        </div>
        <div className="compose-modal-actions">
          <button onClick={handleCopy} className="action-btn copy-btn">복사</button>
          <button onClick={handleDownload} className="action-btn download-btn">다운로드</button>
        </div>
      </div>
    </div>
  );
};

export default ComposeFileModal;