import React from 'react';
import { createPortal } from 'react-dom';
import { Container } from '../../store/dockerStore';
import './ContainerDetailModal.css';

interface ContainerDetailModalProps {
  container: Container | null;
  open: boolean;
  onClose: () => void;
  onAction: (action: 'start' | 'stop' | 'pause' | 'unpause' | 'rm', id: string) => void;
  onOpenNetworkSelectionModal: () => void;
}

const ContainerDetailModal: React.FC<ContainerDetailModalProps> = ({ 
  container, 
  open, 
  onClose, 
  onAction,
  onOpenNetworkSelectionModal
}) => {
  if (!open || !container) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleActionAndClose = (action: 'start' | 'stop' | 'pause' | 'unpause' | 'rm', id: string) => {
    onAction(action, id);
    onClose();
  };

  const handleRemoveConfirm = (id: string) => {
    if (window.confirm('정말로 삭제하시겠습니까?')) {
      handleActionAndClose('rm', id);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">📦</span>
            <span>{container.name}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-content">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{container.id.substring(0, 12)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Image:</span>
              <span className="detail-value">{container.image}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`status-badge ${container.status}`}>{container.status}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Network:</span>
              <span className="detail-value">{Array.isArray(container.network) ? container.network.join(', ') : container.network}</span>
            </div>
          </div>
        </div>
        <div className="modal-actions">
            {container.status === 'running' && (
                <>
                  <button
                      className="action-btn"
                      onClick={() => handleActionAndClose('stop', container.id)}
                      style={{
                        backgroundColor: '#f1c40f',
                        color: '#111',
                        cursor: 'pointer',
                      }}
                  >
                    ⏹️ Stop
                  </button>

                  <button
                      className="action-btn"
                      onClick={() => handleActionAndClose('pause', container.id)}
                      style={{
                        backgroundColor: '#f1c40f',
                        color: '#111',
                        cursor: 'pointer',
                      }}
                  >
                    ⏸️ Pause
                  </button>
                </>
            )}
            {container.status === 'stopped' && (
              <>
                <button
                    className="action-btn"
                    onClick={() => handleActionAndClose('start', container.id)}
                    style={{
                      backgroundColor: '#f1c40f',
                      color: '#111',
                      cursor: 'pointer',
                    }}
                >
                  ▶️ Start
                </button>
                <button
                    className="action-btn"
                    onClick={() => handleActionAndClose('rm', container.id)}
                    style={{
                      backgroundColor: '#f1c40f',
                      color: '#111',
                      cursor: 'pointer',
                    }}
                >
                  🗑️ Remove
                </button>
              </>
            )}
            {container.status === 'paused' && (
                <>
                  <button
                      className="action-btn"
                      onClick={() => handleActionAndClose('unpause', container.id)}
                      style={{
                        backgroundColor: '#f1c40f',
                        color: '#111',
                        cursor: 'pointer',
                      }}
                  >
                    ⏯️ Unpause
                  </button>
                  <button
                      className="action-btn"
                      onClick={() => handleRemoveConfirm(container.id)}
                      style={{
                        backgroundColor: '#f1c40f',
                        color: '#111',
                        cursor: 'pointer',
                      }}
                  >
                    🗑️ Remove
                  </button>
                </>
            )}
            <button
                className="action-btn"
                onClick={onOpenNetworkSelectionModal}
                style={{
                  backgroundColor: '#f1c40f',
                  color: '#111',
                  cursor: 'pointer',
                }}
            >
              🌐 Add Network
            </button>
          </div>
      </div>
    </div>,
    document.body
  );
};

export default ContainerDetailModal;