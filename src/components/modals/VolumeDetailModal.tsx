import React from 'react';
import { createPortal } from 'react-dom';
import { useDockerStore, Volume } from '../../store/dockerStore';
import './ContainerDetailModal.css'; // Reusing the same base style
import './VolumeDetailModal.css';   // Additional specific styles

interface VolumeDetailModalProps {
  volume: Volume | null;
  open: boolean;
  onClose: () => void;
  onRemove: (volumeName: string) => void;
  onDisconnect: (volumeName: string, containerName: string) => void;
}

const VolumeDetailModal: React.FC<VolumeDetailModalProps> = ({ 
  volume, 
  open, 
  onClose, 
  onRemove, 
  onDisconnect 
}) => {
  const { containers } = useDockerStore();

  if (!open || !volume) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // This new handler ensures the modal closes after the action
  const handleDisconnectClick = (volumeName: string, containerName: string) => {
    // 1. Perform the disconnect action by calling the prop from the parent
    onDisconnect(volumeName, containerName);
    // 2. Explicitly call the onClose prop to ensure the modal closes
    onClose();
  };
  
  const handleRemoveClick = (name: string) => {
    onRemove(name);
    onClose();
  };

  const connectedContainersList = containers.filter(c => 
    volume.connectedContainers.includes(c.id)
  );
  const isVolumeInUse = connectedContainersList.length > 0;

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">💾</span>
            <span>{volume.name}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-content">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{volume.id.substring(0, 12)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Driver:</span>
              <span className="detail-value">{volume.driver}</span>
            </div>
          </div>

          <div className="connections-section">
            <h4>연결된 컨테이너</h4>
            {isVolumeInUse ? (
              <ul className="connections-list">
                {connectedContainersList.map(c => (
                  <li key={c.id} className="connection-item">
                    <span>📦 {c.name}</span>
                    <button 
                      className="disconnect-btn" 
                      onClick={() => handleDisconnectClick(volume.name, c.name)}
                    >
                      연결 해제
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-connections">연결된 컨테이너가 없습니다.</p>
            )}
          </div>
        </div>
        
        <div className="modal-actions">
          {!isVolumeInUse && (
            <button
              className="action-btn"
              onClick={() => handleRemoveClick(volume.name)}
              style={{ backgroundColor: '#e74c3c', color: 'black' }}
            >
              🗑️ Remove
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default VolumeDetailModal;