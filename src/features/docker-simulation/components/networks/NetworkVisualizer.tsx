import React, { useState } from 'react';
import { Network, Container } from '../../types';
import { ContainerCard } from '../containers/ContainerCard';
import { ContainerModal } from '../modals/ContainerModal';
import NetworkBrowser from './NetworkBrowser';
import styles from './NetworkVisualizer.module.css';

interface NetworkVisualizerProps {
  networks: Network[];
  containers: Container[];
  activeNetwork: string | null;
  onContainerStart?: (id: string) => void;
  onContainerStop?: (id: string) => void;
  onContainerRemove?: (id: string) => void;
  onNetworkChange?: (networkId: string) => void;
}

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({
  networks,
  containers,
  activeNetwork,
  onContainerStart,
  onContainerStop,
  onContainerRemove,
  onNetworkChange
}) => {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'browser'>('cards');

  const activeNetworkData = networks.find(n => n.id === activeNetwork);
  const activeNetworkContainers = activeNetworkData?.containers || [];

  return (
    <div className={styles.networkVisualizer}>
      {/* 네트워크 헤더 */}
      <div className={styles.networkHeader}>
        <div className={styles.networkTabs}>
          {networks.map(network => (
            <button
              key={network.id}
              className={`${styles.networkTab} ${activeNetwork === network.id ? styles.active : ''}`}
              onClick={() => onNetworkChange?.(network.id)}
            >
              <span className={styles.networkIcon}>🌐</span>
              <span className={styles.networkName}>{network.name}</span>
              <span className={styles.containerCount}>({network.containers.length})</span>
            </button>
          ))}
        </div>
        <div className={styles.viewControls}>
          <button
            className={`${styles.viewButton} ${viewMode === 'cards' ? styles.active : ''}`}
            onClick={() => setViewMode('cards')}
          >
            📋 카드뷰
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'browser' ? styles.active : ''}`}
            onClick={() => setViewMode('browser')}
          >
            🌐 브라우저뷰
          </button>
        </div>
      </div>

      {/* 네트워크 컨텐츠 */}
      <div className={styles.networkContent}>
        {activeNetworkData ? (
          <>
            {/* 네트워크 정보 */}
            <div className={styles.networkInfo}>
              <h3 className={styles.networkTitle}>
                <span className={styles.networkIcon}>🌐</span>
                {activeNetworkData.name}
              </h3>
              <div className={styles.networkStats}>
                <span className={styles.stat}>
                  <strong>{activeNetworkContainers.length}</strong> 컨테이너
                </span>
                <span className={styles.stat}>
                  <strong>{activeNetworkContainers.filter(c => c.status === 'running').length}</strong> 실행 중
                </span>
                <span className={styles.stat}>
                  <strong>{activeNetworkContainers.filter(c => c.status === 'stopped').length}</strong> 중지됨
                </span>
              </div>
            </div>

            {/* 컨테이너 표시 */}
            <div className={styles.containersSection}>
              {viewMode === 'cards' ? (
                <div className={styles.containersGrid}>
                  {activeNetworkContainers.length === 0 ? (
                    <div className={styles.emptyNetwork}>
                      <div className={styles.emptyIcon}>📦</div>
                      <h4>연결된 컨테이너가 없습니다</h4>
                      <p>docker run 명령어로 컨테이너를 생성해보세요</p>
                    </div>
                  ) : (
                    activeNetworkContainers.map((container) => (
                      <ContainerCard
                        key={container.id}
                        container={container}
                        onClick={() => setSelectedContainer(container)}
                      />
                    ))
                  )}
                </div>
              ) : (
                <NetworkBrowser
                  networkId={activeNetwork || ''}
                  containers={activeNetworkContainers}
                />
              )}
            </div>
          </>
        ) : (
          <div className={styles.noNetworkSelected}>
            <div className={styles.emptyIcon}>🌐</div>
            <h3>네트워크를 선택하세요</h3>
            <p>위에서 네트워크를 선택하여 컨테이너들을 확인해보세요</p>
          </div>
        )}
      </div>

      {/* 컨테이너 모달 */}
      {selectedContainer && (
        <ContainerModal
          container={selectedContainer}
          onClose={() => setSelectedContainer(null)}
          onStart={onContainerStart}
          onStop={onContainerStop}
          onRemove={onContainerRemove}
        />
      )}
    </div>
  );
}; 