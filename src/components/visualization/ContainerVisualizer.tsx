'use client';

import React, { useState, useEffect } from 'react';
import styles from './ContainerVisualizer.module.css';

interface Volume {
  name: string;
  mountPath: string;
  hostPath?: string;
}

interface Container {
  id: string;
  name: string;
  image: string;
  ports: Array<{
    hostPort: string;
    containerPort: string;
  }>;
  status: 'running' | 'stopped';
  createdAt: Date;
  volume?: Volume;
  network?: string;
  lastCommand?: string;
}

interface Network {
  id: string;
  name: string;
  containers: Container[];
  isNew?: boolean;
}

interface Image {
  id: string;
  name: string;
  tag: string;
  size: string;
  created: Date;
  isOfficial: boolean;
}

interface Props {
  containers?: Container[];
  networks?: Network[];
  images?: Image[];
  onNetworkCreate?: (networkName: string) => void;
}

const ContainerCard = ({ container, onClick }: { container: Container; onClick: () => void }) => (
  <div className={styles.containerCard} onClick={onClick}>
    <h3>{container.name}</h3>
    <div className={styles.portsList}>
      {container.ports.map((port, index) => (
        <span key={index} className={styles.port}>
          {port.hostPort}:{port.containerPort}
        </span>
      ))}
    </div>
    {container.volume && (
      <div className={styles.volumeConnection}>
        <div className={styles.volumeIndicator} />
      </div>
    )}
  </div>
);

const NetworkView = ({ network }: { network: Network }) => {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  return (
    <div className={styles.networkView}>
      <div className={styles.containersGrid}>
        {network.containers.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            onClick={() => setSelectedContainer(container)}
          />
        ))}
      </div>
      {selectedContainer && (
        <ContainerModal
          container={selectedContainer}
          onClose={() => setSelectedContainer(null)}
        />
      )}
    </div>
  );
};

const ContainerModal: React.FC<{ container: Container; onClose: () => void }> = ({ container, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chromeModal} onClick={e => e.stopPropagation()}>
        <div className={styles.chromeHeader}>
          <div className={styles.tabSection}>
            <div className={styles.activeTab}>
              <span className={styles.tabIcon}>📦</span>
              {container.name}
            </div>
          </div>
          <button className={styles.chromeClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.infoSection}>
            <div className={styles.infoGroup}>
              <label>상태</label>
              <span className={`${styles.status} ${styles[container.status]}`}>
                {container.status}
              </span>
            </div>
            <div className={styles.infoGroup}>
              <label>이미지</label>
              <span>{container.image}</span>
            </div>
            <div className={styles.infoGroup}>
              <label>ID</label>
              <span>{container.id}</span>
            </div>
            <div className={styles.infoGroup}>
              <label>네트워크</label>
              <span>{container.network || '없음'}</span>
            </div>
            <div className={styles.infoGroup}>
              <label>포트</label>
              <div className={styles.portList}>
                {container.ports.map(port => (
                  <span key={port.hostPort} className={styles.portTag}>{port.hostPort}:{port.containerPort}</span>
                ))}
              </div>
            </div>
            {container.volume && (
              <div className={styles.volumeInfo}>
                <label>볼륨</label>
                <div className={styles.volumeDetails}>
                  <div className={styles.volumePath}>
                    <span>컨테이너 경로: {container.volume.mountPath}</span>
                    {container.volume.hostPath && (
                      <span>호스트 경로: {container.volume.hostPath}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button 
            className={`${styles.actionButton} ${container.status === 'running' ? styles.stop : styles.start}`}
          >
            {container.status === 'running' ? '중지' : '시작'}
          </button>
          <button className={`${styles.actionButton} ${styles.remove}`}>
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

const ContainerVisualizer: React.FC<Props> = ({ 
  containers = [], 
  networks = [], 
  images = [],
  onNetworkCreate 
}) => {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showImageRepo, setShowImageRepo] = useState<boolean>(false);
  const [localNetworks, setLocalNetworks] = useState<Network[]>(networks);

  useEffect(() => {
    if (localNetworks.length > 0 && !activeTab) {
      setActiveTab(localNetworks[0].name);
    }
  }, [localNetworks, activeTab]);

  const handleNetworkCreate = (networkName: string) => {
    const newNetwork: Network = {
      id: Date.now().toString(),
      name: networkName,
      containers: [],
      isNew: true
    };
    
    setLocalNetworks(prev => [...prev, newNetwork]);
    setActiveTab(newNetwork.id);
    
    // Remove isNew flag after animation
    setTimeout(() => {
      setLocalNetworks(prev => 
        prev.map(network => 
          network.id === newNetwork.id 
            ? { ...network, isNew: false }
            : network
        )
      );
    }, 300);
  };

  const handleCloseTab = (networkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalNetworks(prev => prev.filter(network => network.id !== networkId));
    
    if (activeTab === networkId) {
      const remainingNetworks = localNetworks.filter(network => network.id !== networkId);
      setActiveTab(remainingNetworks.length > 0 ? remainingNetworks[remainingNetworks.length - 1].id : null);
    }
  };

  const addContainerToNetwork = (networkId: string, container: Container) => {
    setLocalNetworks(prevNetworks => 
      prevNetworks.map(network => 
        network.id === networkId
          ? { ...network, containers: [...network.containers, container] }
          : network
      )
    );
  };

  return (
    <div className={styles.visualizer}>
      <div className={styles.chromeBrowser}>
        <div className={styles.chromeToolbar}>
          <div className={styles.networkTabs}>
            {localNetworks.map(network => (
              <div
                key={network.id}
                className={`${styles.chromeTab} ${activeTab === network.id ? styles.activeTab : ''} ${network.isNew ? styles.new : ''}`}
                onClick={() => setActiveTab(network.id)}
              >
                <span className={styles.tabIcon}>⚡</span>
                <span className={styles.tabTitle}>{network.name}</span>
                <button
                  className={styles.tabClose}
                  onClick={(e) => handleCloseTab(network.id, e)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.chromeContent}>
          {localNetworks.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🌐</span>
              <p>네트워크가 없습니다. 네트워크를 생성해주세요.</p>
              <small>예: docker network create my-network</small>
            </div>
          ) : (
            localNetworks.map(network => (
              <div
                key={network.id}
                className={`${styles.networkContent} ${activeTab === network.id ? styles.active : ''}`}
              >
                <NetworkView network={network} />
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.imageRepository}>
        <div className={styles.repoHeader} onClick={() => setShowImageRepo(!showImageRepo)}>
          <span className={styles.repoIcon}>🗄️</span>
          이미지 저장소
          <span className={`${styles.repoArrow} ${showImageRepo ? styles.open : ''}`}>▼</span>
        </div>
        {showImageRepo && (
          <div className={styles.imageList}>
            {images.length > 0 ? (
              images.map(image => (
                <div key={image.id} className={styles.imageItem}>
                  <span className={styles.imageIcon}>{image.isOfficial ? '✓' : '🔄'}</span>
                  <div className={styles.imageInfo}>
                    <span className={styles.imageName}>{image.name}:{image.tag}</span>
                    <span className={styles.imageSize}>{image.size}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>저장된 이미지가 없습니다.</p>
                <small>이미지를 다운로드하거나 빌드해주세요.</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContainerVisualizer; 