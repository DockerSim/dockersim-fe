import React from 'react';
import styles from './ContainerDetailModal.module.css';

interface ContainerDetailModalProps {
  container: {
    name: string;
    image: string;
    ports: string[];
    status: string;
    createdAt: Date;
  };
  onClose: () => void;
}

const ContainerDetailModal: React.FC<ContainerDetailModalProps> = ({ container, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>컨테이너 상세 정보</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.infoRow}>
            <span className={styles.label}>이름:</span>
            <span className={styles.value}>{container.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>이미지:</span>
            <span className={styles.value}>{container.image}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>상태:</span>
            <span className={`${styles.value} ${styles.status}`}>{container.status}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>생성 시간:</span>
            <span className={styles.value}>
              {container.createdAt.toLocaleString()}
            </span>
          </div>
          {container.ports.length > 0 && (
            <div className={styles.portsSection}>
              <h3>포트 매핑</h3>
              {container.ports.map((port, index) => {
                const [hostPort, containerPort] = port.split(':');
                return (
                  <div key={index} className={styles.portMapping}>
                    <span className={styles.hostPort}>{hostPort}</span>
                    <span className={styles.arrow}>→</span>
                    <span className={styles.containerPort}>{containerPort}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContainerDetailModal; 