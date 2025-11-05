'use client'

import React from 'react';
import './DockerfileFeedbackModal.css';

interface DockerfileFeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const DockerfileFeedbackModal: React.FC<DockerfileFeedbackModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  const beforeContent = `
# 기본 Dockerfile
FROM ubuntu:20.04

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y python3 python3-pip

RUN pip3 install -r requirements.txt

CMD ["python3", "app.py"]
  `;

  const afterContent = `
# 추천 Dockerfile (Multi-stage build)
FROM python:3.9-slim as builder

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.9-slim

WORKDIR /app

COPY --from=builder /app /app

COPY . .

CMD ["python", "app.py"]
  `;

  return (
    <div className="dockerfile-modal-backdrop" onClick={onClose}>
      <div className="dockerfile-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="dockerfile-modal-header">
          <h2>Dockerfile 피드백</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="dockerfile-modal-content">
          <div className="feedback-column">
            <h3>기본 Dockerfile (Before)</h3>
            <pre>{beforeContent}</pre>
          </div>
          <div className="feedback-column">
            <h3>추천 Dockerfile (After)</h3>
            <pre>{afterContent}</pre>
          </div>
        </div>
        <div className="dockerfile-modal-footer">
          <button onClick={onClose} className="action-btn">닫기</button>
        </div>
      </div>
    </div>
  );
};

export default DockerfileFeedbackModal;