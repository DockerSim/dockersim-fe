import React from 'react';
import styles from './DownloadVisualization.module.css';

interface DownloadVisualizationProps {
  isVisible: boolean;
  progress: number;
  isCompleted?: boolean;
}

export const DownloadVisualization: React.FC<DownloadVisualizationProps> = ({ 
  isVisible, 
  progress, 
  isCompleted 
}) => {
  if (!isVisible) return null;
  
  return (
    <div className={`${styles.downloadVisualization} ${isCompleted ? styles.completed : ''}`}>
      <div className={styles.downloadBubble}>
        {isCompleted ? '다운로드 완료!' : `다운로드 중... ${progress}%`}
      </div>
      <div className={styles.downloadArrow}></div>
    </div>
  );
};

interface ImageIconProps {
  label: string;
  icon: string;
  onClick: () => void;
}

export const ImageIcon: React.FC<ImageIconProps> = ({ label, icon, onClick }) => (
  <div className={styles.imageIconButton} onClick={onClick}>
    <div className={styles.imageIcon}>{icon}</div>
    <div className={styles.imageIconLabel}>{label}</div>
  </div>
); 