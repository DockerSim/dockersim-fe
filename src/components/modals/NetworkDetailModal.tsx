'use client'

import React from 'react';
import { Network } from '../../store/dockerStore';

interface NetworkDetailModalProps {
  network: Network | null;
  open: boolean;
  onClose: () => void;
}

const NetworkDetailModal: React.FC<NetworkDetailModalProps> = ({ network, open, onClose }) => {
  if (!open || !network) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Network Details: {network.name}</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="modal-body">
          <pre>{JSON.stringify(network, (key, value) => key === 'containers' ? undefined : value, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default NetworkDetailModal;