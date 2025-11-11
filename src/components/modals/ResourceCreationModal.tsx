import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Network, useDockerStore } from '../../store/dockerStore';
import ImageModal from './ImageModal';
import './ResourceCreationModal.css';

export interface ResourceCreationData {
  name: string;
  image?: string;
  networkIds?: string[];
  ports?: Array<{
    hostPort: number;
    containerPort: number;
    protocol: 'tcp' | 'udp';
  }>;
  mountPath?: string;
}

interface Port {
  hostPort: string;
  containerPort: string;
  protocol: 'tcp' | 'udp';
}

interface ResourceCreationModalProps {
  type: 'container' | 'volume' | 'network';
  networks: Network[];
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ResourceCreationData) => void;
  preselectedImage?: string;
}

const ResourceCreationModal: React.FC<ResourceCreationModalProps> = ({
  type,
  networks,
  open,
  onClose,
  onConfirm,
  preselectedImage
}) => {
  const { createContainerInNetworks, executeCommand } = useDockerStore();
  const [resourceName, setResourceName] = useState('');
  const [imageName, setImageName] = useState('');
  const [selectedNetworkIds, setSelectedNetworkIds] = useState<string[]>(['bridge']);
  const [mountPath, setMountPath] = useState('/data');
  const [ports, setPorts] = useState<Port[]>([{ hostPort: '', containerPort: '', protocol: 'tcp' }]);
  const [imageSelectionModalOpen, setImageSelectionModalOpen] = useState(false);

  // 임시 simulationId와 userId. 실제 값은 사용자 세션 또는 전역 상태에서 가져와야 합니다.
  const SIMULATION_ID = "test-simulation-id"; // TODO: 실제 simulationId로 교체 필요
  const USER_ID = 1; // TODO: 실제 userId로 교체 필요

  useEffect(() => {
    if (preselectedImage) {
      setImageName(preselectedImage);
    }
  }, [preselectedImage]);
  
  useEffect(() => {
    if (open && type === 'container') {
      if (!selectedNetworkIds.includes('bridge')) {
        setSelectedNetworkIds(['bridge']);
      }
    }
  }, [open, type]);


  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirmClick = () => {
    const data: ResourceCreationData = {
      name: resourceName.trim(),
      image: type === 'container' ? imageName : undefined,
      networkIds: type === 'container' ? selectedNetworkIds : undefined,
    };
    if (type === 'container') {
      createContainerInNetworks(data, SIMULATION_ID, USER_ID); // SIMULATION_ID, USER_ID 추가
    } else if (type === 'volume') {
      let command = `docker volume create`;
      if (data.name) command += ` ${data.name}`;
      executeCommand(command, SIMULATION_ID, USER_ID); // SIMULATION_ID, USER_ID 추가
    } else if (type === 'network') {
      let command = `docker network create`;
      if (data.name) command += ` ${data.name}`;
      executeCommand(command, SIMULATION_ID, USER_ID); // SIMULATION_ID, USER_ID 추가
    }
    onConfirm(data);
    handleClose();
  };

  const handleClose = () => {
    setResourceName('');
    setImageName('');
    setMountPath('/data');
    setSelectedNetworkIds(['bridge']);
    setPorts([{ hostPort: '', containerPort: '', protocol: 'tcp' }]);
    setImageSelectionModalOpen(false);
    onClose();
  };

  const handleImageSelect = (image: string) => {
    setImageName(image);
    setImageSelectionModalOpen(false);
  };

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkIds(prev => 
      prev.includes(networkId) 
        ? prev.filter(id => id !== networkId)
        : [...prev, networkId]
    );
  };

  const getTitle = () => {
    if (type === 'container') return { icon: '📦', text: '새 컨테이너 생성' };
    if (type === 'volume') return { icon: '💾', text: '새 볼륨 생성' };
    if (type === 'network') return { icon: '🌐', text: '새 네트워크 생성' };
    return { icon: '', text: '' };
  };

  const getLabel = () => {
    if (type === 'container') return '컨테이너 이름';
    if (type === 'volume') return '볼륨 이름';
    if (type === 'network') return '네트워크 이름';
    return '';
  };

  const getPlaceholder = () => {
    if (type === 'container') return '비워두면 자동으로 생성됩니다';
    if (type === 'volume') return '볼륨 이름을 입력하세요';
    if (type === 'network') return '네트워크 이름을 입력하세요';
    return '';
  };

  const isFormValid = (type === 'container' && imageName !== '') || (type !== 'container' && resourceName.trim() !== '');

  return createPortal(
    <div className="resource-modal-backdrop" onClick={handleBackdropClick}>
      <div className="resource-modal-container">
        <div className="resource-modal-header">
          <div className="resource-modal-title">
            <span>{getTitle().icon}</span>
            <span>{getTitle().text}</span>
          </div>
          <button className="resource-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="resource-form">
          <div className="form-group">
            <label>
              {getLabel()}
              {type !== 'container' && <span className="required">*</span>}
            </label>
            <input
              type="text"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder={getPlaceholder()}
              className="form-input"
            />
          </div>
          {type === 'container' && (
            <>
              <div className="form-group">
                <label>
                  Docker 이미지 <span className="required">*</span>
                </label>
                <div className="image-select-group">
                  <input
                    type="text"
                    value={imageName}
                    readOnly
                    placeholder="이미지를 선택하세요"
                    className="form-input image-input"
                  />
                  <button
                    type="button"
                    onClick={() => setImageSelectionModalOpen(true)}
                    className="image-select-btn"
                  >
                    <span className="btn-icon">🖼️</span>
                    이미지 선택
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>
                  네트워크
                </label>
                <div className="network-selection-list">
                  {networks.map(network => (
                    <div key={network.id} className="network-list-item-selectable" onClick={() => handleNetworkSelect(network.id)}>
                      <input
                        type="checkbox"
                        checked={selectedNetworkIds.includes(network.id)}
                        onChange={() => handleNetworkSelect(network.id)}
                        className="network-checkbox"
                      />
                      <span>{network.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="resource-actions">
          <button
            onClick={onClose}
            className="action-btn secondary"
          >
            취소
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={!isFormValid}
            className={`action-btn primary ${!isFormValid ? 'disabled' : ''}`}
          >
            <span className="btn-icon">{getTitle().icon}</span>
            {getTitle().text.replace('새 ', '')}
          </button>
        </div>
        <ImageModal
          isOpen={imageSelectionModalOpen}
          onSelect={handleImageSelect}
          onClose={() => setImageSelectionModalOpen(false)}
          showSelectionButton={true}
        />
      </div>
    </div>,
    document.body
  );
};

export default ResourceCreationModal;