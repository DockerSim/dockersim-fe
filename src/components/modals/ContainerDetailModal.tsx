'use client'

import React from 'react'
import { Container } from '../../store/dockerStore'
import './ContainerDetailModal.css'

interface ContainerDetailModalProps {
  container: Container | null
  open: boolean
  onClose: () => void
  onStart?: (containerId: string) => void
  onStop?: (containerId: string) => void
  onPause?: (containerId: string) => void
  onRemove?: (containerId: string) => void
}

const ContainerDetailModal: React.FC<ContainerDetailModalProps> = ({ 
  container, 
  open, 
  onClose, 
  onStart, 
  onStop, 
  onPause, 
  onRemove 
}) => {
  if (!open || !container) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '🟢'
      case 'stopped': return '🔴'
      case 'paused': return '🟡'
      default: return '⚪'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '실행 중'
      case 'stopped': return '중지됨'
      case 'paused': return '일시정지'
      default: return '알 수 없음'
    }
  }

  return (
    <div className="container-modal-backdrop" onClick={handleBackdropClick}>
      <div className="container-modal-container">
        {/* 헤더 */}
        <div className="container-modal-header">
          <div className="container-modal-title">
            <span>📦</span>
            <span>{container.name}</span>
            <span className="status-badge">
              {getStatusIcon(container.status)} {getStatusText(container.status)}
            </span>
          </div>
          <button className="container-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* 기본 정보 */}
        <div className="container-modal-content">
          <div className="container-info-section">
            <h4>기본 정보</h4>
            <div className="info-grid">
              <div className="info-row">
                <span className="info-label">컨테이너 ID</span>
                <span className="info-value">{container.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">이미지</span>
                <span className="info-value">{container.image}</span>
              </div>
              <div className="info-row">
                <span className="info-label">네트워크</span>
                <span className="info-value">{container.network}</span>
              </div>
              <div className="info-row">
                <span className="info-label">생성 시간</span>
                <span className="info-value">{container.created.toLocaleString('ko-KR')}</span>
              </div>
            </div>
          </div>

          {/* 포트 정보 */}
          {container.ports && container.ports.length > 0 && (
            <div className="container-info-section">
              <h4>포트 매핑</h4>
              <div className="ports-list">
                {container.ports.map((port, index) => (
                  <span key={index} className="port-item">
                    {port.hostPort}:{port.containerPort}/{port.protocol}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 볼륨 정보 */}
          {container.volumes && container.volumes.length > 0 && (
            <div className="container-info-section">
              <h4>연결된 볼륨</h4>
              <div className="volumes-list">
                {container.volumes.map((volume) => (
                  <div key={volume.id} className="volume-item">
                    <span className="volume-name">{volume.name}</span>
                    <span className="volume-path">{volume.mountPath}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="container-modal-actions">
          {container.status === 'stopped' && (
            <button 
              className="action-btn start-btn"
              onClick={() => onStart && onStart(container.id)}
            >
              ▶️ 시작
            </button>
          )}
          
          {container.status === 'running' && (
            <>
              <button 
                className="action-btn stop-btn"
                onClick={() => onStop && onStop(container.id)}
              >
                ⏹️ 중지
              </button>
              <button 
                className="action-btn pause-btn"
                onClick={() => onPause && onPause(container.id)}
              >
                ⏸️ 일시정지
              </button>
            </>
          )}
          
          {container.status === 'paused' && (
            <button 
              className="action-btn start-btn"
              onClick={() => onStart && onStart(container.id)}
            >
              ▶️ 재시작
            </button>
          )}
          
          <button 
            className="action-btn remove-btn"
            onClick={() => {
              if (confirm(`컨테이너 "${container.name}"를 삭제하시겠습니까?`)) {
                onRemove && onRemove(container.id)
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

export default ContainerDetailModal 