import React from 'react';
import { Container } from '../../types';
import styles from '../terminal/Terminal.module.css';

interface ContainerCardProps {
  container: Container;
  onClick: () => void;
  isCreating?: boolean;
}

export const ContainerCard: React.FC<ContainerCardProps> = ({ 
  container, 
  onClick, 
  isCreating = false 
}) => (
  <div 
    className={`${styles.containerCard} ${container.status === 'running' ? styles.running : styles.stopped} ${isCreating ? styles.highlight : ''}`} 
    onClick={onClick}
    data-container-id={container.id}
  >
    <div className={styles.containerHeader}>
      <span className={styles.containerIcon}>📦</span>
      <h3 className={styles.containerName}>{container.name}</h3>
      <span className={`${styles.statusIndicator} ${styles[container.status]}`}></span>
    </div>
    <div className={styles.containerImageTag}>{container.image}</div>
    <div className={styles.portsList}>
      {container.ports.map((port, index) => (
        <span key={index} className={styles.portBadge}>
          {port.hostPort}:{port.containerPort}
        </span>
      ))}
    </div>
    {container.volumes && container.volumes.length > 0 && (
      <div className={styles.volumeConnection}>
        {container.volumes.map((volume, index) => (
          <span key={index} className={styles.volumeBadge}>
            {volume.name}
          </span>
        ))}
      </div>
    )}
  </div>
); 