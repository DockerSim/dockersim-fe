import React from 'react';
import { createPortal } from 'react-dom';
import { Container } from '../../store/dockerStore';
import './ContainerDetailModal.css';
import './VolumeDetailModal.css'; // Reusing for connection list styles

interface ContainerDetailModalProps {
  container: Container | null;
  open: boolean;
  onClose: () => void;
  onAction: (action: 'start' | 'stop' | 'pause' | 'unpause' | 'rm', id: string) => void;
  onOpenNetworkSelectionModal: () => void;
  onDisconnectNetwork: (networkName: string, containerName: string) => void;
}

const ContainerDetailModal: React.FC<ContainerDetailModalProps> = ({ 
  container, 
  open, 
  onClose, 
  onAction,
  onOpenNetworkSelectionModal,
  onDisconnectNetwork
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

  const handleNetworkDisconnectClick = (networkName: string) => {
    onDisconnectNetwork(networkName, container.name);
    onClose(); // Close the modal after disconnecting
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
          </div>

          <div className="connections-section">
            <h4>연결된 네트워크</h4>
            {container.network && container.network.length > 0 ? (
              <ul className="connections-list">
                {container.network.map(netName => (
                  <li key={netName} className="connection-item">
                    <span>🌐 {netName}</span>
                    <button 
                      className="disconnect-btn" 
                      onClick={() => handleNetworkDisconnectClick(netName)}
                    >
                      연결 해제
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-connections">연결된 네트워크가 없습니다.</p>
            )}
          </div>
        </div>
        <div className="modal-actions">
            {container.status === 'running' && (
                <>
                  <button className="action-btn" onClick={() => handleActionAndClose('stop', container.id)}>⏹️ Stop</button>
                  <button className="action-btn" onClick={() => handleActionAndClose('pause', container.id)}>⏸️ Pause</button>
                </>
            )}
            {container.status === 'stopped' && (
              <>
                <button className="action-btn" onClick={() => handleActionAndClose('start', container.id)}>▶️ Start</button>
                <button className="action-btn" onClick={() => handleRemoveConfirm(container.id)}>🗑️ Remove</button>
              </>
            )}
            {container.status === 'paused' && (
                <>
                  <button className="action-btn" onClick={() => handleActionAndClose('unpause', container.id)}>⏯️ Unpause</button>
                  <button className="action-btn" onClick={() => handleRemoveConfirm(container.id)}>🗑️ Remove</button>
                </>
            )}
            <button className="action-btn" onClick={onOpenNetworkSelectionModal}>🌐 Add Network</button>
          </div>
      </div>
    </div>,
    document.body
  );
};

export default ContainerDetailModal;