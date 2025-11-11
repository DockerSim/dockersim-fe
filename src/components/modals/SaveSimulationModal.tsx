'use client';

import React, { useState, useEffect } from 'react';
import { useDockerStore } from '@/store/dockerStore';
import './Modal.module.css'; // 일반적인 모달 스타일 재사용

interface SaveSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (simulationId: string) => void;
}

const SaveSimulationModal: React.FC<SaveSimulationModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
  const { simulationTitle, saveSimulation } = useDockerStore();
  
  const [title, setTitle] = useState(simulationTitle);
  const [shareStatus, setShareStatus] = useState<'READ' | 'WRITE' | 'PRIVATE'>('PRIVATE');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(simulationTitle);
      setError(null);
      setIsSaving(false);
      // 모달이 열릴 때 기본 공유 상태를 'PRIVATE'으로 설정
      setShareStatus('PRIVATE'); 
    }
  }, [isOpen, simulationTitle]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    console.log("SaveSimulationModal: Calling saveSimulation with title:", title, "and shareStatus (before API call):", shareStatus); // 로그 추가

    const newSimId = await saveSimulation(title, shareStatus);
    setIsSaving(false);

    if (newSimId) {
      onSaveSuccess(newSimId);
      onClose();
    } else {
      setError('저장에 실패했습니다. 콘솔 로그를 확인해주세요.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">시뮬레이션 저장</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="sim-title">제목</label>
            <input
              id="sim-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="시뮬레이션 제목을 입력하세요"
            />
          </div>
          <div className="form-group">
            <label>공유 설정</label>
            <div className="share-options">
              <button
                className={`share-option ${shareStatus === 'PRIVATE' ? 'active' : ''}`}
                onClick={() => setShareStatus('PRIVATE')}
              >
                비공개 (Private)
              </button>
              <button
                className={`share-option ${shareStatus === 'READ' ? 'active' : ''}`}
                onClick={() => setShareStatus('READ')}
              >
                읽기 전용 (Read-Only)
              </button>
              <button
                className={`share-option ${shareStatus === 'WRITE' ? 'active' : ''}`}
                onClick={() => setShareStatus('WRITE')}
              >
                편집 가능 (Write)
              </button>
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="action-btn" onClick={onClose} disabled={isSaving}>
            취소
          </button>
          <button className="action-btn primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSimulationModal;