'use client';

import React from 'react';
import { Container, Network, Volume } from '../../../../store/dockerStore';
import { TabType } from './CommandHeaderPanel';
import styles from './TabContentArea.module.css';

interface TabContentAreaProps {
  activeTab: TabType;
  containers: Container[];
  networks: Network[];
  volumes: Volume[];
  activeNetworkId?: string; // 활성 네트워크 ID 추가
  onContainerClick?: (container: Container) => void;
  onNetworkClick?: (network: Network) => void;
  onVolumeClick?: (volume: Volume) => void;
}

const TabContentArea: React.FC<TabContentAreaProps> = ({
  activeTab,
  containers,
  networks,
  volumes,
  activeNetworkId,
  onContainerClick,
  onNetworkClick,
  onVolumeClick
}) => {
  const renderContainers = () => (
    <div className={styles.contentList}>
      <div className={styles.sectionHeader}>
        <h3>컨테이너 목록</h3>
        <span className={styles.count}>{containers.length}개</span>
      </div>
      {containers.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📦</span>
          <p>생성된 컨테이너가 없습니다.</p>
          <small>+ 버튼을 클릭하여 새 컨테이너를 생성하세요.</small>
        </div>
      ) : (
        <div className={styles.itemGrid}>
          {containers.map((container) => (
            <div
              key={container.id}
              className={`${styles.item} ${styles.containerItem}`}
              onClick={() => onContainerClick?.(container)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemIcon}>📦</span>
                <span className={styles.itemName}>{container.name}</span>
                <span className={`${styles.statusBadge} ${styles[container.status]}`}>
                  {container.status === 'running' ? '실행중' : '중지됨'}
                </span>
              </div>
              <div className={styles.itemDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>이미지:</span>
                  <span className={styles.detailValue}>{container.image}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>네트워크:</span>
                  <span className={styles.detailValue}>{container.network || 'bridge'}</span>
                </div>
                {container.ports?.length > 0 && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>포트:</span>
                    <span className={styles.detailValue}>
                      {container.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNetworks = () => (
    <div className={styles.contentList}>
      <div className={styles.sectionHeader}>
        <h3>네트워크 목록</h3>
        <span className={styles.count}>{networks.length}개</span>
      </div>
      {networks.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🌐</span>
          <p>생성된 네트워크가 없습니다.</p>
          <small>+ 버튼을 클릭하여 새 네트워크를 생성하세요.</small>
        </div>
      ) : (
        <div className={styles.itemGrid}>
          {networks.map((network) => (
            <div
              key={network.id}
              className={`${styles.item} ${styles.networkItem}`}
              onClick={() => onNetworkClick?.(network)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemIcon}>🌐</span>
                <span className={styles.itemName}>{network.name}</span>
                <span className={styles.statusBadge}>
                  {network.containers.length}개 연결
                </span>
              </div>
              <div className={styles.itemDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>컨테이너:</span>
                  <span className={styles.detailValue}>
                    {network.containers.length > 0 
                      ? network.containers.map(c => c.name).join(', ')
                      : '연결된 컨테이너 없음'
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVolumes = () => {
    // 활성 네트워크에 속한 볼륨만 필터링
    const filteredVolumes = activeNetworkId 
      ? volumes.filter(v => v.networkId === activeNetworkId || (!v.networkId && activeNetworkId === 'bridge'))
      : volumes;
    
    return (
      <div className={styles.contentList}>
        <div className={styles.sectionHeader}>
          <h3>볼륨 목록</h3>
          <span className={styles.count}>{filteredVolumes.length}개</span>
        </div>
        {filteredVolumes.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💾</span>
            <p>생성된 볼륨이 없습니다.</p>
            <small>+ 버튼을 클릭하여 새 볼륨을 생성하세요.</small>
          </div>
        ) : (
          <div className={styles.itemGrid}>
            {filteredVolumes.map((volume) => (
            <div
              key={volume.id}
              className={`${styles.item} ${styles.volumeItem}`}
              onClick={() => onVolumeClick?.(volume)}
            >
              <div className={styles.itemHeader}>
                <span className={styles.itemIcon}>💾</span>
                <span className={styles.itemName}>{volume.name}</span>
              </div>
              <div className={styles.itemDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>마운트 경로:</span>
                  <span className={styles.detailValue}>{volume.mountPath}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>네트워크:</span>
                  <span className={styles.detailValue}>
                    {volume.networkId || 'bridge'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  };

  return (
    <div className={styles.tabContentArea}>
      {activeTab === 'container' && renderContainers()}
      {activeTab === 'network' && renderNetworks()}
      {activeTab === 'volume' && renderVolumes()}
    </div>
  );
};

export default TabContentArea; 