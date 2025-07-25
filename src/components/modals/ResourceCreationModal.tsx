import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Network } from '../../store/dockerStore';
import ImageSelectionModal from './ImageSelectionModal';
import './ResourceCreationModal.css';

export interface ResourceCreationData {
  name: string;
  image?: string; // 컨테이너 생성 시에만 필요
  networkId: string;
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
  onConfirm: (data: ResourceCreationData) => void;
  onClose: () => void;
  preselectedImage?: string;
}

const ResourceCreationModal: React.FC<ResourceCreationModalProps> = ({
  type,
  networks,
  open,
  onConfirm,
  onClose,
  preselectedImage
}) => {
  const [resourceName, setResourceName] = useState('');
  const [imageName, setImageName] = useState('');
  const [selectedNetworkId, setSelectedNetworkId] = useState('');
  const [mountPath, setMountPath] = useState('/data');
  const [ports, setPorts] = useState<Port[]>([{ hostPort: '', containerPort: '', protocol: 'tcp' }]);
  const [imageSelectionModalOpen, setImageSelectionModalOpen] = useState(false);

  useEffect(() => {
    if (preselectedImage) {
      setImageName(preselectedImage);
    }
  }, [preselectedImage]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!selectedNetworkId || (type === 'container' && !imageName)) {
      return;
    }

    const data: ResourceCreationData = {
      name: resourceName.trim() || (type === 'container' ? `container_${Date.now()}` : `volume_${Date.now()}`),
      networkId: selectedNetworkId,
    };

    if (type === 'container') {
      data.image = imageName;
      data.ports = ports
        .filter(p => p.hostPort && p.containerPort)
        .map(p => ({
          hostPort: parseInt(p.hostPort),
          containerPort: parseInt(p.containerPort),
          protocol: p.protocol
        }));
    } else {
      data.mountPath = mountPath;
    }

    onConfirm(data);
    handleClose();
  };

  const handleClose = () => {
    setResourceName('');
    setImageName('');
    setMountPath('/data');
    setSelectedNetworkId('');
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

  const isFormValid = selectedNetworkId && (type === 'volume' || imageName);

  return createPortal(
    <div className="resource-modal-backdrop" onClick={handleBackdropClick}>
      <div className="resource-modal-container">
        {/* 헤더 */}
        <div className="resource-modal-header">
          <div className="resource-modal-title">
            <span>{type === 'container' ? '📦' : '💾'}</span>
            <span>{type === 'container' ? '새 컨테이너 생성' : '새 볼륨 생성'}</span>
          </div>
          <button className="resource-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* 폼 콘텐츠 */}
        <div className="resource-form">
          <div className="form-group">
            <label>
              {type === 'container' ? '컨테이너 이름 (선택사항)' : '볼륨 이름'}
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

          <div className="form-group">
            <label>
              네트워크 <span className="required">*</span>
            </label>
            <select
              value={selectedNetworkId}
              onChange={(e) => setSelectedNetworkId(e.target.value)}
              className="form-select"
            >
              <option value="">네트워크를 선택하세요</option>
              {networks.map(network => (
                <option key={network.id} value={network.id}>
                  {network.name}
                </option>
              ))}
            </select>
          </div>

          {/* 컨테이너 포트 매핑 */}
          {type === 'container' && (
            <div className="ports-container">
              <h4>포트 매핑 (선택사항)</h4>
              
              {ports.map((port, index) => (
                <div key={index} className="port-mapping-group">
                  <input
                    type="number"
                    placeholder="호스트 포트"
                    value={port.hostPort}
                    onChange={(e) => updatePort(index, 'hostPort', e.target.value)}
                    className="port-input"
                  />
                  <span className="port-arrow">→</span>
                  <input
                    type="number"
                    placeholder="컨테이너 포트"
                    value={port.containerPort}
                    onChange={(e) => updatePort(index, 'containerPort', e.target.value)}
                    className="port-input"
                  />
                  <select
                    value={port.protocol}
                    onChange={(e) => updatePort(index, 'protocol', e.target.value as 'tcp' | 'udp')}
                    className="protocol-select"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                  </select>
                  {ports.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePort(index)}
                      className="remove-port-btn"
                      title="포트 제거"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addPort}
                className="add-port-btn"
              >
                <span className="btn-icon">➕</span>
                포트 추가
              </button>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
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

        {/* 이미지 선택 모달 */}
        <ImageSelectionModal
          open={imageSelectionModalOpen}
          onSelect={handleImageSelect}
          onClose={() => setImageSelectionModalOpen(false)}
        />
      </div>
    </div>,
    document.body
  );
};

export default ResourceCreationModal; 