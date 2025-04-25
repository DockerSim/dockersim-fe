'use client';

import React, { useState } from 'react';
import styles from './ContainerBox.module.css';

interface ContainerBoxProps {
  container: {
    name: string;
    image: string;
    ports: { host: number; container: number }[];
    status: string;
    created: string;
    networkId?: string;
  };
}

const ContainerBox: React.FC<ContainerBoxProps> = ({ container }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className={styles.container} onClick={() => setShowModal(true)}>
        <div className={styles.header}>
          <span className={styles.name}>{container.name}</span>
          <span className={styles.status}>{container.status}</span>
        </div>
        <div className={styles.ports}>
          {container.ports.map((port, index) => (
            <span key={index} className={styles.port}>
              {port.host}:{port.container}
            </span>
          ))}
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>컨테이너 상세 정보</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
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
                <span className={styles.value}>
                  {new Date(container.created).toLocaleString()}
                </span>
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
      )}
    </>
  );
};

export default ContainerBox; 