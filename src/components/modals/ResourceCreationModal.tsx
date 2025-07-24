import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Network } from '../../store/dockerStore';

export interface ResourceCreationData {
  name: string;
  image?: string; // 컨테이너 생성 시에만 필요
  networkId: string;
}

interface ResourceCreationModalProps {
  type: 'container' | 'volume';
  networks: Network[];
  open: boolean;
  onConfirm: (data: ResourceCreationData) => void;
  onClose: () => void;
}

const ResourceCreationModal: React.FC<ResourceCreationModalProps> = ({
  type,
  networks,
  open,
  onConfirm,
  onClose
}) => {
  const [resourceName, setResourceName] = useState('');
  const [imageName, setImageName] = useState('');
  const [selectedNetworkId, setSelectedNetworkId] = useState('');

  if (!open) return null;

  const handleConfirm = () => {
    if (!resourceName || !selectedNetworkId || (type === 'container' && !imageName)) {
      return;
    }

    const data: ResourceCreationData = {
      name: resourceName,
      networkId: selectedNetworkId,
    };

    if (type === 'container') {
      data.image = imageName;
    }

    onConfirm(data);
    handleClose();
  };

  const handleClose = () => {
    setResourceName('');
    setImageName('');
    setSelectedNetworkId('');
    onClose();
  };

  const isFormValid = resourceName && selectedNetworkId && (type === 'volume' || imageName);

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
        minWidth: 450,
        maxWidth: 500,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
          {type === 'container' ? '새 컨테이너 생성' : '새 볼륨 생성'}
        </h2>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
            네트워크 선택
          </label>
          <select
            value={selectedNetworkId}
            onChange={e => setSelectedNetworkId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
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

        {type === 'container' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
              이미지 이름
            </label>
            <input
              type="text"
              value={imageName}
              onChange={e => setImageName(e.target.value)}
              placeholder="예: nginx, mysql:8.0"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
            {type === 'container' ? '컨테이너' : '볼륨'} 이름
          </label>
          <input
            type="text"
            value={resourceName}
            onChange={e => setResourceName(e.target.value)}
            placeholder={type === 'container' ? '컨테이너 이름 (선택사항)' : '볼륨 이름을 입력하세요'}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: 14
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: 6,
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isFormValid}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 6,
              background: isFormValid ? '#007bff' : '#ccc',
              color: '#fff',
              cursor: isFormValid ? 'pointer' : 'not-allowed',
              fontSize: 14
            }}
          >
            생성
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ResourceCreationModal; 