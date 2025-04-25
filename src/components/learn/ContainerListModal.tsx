'use client';

import React from 'react';
import styles from './Modal.module.css';

interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped';
  ports: string[];
  createdAt: Date;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ContainerListModal: React.FC<Props> = ({ isOpen, onClose }) => {
  // 실제로는 상위 컴포넌트에서 props로 받아와야 합니다
  const containers: Container[] = [
    {
      id: '1234567890ab',
      name: 'nginx-server',
      image: 'nginx:latest',
      status: 'running',
      ports: ['80:80'],
      createdAt: new Date()
    },
    {
      id: 'abcdef123456',
      name: 'mysql-db',
      image: 'mysql:8',
      status: 'stopped',
      ports: ['3306:3306'],
      createdAt: new Date()
    }
  ];

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>컨테이너 리스트</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.containerList}>
            {containers.map(container => (
              <div key={container.id} className={styles.containerItem}>
                <div className={styles.containerHeader}>
                  <h3>{container.name}</h3>
                  <span className={`${styles.status} ${styles[container.status]}`}>
                    {container.status}
                  </span>
                </div>
                <div className={styles.containerInfo}>
                  <p><strong>이미지:</strong> {container.image}</p>
                  <p><strong>ID:</strong> {container.id}</p>
                  <p><strong>포트:</strong> {container.ports.join(', ')}</p>
                  <p><strong>생성일:</strong> {container.createdAt.toLocaleString()}</p>
                </div>
                <div className={styles.containerActions}>
                  {container.status === 'stopped' ? (
                    <button className={styles.startButton}>시작</button>
                  ) : (
                    <button className={styles.stopButton}>중지</button>
                  )}
                  <button className={styles.removeButton}>삭제</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerListModal; 