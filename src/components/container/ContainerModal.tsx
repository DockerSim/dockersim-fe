'use client';

import React from 'react';
import styles from './ContainerModal.module.css';

interface ContainerModalProps {
  container: {
    name: string;
    image: string;
    ports: { host: number; container: number }[];
    status: string;
    created: string;
  };
  onClose: () => void;
}

const ContainerModal: React.FC<ContainerModalProps> = ({ container, onClose }) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>컨테이너 상세 정보</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.content}>
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
            <span className={styles.value}>{container.status}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>생성일:</span>
            <span className={styles.value}>{container.created}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>포트:</span>
            <div className={styles.portList}>
              {container.ports.map((port, index) => (
                <span key={index} className={styles.portMapping}>
                  {port.host}:{port.container}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerModal; 