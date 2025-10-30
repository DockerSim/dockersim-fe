'use client'

import React from 'react';
import { Network } from '../../store/dockerStore';
import './NetworkDetailModal.css'; // 새로운 CSS 파일 임포트

interface NetworkDetailModalProps {
  network: Network | null;
  open: boolean;
  onClose: () => void;
}

const NetworkDetailModal: React.FC<NetworkDetailModalProps> = ({ network, open, onClose }) => {
  if (!open || !network) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="network-modal-backdrop" onClick={handleBackdropClick}>
      <div className="network-modal-container">
        {/* 헤더 */}
        <div className="network-modal-header">
          <div className="network-modal-title">
            <span>🌐</span>
            <span>{network.name}</span>
          </div>
          <button className="network-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* 기본 정보 */}
        <div className="network-modal-content">
          <div className="network-info-section">
            <h4>기본 정보</h4>
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">네트워크 ID</span>
                <span className="info-value">{network.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">드라이버</span>
                <span className="info-value">{network.driver}</span>
              </div>
              <div className="info-row">
                <span className="info-label">스코프</span>
                <span className="info-value">{network.scope}</span>
              </div>
              <div className="info-row">
                <span className="info-label">생성 시간</span>
                <span className="info-value">{new Date(network.createdAt).toLocaleString('ko-KR')}</span>
              </div>
              {network.subnet && (
                <div className="info-row">
                  <span className="info-label">서브넷</span>
                  <span className="info-value">{network.subnet}</span>
                </div>
              )}
              {network.gateway && (
                <div className="info-row">
                  <span className="info-label">게이트웨이</span>
                  <span className="info-value">{network.gateway}</span>
                </div>
              )}
            </div>
          </div>

          {/* 연결된 컨테이너 정보 */}
          <div className="network-info-section">
            <h4>연결된 컨테이너 ({network.containers.length})</h4>
            {network.containers && network.containers.length > 0 ? (
              <div className="containers-list">
                {network.containers.map((container) => (
                  <div key={container.id} className="container-item">
                    <span className="container-icon">📦</span>
                    <span className="container-name">{container.name}</span>
                    <span className="container-id">({container.id.substring(0, 12)})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-list-message">연결된 컨테이너가 없습니다.</div>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="network-modal-actions">
          <button 
            className="action-btn close-btn"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkDetailModal;