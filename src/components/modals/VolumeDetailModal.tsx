'use client'

import React from 'react'
import { Volume } from '../../store/dockerStore'
import './VolumeDetailModal.css'

interface VolumeDetailModalProps {
  volume: Volume | null
  open: boolean
  onClose: () => void
  onRemove?: (volumeId: string) => void
}

const VolumeDetailModal: React.FC<VolumeDetailModalProps> = ({ volume, open, onClose, onRemove }) => {
  if (!open || !volume) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getStatusIcon = () => {
    return volume.connectedContainers.length > 0 ? '🔗' : '🔌'
  }

  const getStatusText = () => {
    return volume.connectedContainers.length > 0 ? '연결됨' : '미연결'
  }

  return (
    <div className="volume-modal-backdrop" onClick={handleBackdropClick}>
      <div className="volume-modal-container">
        {/* 헤더 */}
        <div className="volume-modal-header">
          <div className="volume-modal-title">
            <span>💾</span>
            <span>{volume.name}</span>
            <span className="status-badge">
              {getStatusIcon()} {getStatusText()} ({volume.connectedContainers.length}개)
            </span>
          </div>
          <button className="volume-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* 기본 정보 */}
        <div className="volume-modal-content">
          <div className="volume-info-section">
            <h4>기본 정보</h4>
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">볼륨 ID</span>
                <span className="info-value">{volume.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">마운트 경로</span>
                <span className="info-value">{volume.mountPath}</span>
              </div>
              {volume.containerPath && (
                <div className="info-row">
                  <span className="info-label">컨테이너 경로</span>
                  <span className="info-value">{volume.containerPath}</span>
                </div>
              )}
              {volume.networkId && (
                <div className="info-row">
                  <span className="info-label">네트워크</span>
                  <span className="info-value">{volume.networkId}</span>
                </div>
              )}
            </div>
          </div>

          {/* 연결된 컨테이너 정보 */}
          {volume.connectedContainers.length > 0 && (
            <div className="volume-info-section">
              <h4>연결된 컨테이너</h4>
              <div className="containers-list">
                {volume.connectedContainers.map((containerId) => (
                  <div key={containerId} className="container-item">
                    <span className="container-icon">📦</span>
                    <span className="container-name">{containerId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="volume-modal-actions">
          <button 
            className="action-btn remove-btn"
            onClick={() => {
              if (confirm(`볼륨 "${volume.name}"를 삭제하시겠습니까?`)) {
                onRemove && onRemove(volume.id)
                onClose()
              }
            }}
          >
            🗑️ 삭제
          </button>
        </div>
      </div>
    </div>
  )
}

export default VolumeDetailModal 