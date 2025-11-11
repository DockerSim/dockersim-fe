'use client';

import React, { useState, useEffect } from 'react';
import { simulationApi } from '@/api/simulation';
import { Collaborator } from '@/types/simulation';
import './Modal.module.css';
import './ShareModal.css';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, simulationId }) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const fetchCollaborators = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentCollaborators = await simulationApi.getCollaborators(simulationId);
      setCollaborators(currentCollaborators);
    } catch (err) {
      setError('협업자 목록을 불러오는 데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
    }
  }, [isOpen, simulationId]);

  const handleInvite = async () => {
    if (!inviteEmail) {
      alert('초대할 사용자의 이메일을 입력해주세요.');
      return;
    }
    try {
      const newCollaborator = await simulationApi.inviteCollaborator(simulationId, inviteEmail);
      setCollaborators([...collaborators, newCollaborator]);
      setInviteEmail('');
      alert('초대가 완료되었습니다.');
    } catch (err) {
      alert('초대에 실패했습니다. 이메일을 확인하거나 이미 초대된 사용자인지 확인해주세요.');
      console.error(err);
    }
  };

  const handleRemove = async (collaboratorId: string) => {
    if (confirm('정말로 이 협업자를 제거하시겠습니까?')) {
      try {
        await simulationApi.removeCollaborator(simulationId, collaboratorId);
        setCollaborators(collaborators.filter(c => c.userPublicId !== collaboratorId));
        alert('협업자가 제거되었습니다.');
      } catch (err) {
        alert('제거에 실패했습니다.');
        console.error(err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">공유 및 협업자 관리</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <div className="invite-section">
            <h3>협업자 초대</h3>
            <div className="invite-form">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="초대할 사용자의 GitHub 이메일"
              />
              <button onClick={handleInvite} className="action-btn primary">초대</button>
            </div>
          </div>
          
          <div className="collaborator-list-section">
            <h3>현재 협업자</h3>
            {isLoading ? (
              <p>로딩 중...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : (
              <ul className="collaborator-list">
                {collaborators.length > 0 ? (
                  collaborators.map(c => (
                    <li key={c.userPublicId} className="collaborator-item">
                      <div className="collaborator-info">
                        <span className="collaborator-name">{c.name}</span>
                        <span className="collaborator-email">{c.email}</span>
                      </div>
                      <button onClick={() => handleRemove(c.userPublicId)} className="remove-btn">제거</button>
                    </li>
                  ))
                ) : (
                  <p>아직 협업자가 없습니다.</p>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
