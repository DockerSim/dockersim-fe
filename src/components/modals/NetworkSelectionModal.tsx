import React from 'react';
import { createPortal } from 'react-dom';
import { Network } from '../../store/dockerStore';
import './Modal.module.css';

interface NetworkSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (networkId: string, networkName: string) => void;
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
  if (!isOpen) return null;

  const availableNetworks = allNetworks.filter(
    (net) => !connectedNetworks.includes(net.id) && !connectedNetworks.includes(net.name)
  );

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">네트워크에 연결</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-content">
          {availableNetworks.length > 0 ? (
            <ul className="network-list">
              {availableNetworks.map((network) => (
                <li key={network.id} className="network-list-item">
                  <span>{network.name}</span>
                  <button
                    className="connect-btn"
                    onClick={() => onSelect(network.id, network.name)}
                  >
                    연결
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>연결할 수 있는 네트워크가 없습니다.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NetworkSelectionModal;