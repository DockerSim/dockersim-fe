import React from 'react';
import { ContainerCard } from './ContainerCard';
import { VolumeConnection } from '../visualizations/VolumeConnection';
import { Container, Volume } from '../../types';
import styles from '../terminal/Terminal.module.css';

interface ContainerSectionProps {
  containers: Container[];
  newContainerId: string | null;
  newVolumeId: string | null;
  connectingVolume: boolean;
  onContainerClick: (container: Container) => void;
  onVolumeClick: (volume: Volume) => void;
}

/**
 * ContainerSection - 컨테이너 목록을 담당하는 컴포넌트
 * 
 * 책임:
 * - 컨테이너 카드들 렌더링
 * - 볼륨 연결 시각화
 * - 컨테이너-볼륨 상호작용 처리
 */
export const ContainerSection: React.FC<ContainerSectionProps> = ({
  containers,
  newContainerId,
  newVolumeId,
  connectingVolume,
  onContainerClick,
  onVolumeClick,
}) => {
  const getContainerLayoutClass = (containers: Container[]) => {
    if (containers.length === 0) return styles.emptyLayout;
    if (containers.length <= 2) return styles.smallLayout;
    return styles.normalLayout;
  };

  return (
    <div className={`${styles.containersSection} ${getContainerLayoutClass(containers)}`}>
      {containers.map((container) => (
        <div 
          key={container.id} 
          className={`${styles.containerWrapper} ${newContainerId === container.id ? styles.creating : ''}`}
          data-container-id={container.id}
        >
          <ContainerCard
            container={container}
            onClick={() => onContainerClick(container)}
            isCreating={newContainerId === container.id}
          />
          
          {/* 볼륨 연결 시각화 */}
          {container.volumes && container.volumes.length > 0 && (
            <div className={styles.volumesContainer}>
              {container.volumes.map((volume, volumeIdx) => {
                const volumeCount = container.volumes?.length || 0;
                const offset = volumeCount > 1
                  ? (volumeIdx - (volumeCount - 1) / 2) * 100
                  : 0;
                
                return (
                  <div 
                    key={`${container.id}-${volume.id}`} 
                    className={styles.volumeConnectionWrapper}
                    style={{ 
                      transform: `translateX(${offset}px)`,
                      position: 'absolute', 
                      left: '50%',
                      marginLeft: '-35px',
                      top: '0'
                    }}
                  >
                    <VolumeConnection 
                      container={container}
                      volume={volume}
                      isConnecting={connectingVolume && container.id === newContainerId}
                    />
                    <div 
                      className={`${styles.volumeCircle} ${styles.attachedVolume} ${newVolumeId === volume.id ? styles.highlight : ''}`}
                      onClick={() => onVolumeClick(volume)}
                    >
                      <div className={styles.volumeConnectionDot}></div>
                      <div className={styles.volumeName}>{volume.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      
      {containers.length === 0 && (
        <div className={styles.emptyMessage}>
          컨테이너가 없습니다. docker run 명령어로 컨테이너를 생성해보세요.
        </div>
      )}
    </div>
  );
}; 