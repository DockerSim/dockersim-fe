import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Network } from '../../store/dockerStore';
import './Modal.module.css'; 
import './NetworkSelectionModal.css';

interface NetworkSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (networkIds: string[]) => void;
  allNetworks: Network[];
  connectedNetworks: string[];
}

const NetworkSelectionModal: React.FC<NetworkSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  allNetworks,
  connectedNetworks,
}) => {
  const [availableNetworks, setAvailableNetworks] = useState<Network[]>([]);
  const [selectedNetworkIds, setSelectedNetworkIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const filteredNetworks = allNetworks.filter(
        (net) => !connectedNetworks.includes(net.id) && !connectedNetworks.includes(net.name)
      );
      setAvailableNetworks(filteredNetworks);
      setSelectedNetworkIds([]); // Reset selection when modal opens
    }
  }, [isOpen, allNetworks, connectedNetworks]);

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkIds(prev => 
      prev.includes(networkId) 
        ? prev.filter(id => id !== networkId)
        : [...prev, networkId]
    );
  };

  const handleConfirm = () => {
    if (selectedNetworkIds.length > 0) {
      onSelect(selectedNetworkIds);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">🌐</span>
            <span>네트워크에 연결</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-content">
          {availableNetworks.length > 0 ? (
            <ul className="network-list">
              {availableNetworks.map((network) => (
                <li key={network.id} className="network-list-item-selectable" onClick={() => handleNetworkSelect(network.id)}>
                  <input
                    type="checkbox"
                    checked={selectedNetworkIds.includes(network.id)}
                    onChange={() => handleNetworkSelect(network.id)}
                    className="network-checkbox"
                  />
                  <span>{network.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">연결할 수 있는 네트워크가 없습니다.</p>
          )}
        </div>
        <div className="modal-actions">
          <button className="action-btn" onClick={onClose}>
            취소
          </button>
          <button
            className="action-btn primary"
            onClick={handleConfirm}
            disabled={selectedNetworkIds.length === 0}
          >
            연결
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NetworkSelectionModal;