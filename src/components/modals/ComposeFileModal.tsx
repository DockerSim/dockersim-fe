import React from 'react';
import { createPortal } from 'react-dom';
import './ComposeFileModal.css';

interface ComposeFileModalProps {
  open: boolean;
  onClose: () => void;
  composeFileContent: string;
}

const ComposeFileModal: React.FC<ComposeFileModalProps> = ({ open, onClose, composeFileContent }) => {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = () => {
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
    navigator.clipboard.writeText(composeFileContent).then(() => {
      alert('Copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const highlightedContent = () => {
    return composeFileContent.split('\n').map((line, index) => {
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
          <pre className="compose-file-content">
            {highlightedContent()}
          </pre>
        </div>
        <div className="modal-footer">
          <button className="action-btn" onClick={handleCopy}>
            📋 Copy
          </button>
          <button className="action-btn primary" onClick={handleDownload}>
            💾 Download
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ComposeFileModal;