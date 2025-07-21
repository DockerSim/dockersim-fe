import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Container } from '../../types';
import styles from './NetworkBrowser.module.css';

export interface NetworkBrowserHandle {
  handleCommandExecution: (command: string) => void;
}

interface NetworkBrowserProps {
  networkId: string;
  containers?: Container[];
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
  ({ networkId, containers = [] }, ref) => {
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

    // 기존 컨테이너들을 노드로 변환
    const existingContainerNodes: ContainerNode[] = containers.map(container => ({
      id: parseInt(container.id),
      type: 'container',
      name: container.name,
      image: container.image,
      status: container.status,
      ports: container.ports.map(p => `${p.hostPort}:${p.containerPort}`),
      volumes: container.volumes?.map(v => v.name) || []
    }));

    // 모든 노드 (기존 + 새로 추가된)
    const allNodes = [...existingContainerNodes, ...nodes];

    return (
      <div className={styles.browserContainer}>
        <div className={styles.networkTabs}>
          <button
            className={`${styles.networkTab} ${activeTab === 'containers' ? styles.active : ''}`}
            onClick={() => setActiveTab('containers')}
          >
            컨테이너 ({allNodes.length})
          </button>
        </div>
        <div className={styles.contentArea}>
          {allNodes.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📦</div>
              <div className={styles.emptyTitle}>컨테이너가 없습니다</div>
              <div className={styles.emptyHint}>
                <code>docker run</code> 명령어를 사용하여 컨테이너를 생성하세요
              </div>
            </div>
          ) : (
            <div className={styles.containersGrid}>
              {allNodes.map((node) => (
                <div key={node.id} className={styles.node}>
                  <div className={styles.nodeHeader}>
                    <div className={styles.nodeIcon}>🐳</div>
                    <div className={styles.nodeStatus}>
                      <span className={`${styles.statusDot} ${styles[node.status]}`}></span>
                      {node.status}
                    </div>
                  </div>
                  <div className={styles.nodeContent}>
                    <div className={styles.nodeName}>{node.name}</div>
                    <div className={styles.nodeImage}>{node.image}</div>
                    
                    {node.ports && node.ports.length > 0 && (
                      <div className={styles.nodeDetails}>
                        <div className={styles.detailsTitle}>포트</div>
                        <div className={styles.detailsContent}>
                          {node.ports.map((port, index) => (
                            <div key={index} className={styles.detailItem}>{port}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {node.volumes && node.volumes.length > 0 && (
                      <div className={styles.nodeDetails}>
                        <div className={styles.detailsTitle}>볼륨</div>
                        <div className={styles.detailsContent}>
                          {node.volumes.map((volume, index) => (
                            <div key={index} className={styles.detailItem}>{volume}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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