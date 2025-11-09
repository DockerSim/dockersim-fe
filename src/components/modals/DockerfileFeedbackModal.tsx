import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './DockerfileFeedbackModal.css';
import { useDockerStore } from '../../store/dockerStore';

interface DockerfileFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const dummyDockerfile = `FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "app.py"]`;

const dummyFeedback = `FROM python:3.9-slim

# It's a good practice to create a non-root user
RUN useradd -m myuser
USER myuser

WORKDIR /app

# Copy only requirements to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]`;

const DockerfileFeedbackModal: React.FC<DockerfileFeedbackModalProps> = ({ open, onClose }) => {
  const [beforeText, setBeforeText] = useState(dummyDockerfile);
  const [afterText, setAfterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setBeforeText(dummyDockerfile);
      setAfterText('');
    }
  }, [open]);

  const handleGetFeedback = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAfterText(dummyFeedback);
      setIsLoading(false);
    }, 1000);
  };

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      {/* Applying width directly to the modal container */}
      <div className="modal-container" style={{ maxWidth: '90vw', width: '1600px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">📝</span>
            <span>Dockerfile 피드백</span>
          </div>
          {/* ✕ close button removed as requested */}
        </div>
        <div className="modal-content" style={{ display: 'flex', flexDirection: 'row' }}>
          <div className="feedback-section">
            <h4>Before</h4>
            <textarea
              className="feedback-textarea"
              value={beforeText}
              onChange={(e) => setBeforeText(e.target.value)}
              placeholder="Dockerfile 내용을 입력하세요..."
            />
          </div>
          <div className="feedback-section">
            <h4>After</h4>
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
            취소
          </button>
          <button className="action-btn primary" onClick={handleGetFeedback} disabled={isLoading}>
            {isLoading ? '분석 중...' : '피드백 받기'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DockerfileFeedbackModal;