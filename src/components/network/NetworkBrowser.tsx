import React, { forwardRef, useImperativeHandle, useState } from 'react';
import styles from './NetworkBrowser.module.css';

export interface NetworkBrowserHandle {
  handleCommandExecution: (command: string) => void;
}

interface NetworkBrowserProps {
  networkId: string;
}

interface ContainerNode {
  id: number;
  type: 'container';
  name: string;
  image: string;
  status: string;
  ports?: string[];
  volumes?: string[];
}

const NetworkBrowser = forwardRef<NetworkBrowserHandle, NetworkBrowserProps>(
  ({ networkId }, ref) => {
    const [nodes, setNodes] = useState<ContainerNode[]>([]);
    const [activeTab, setActiveTab] = useState('containers');

    useImperativeHandle(ref, () => ({
      handleCommandExecution: (command: string) => {
        if (command.startsWith('docker')) {
          const parts = command.split(' ');
          if (parts[1] === 'run') {
            // 컨테이너 이름 추출
            const nameIndex = parts.indexOf('--name');
            const containerName = nameIndex !== -1 ? parts[nameIndex + 1] : 'unnamed';
            
            // 이미지 이름 추출
            const imageName = parts[parts.length - 1];
            
            // 포트 매핑 추출
            const ports: string[] = [];
            const portIndex = parts.indexOf('-p');
            if (portIndex !== -1) {
              ports.push(parts[portIndex + 1]);
            }
            
            // 볼륨 마운트 추출
            const volumes: string[] = [];
            const volumeIndex = parts.indexOf('-v');
            if (volumeIndex !== -1) {
              volumes.push(parts[volumeIndex + 1]);
            }

            // 새로운 컨테이너 노드 추가
            const newNode: ContainerNode = {
              id: Date.now(),
              type: 'container',
              name: containerName,
              image: imageName,
              status: 'running',
              ports,
              volumes
            };
            
            setNodes(prev => [...prev, newNode]);
          }
        }
      }
    }));

    return (
      <div className={styles.browserContainer}>
        <div className={styles.networkTabs}>
          <button
            className={`${styles.networkTab} ${activeTab === 'containers' ? styles.active : ''}`}
            onClick={() => setActiveTab('containers')}
          >
            Containers
          </button>
        </div>
        <div className={styles.contentArea}>
          {nodes.length === 0 ? (
            <div className={styles.emptyState}>
              <div>컨테이너가 없습니다</div>
              <code>docker run</code>
              <div className={styles.hint}>명령어를 사용하여 컨테이너를 생성하세요</div>
            </div>
          ) : (
            <div className={styles.containersGrid}>
              {nodes.map((node) => (
                <div key={node.id} className={styles.node}>
                  <div className={styles.nodeIcon}>🐳</div>
                  <div className={styles.nodeName}>{node.name}</div>
                  <div className={styles.nodeImage}>{node.image}</div>
                  <div className={styles.nodeStatus}>{node.status}</div>
                  {node.ports && node.ports.length > 0 && (
                    <div className={styles.nodeDetails}>
                      <div className={styles.detailsTitle}>포트</div>
                      {node.ports.map((port, index) => (
                        <div key={index} className={styles.detailItem}>{port}</div>
                      ))}
                    </div>
                  )}
                  {node.volumes && node.volumes.length > 0 && (
                    <div className={styles.nodeDetails}>
                      <div className={styles.detailsTitle}>볼륨</div>
                      {node.volumes.map((volume, index) => (
                        <div key={index} className={styles.detailItem}>{volume}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

NetworkBrowser.displayName = 'NetworkBrowser';

export default NetworkBrowser; 