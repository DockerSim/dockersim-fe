import React from 'react';
import { Volume, ModalProps } from '../../types';
import styles from '../terminal/Terminal.module.css';

interface VolumeModalProps extends ModalProps {
  volume: Volume;
}

export const VolumeModal: React.FC<VolumeModalProps> = ({ volume, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chromeModal} onClick={e => e.stopPropagation()}>
        <div className={styles.chromeHeader}>
          <div className={styles.tabSection}>
            <div className={styles.activeTab}>
              <span className={styles.tabIcon}>💾</span>
              {volume.name}
            </div>
          </div>
          <button className={styles.chromeClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <div className={styles.infoBody}>
                <div className={styles.infoGroup}>
                  <label>볼륨 이름</label>
                  <span className={styles.volumeTag}>{volume.name}</span>
                </div>
                {volume.mountPath && (
                  <div className={styles.infoGroup}>
                    <label>마운트 경로</label>
                    <span className={styles.mountPath}>{volume.mountPath}</span>
                  </div>
                )}
                <div className={styles.infoGroup}>
                  <label>생성 시간</label>
                  <span>{volume.createdAt.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 