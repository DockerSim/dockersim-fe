import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Container, Volume } from '../store/dockerStore';
import './VolumeConnectModal.css';

interface VolumeConnectModalProps {
  containers: Container[];
  volumes: Volume[];
  open: boolean;
  onConnect: (volumeId: string, containerIds: string[], mountPath: string) => void;
  onClose: () => void;
}

const VolumeConnectModal: React.FC<VolumeConnectModalProps> = ({ containers, volumes, open, onConnect, onClose }) => {
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');
  const [selectedContainerIds, setSelectedContainerIds] = useState<string[]>([]);
  const [mountPath, setMountPath] = useState<string>('/data');

  useEffect(() => {
    if (open) {
      setSelectedVolumeId('');
      setSelectedContainerIds([]);
      setMountPath('/data');
    }
  }, [open]);

  if (!open) return null;

  const handleConnect = () => {
    if (selectedVolumeId && selectedContainerIds.length > 0 && mountPath) {
      onConnect(selectedVolumeId, selectedContainerIds, mountPath);
      onClose();
    }
  };

  const handleContainerSelect = (containerId: string) => {
    setSelectedContainerIds(prev =>
      prev.includes(containerId)
        ? prev.filter(id => id !== containerId)
        : [...prev, containerId]
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const availableVolumes = volumes.filter(v => !v.connectedContainers || v.connectedContainers.length === 0);
  const isFormValid = selectedVolumeId && selectedContainerIds.length > 0 && mountPath.trim() !== '';

  return createPortal(
    <div className="volume-connect-modal-backdrop" onClick={handleBackdropClick}>
      <div className="volume-connect-modal-container">
        <div className="volume-connect-modal-header">
          <h2 className="volume-connect-modal-title">
            <span className="btn-icon">💾</span>
            볼륨 연결
          </h2>
          <button className="volume-connect-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="volume-connect-form">
          <div className="form-group">
            <label>볼륨 선택</label>
            <select value={selectedVolumeId} onChange={e => setSelectedVolumeId(e.target.value)} className="form-select">
              <option value="">연결할 볼륨을 선택하세요</option>
              {availableVolumes.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>컨테이너 선택</label>
            <div className="container-selection-list">
              {containers.map(c => (
                <div key={c.id} className="list-item-selectable" onClick={() => handleContainerSelect(c.id)}>
                  <input
                    type="checkbox"
                    checked={selectedContainerIds.includes(c.id)}
                    onChange={() => handleContainerSelect(c.id)}
                    className="item-checkbox"
                  />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="volume-connect-actions">
          <button onClick={onClose} className="action-btn secondary">취소</button>
          <button onClick={handleConnect} disabled={!isFormValid} className={`action-btn primary ${!isFormValid ? 'disabled' : ''}`}>
            <span className="btn-icon">🔗</span>
            연결
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VolumeConnectModal;