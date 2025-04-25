'use client';

import React from 'react';
import styles from './NetworkVisualizer.module.css';

interface Container {
  id: string;
  name: string;
  image: string;
  ports: string[];
  status: 'running' | 'stopped';
  createdAt: Date;
  network?: string;
}

interface Network {
  id: string;
  name: string;
  containers: string[];
  createdAt: Date;
}

interface Props {
  networks: Network[];
  containers: Container[];
}

const NetworkVisualizer: React.FC<Props> = ({ networks, containers }) => {
  return (
    <div className={styles.networkVisualizer}>
      {networks.map(network => (
        <div key={network.id} className={styles.networkCard}>
          <div className={styles.networkHeader}>
            <h3>{network.name}</h3>
            <span className={styles.networkInfo}>
              생성일: {network.createdAt.toLocaleString()}
            </span>
          </div>
          <div className={styles.networkContainers}>
            {network.containers.length === 0 ? (
              <div className={styles.emptyNetwork}>
                연결된 컨테이너가 없습니다
              </div>
            ) : (
              <div className={styles.containerGrid}>
                {network.containers.map(containerName => {
                  const container = containers.find(c => c.name === containerName);
                  if (!container) return null;

                  return (
                    <div key={container.id} className={styles.containerCard}>
                      <div className={styles.containerHeader}>
                        <h4>{container.name}</h4>
                        <span className={`${styles.status} ${styles[container.status]}`}>
                          {container.status}
                        </span>
                      </div>
                      <div className={styles.containerInfo}>
                        <p><strong>이미지:</strong> {container.image}</p>
                        <p><strong>포트:</strong> {container.ports.join(', ') || '없음'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NetworkVisualizer; 