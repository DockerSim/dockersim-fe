import React from 'react';
import { Container, ModalProps } from '../../types';
import styles from '../terminal/Terminal.module.css';

interface ContainerModalProps extends ModalProps {
  container: Container;
  onStart?: (id: string) => void;
  onStop?: (id: string) => void;
  onRemove?: (id: string) => void;
}

export const ContainerModal: React.FC<ContainerModalProps> = ({ 
  container, 
  onClose, 
  onStart, 
  onStop, 
  onRemove 
}) => {
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
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <span className={`${styles.status} ${styles[container.status]}`}>
                  {container.status === 'running' ? '실행 중' : '중지됨'}
                </span>
              </div>
              <div className={styles.infoBody}>
                <div className={styles.infoGroup}>
                  <label>이미지</label>
                  <span className={styles.imageTag}>{container.image}</span>
                </div>
                <div className={styles.infoGroup}>
                  <label>컨테이너 ID</label>
                  <span className={styles.idTag}>{container.id.slice(0, 12)}</span>
                </div>
                <div className={styles.infoGroup}>
                  <label>네트워크</label>
                  <span className={styles.networkTag}>{container.network || '없음'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <label>생성 시간</label>
                  <span>{container.createdAt.toLocaleString()}</span>
                </div>
                {container.ports.length > 0 && (
                  <div className={styles.infoGroup}>
                    <label>포트 매핑</label>
                    <div className={styles.portList}>
                      {container.ports.map((port, idx) => (
                        <span key={idx} className={styles.portTag}>
                          {port.hostPort}:{port.containerPort}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {container.volumes && container.volumes.length > 0 && (
                  <div className={styles.infoGroup}>
                    <label>볼륨</label>
                    <div className={styles.volumeInfo}>
                      {container.volumes.map((volume, idx) => (
                        <div key={idx} className={styles.volumeItem}>
                          <span className={styles.volumeTag}>{volume.name}</span>
                          <span className={styles.mountPath}>{volume.mountPath}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button 
            className={`${styles.actionButton} ${container.status === 'running' ? styles.stop : styles.start}`}
            onClick={() => {
              if (container.status === 'running') {
                onStop && onStop(container.id);
              } else {
                onStart && onStart(container.id);
              }
              onClose();
            }}
          >
            {container.status === 'running' ? '중지' : '시작'}
          </button>
          <button 
            className={`${styles.actionButton} ${styles.remove}`}
            onClick={() => {
              onRemove && onRemove(container.id);
              onClose();
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}; 