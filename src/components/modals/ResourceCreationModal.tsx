import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Network, useDockerStore } from '../../store/dockerStore';
import ImageModal from './ImageModal';
import './ResourceCreationModal.css';

export interface ResourceCreationData {
  name: string;
  image?: string;
  networkIds: string[];
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
  type: 'container' | 'volume';
  networks: Network[];
  open: boolean;
  onClose: () => void;
  preselectedImage?: string;
}

const ResourceCreationModal: React.FC<ResourceCreationModalProps> = ({
  type,
  networks,
  open,
  onClose,
  preselectedImage
}) => {
  const { createContainerInNetworks, executeCommand } = useDockerStore();
  const [resourceName, setResourceName] = useState('');
  const [imageName, setImageName] = useState('');
  const [selectedNetworkIds, setSelectedNetworkIds] = useState<string[]>(['bridge']);
  const [mountPath, setMountPath] = useState('/data');
  const [ports, setPorts] = useState<Port[]>([{ hostPort: '', containerPort: '', protocol: 'tcp' }]);
  const [imageSelectionModalOpen, setImageSelectionModalOpen] = useState(false);

  useEffect(() => {
    if (preselectedImage) {
      setImageName(preselectedImage);
    }
  }, [preselectedImage]);
  
  useEffect(() => {
    // If modal opens for container creation, ensure 'bridge' is pre-selected
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

  const handleConfirm = () => {
    if (type === 'container' && !imageName) {
      alert('Docker 이미지를 선택해주세요.');
      return;
    }

    const data: ResourceCreationData = {
      name: resourceName.trim(),
      networkIds: selectedNetworkIds.length > 0 ? selectedNetworkIds : ['bridge'],
      image: type === 'container' ? imageName : undefined,
      ports: type === 'container' ? ports
        .filter(p => p.hostPort && p.containerPort)
        .map(p => ({
          hostPort: parseInt(p.hostPort),
          containerPort: parseInt(p.containerPort),
          protocol: p.protocol
        })) : undefined,
      mountPath: type === 'volume' ? mountPath : undefined,
    };

    if (type === 'container') {
      createContainerInNetworks(data);
    } else {
      let command = `docker volume create`;
      if (data.name) command += ` ${data.name}`;
      executeCommand(command);
    }
    
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

  const addPort = () => {
    setPorts([...ports, { hostPort: '', containerPort: '', protocol: 'tcp' }]);
  };

  const removePort = (index: number) => {
    setPorts(ports.filter((_, i) => i !== index));
  };

  const updatePort = (index: number, field: keyof Port, value: string) => {
    const newPorts = [...ports];
    newPorts[index] = { ...newPorts[index], [field]: value };
    setPorts(newPorts);
  };

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkIds(prev => 
      prev.includes(networkId) 
        ? prev.filter(id => id !== networkId)
        : [...prev, networkId]
    );
  };

  const isFormValid = type === 'volume' ? resourceName.trim() !== '' : imageName !== '';

  return createPortal(
    <div className="resource-modal-backdrop" onClick={handleBackdropClick}>
      <div className="resource-modal-container">
        <div className="resource-modal-header">
          <div className="resource-modal-title">
            <span>{type === 'container' ? '📦' : '💾'}</span>
            <span>{type === 'container' ? '새 컨테이너 생성' : '새 볼륨 생성'}</span>
          </div>
          <button className="resource-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="resource-form">
          <div className="form-group">
            <label>
              {type === 'container' ? '컨테이너 이름' : '볼륨 이름'}
              {type === 'volume' && <span className="required">*</span>}
            </label>
            <input
              type="text"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder={type === 'container' ? '비워두면 자동으로 생성됩니다' : '볼륨 이름을 입력하세요'}
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
          {type === 'volume' && (
            <div className="form-group">
              <label>마운트 경로</label>
              <input
                type="text"
                value={mountPath}
                onChange={(e) => setMountPath(e.target.value)}
                placeholder="/data"
                className="form-input"
              />
            </div>
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
            onClick={handleConfirm}
            disabled={!isFormValid}
            className={`action-btn primary ${!isFormValid ? 'disabled' : ''}`}
          >
            <span className="btn-icon">{type === 'container' ? '📦' : '💾'}</span>
            {type === 'container' ? '컨테이너 생성' : '볼륨 생성'}
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
