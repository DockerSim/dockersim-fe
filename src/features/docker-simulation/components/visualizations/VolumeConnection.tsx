import React from 'react';
import { Container, Volume } from '../../types';
import styles from './VolumeConnection.module.css';

interface VolumeConnectionProps {
  container: Container;
  volume: Volume;
  isConnecting: boolean;
  index?: number;
  containerCount?: number;
}

export const VolumeConnection: React.FC<VolumeConnectionProps> = ({ 
  container, 
  volume, 
  isConnecting, 
  index = 0, 
  containerCount = 1 
}) => {
  // 컨테이너에서 볼륨 상단에 직접 연결되는 경로 (정확한 높이로 조정)
  const path = `M50,0 L50,95`;
  
  const connectionClass = isConnecting 
    ? styles.connecting 
    : container.id.slice(-4) === volume.id.slice(-4)
      ? styles.highlighted 
      : styles.connected;
  
  return (
    <div 
      className={`${styles.volumeConnectionContainer} ${connectionClass}`}
      data-container-id={container.id}
      data-volume-id={volume.id}
    >
      <svg className={styles.connectionPath} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path 
          d={path}
          stroke="#1c7ed6" 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
          strokeDasharray={isConnecting ? "5,5" : "none"}
          className={styles.connectionPathSvg}
        />
      </svg>
      
      {isConnecting && (
        <div className={styles.pulseDot} style={{ left: '50%', bottom: '5px' }}></div>
      )}
    </div>
  );
}; 