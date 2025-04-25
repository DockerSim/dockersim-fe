'use client';

import React from 'react';
import styles from './NetworkTabs.module.css';

interface DockerNetwork {
  id: string;
  name: string;
  created: Date;
  isActive: boolean;
}

interface NetworkTabsProps {
  networks: DockerNetwork[];
  activeNetwork: string | null;
  onNetworkSelect: (id: string) => void;
  onNetworkRemove: (id: string) => void;
}

const NetworkTabs: React.FC<NetworkTabsProps> = ({
  networks,
  activeNetwork,
  onNetworkSelect,
  onNetworkRemove
}) => {
  if (networks.length === 0) return null;

  return (
    <div className={styles.networkContainer}>
      <div className={styles.tabContainer}>
        {networks.map(network => (
          <div
            key={network.id}
            className={`${styles.tab} ${network.id === activeNetwork ? styles.active : ''}`}
            onClick={() => onNetworkSelect(network.id)}
          >
            <span>{network.name}</span>
            <button
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onNetworkRemove(network.id);
              }}
              aria-label="네트워크 삭제"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className={styles.contentContainer}>
        {activeNetwork ? (
          <div className={styles.networkInfo}>
            {/* 네트워크 정보가 있을 때의 컨텐츠 */}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>네트워크를 선택하여 정보를 확인하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkTabs; 