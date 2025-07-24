import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Network } from '../../store/dockerStore';

interface NetworkSelectionModalProps {
  networks: Network[];
  open: boolean;
  title: string;
  onSelect: (networkId: string) => void;
  onClose: () => void;
}

const NetworkSelectionModal: React.FC<NetworkSelectionModalProps> = ({ 
  networks, 
  open, 
  title, 
  onSelect, 
  onClose 
}) => {
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('');

  if (!open) return null;

  const handleConfirm = () => {
    if (selectedNetworkId) {
      onSelect(selectedNetworkId);
      setSelectedNetworkId('');
    }
  };

  const handleCancel = () => {
    setSelectedNetworkId('');
    onClose();
  };

  return createPortal(
    <div className="modal-backdrop" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'rgba(0,0,0,0.3)', 
      zIndex: 9999, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div className="modal-content" style={{ 
        background: '#fff', 
        borderRadius: 12, 
        padding: 32, 
        minWidth: 400, 
        maxWidth: 500,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)' 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{title}</h2>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
            네트워크 선택
          </label>
          <select 
            value={selectedNetworkId} 
            onChange={e => setSelectedNetworkId(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: 14
            }}
          >
            <option value="">네트워크를 선택하세요</option>
            {networks.map(network => (
              <option key={network.id} value={network.id}>
                {network.name} ({network.containers.length}개 컨테이너)
              </option>
            ))}
          </select>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 12, 
          justifyContent: 'flex-end' 
        }}>
          <button 
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: 6,
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedNetworkId}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: selectedNetworkId ? '#007bff' : '#ccc',
              color: '#fff',
              cursor: selectedNetworkId ? 'pointer' : 'not-allowed'
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NetworkSelectionModal; 