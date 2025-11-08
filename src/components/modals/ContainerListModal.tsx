'use client';

import React, { useState, useEffect } from 'react';
import styles from './Modal.module.css';

interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped';
  createdAt: Date;
  networkName?: string;
  volumeName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  containers?: Container[];
  onStart?: (containerId: string) => void;
  onStop?: (containerId: string) => void;
  onRemove?: (containerId: string) => void;
  onContainerClick?: (container: Container) => void;
}

const ContainerListModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  containers = [], 
  onStart, 
  onStop, 
  onRemove,
  onContainerClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContainers, setFilteredContainers] = useState<Container[]>(containers);
  const [filterStatus, setFilterStatus] = useState<'all' | 'running' | 'stopped'>('all');

  useEffect(() => {
    let result = [...containers];
    
    // 검색어로 필터링
    if (searchTerm) {
      result = result.filter(container => 
        container.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        container.image.toLowerCase().includes(searchTerm.toLowerCase()) ||
        container.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 상태로 필터링
    if (filterStatus !== 'all') {
      result = result.filter(container => container.status === filterStatus);
    }
    
    setFilteredContainers(result);
  }, [containers, searchTerm, filterStatus]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>컨테이너 리스트</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.filterSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="컨테이너 이름, 이미지 또는 ID 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <div className={styles.statusFilters}>
              <button 
                className={`${styles.filterButton} ${filterStatus === 'all' ? styles.active : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                전체
              </button>
              <button 
                className={`${styles.filterButton} ${filterStatus === 'running' ? styles.active : ''}`}
                onClick={() => setFilterStatus('running')}
              >
                실행 중
              </button>
              <button 
                className={`${styles.filterButton} ${filterStatus === 'stopped' ? styles.active : ''}`}
                onClick={() => setFilterStatus('stopped')}
              >
                중지됨
              </button>
            </div>
          </div>
          
          {filteredContainers.length === 0 ? (
            <div className={styles.emptyState}>
              <p>표시할 컨테이너가 없습니다.</p>
            </div>
          ) : (
            <div className={styles.containerList}>
              {filteredContainers.map(container => (
                <div 
                  key={container.id} 
                  className={styles.containerItem}
                  onClick={() => onContainerClick && onContainerClick(container)}
                >
                  <div className={styles.containerHeader}>
                    <h3>{container.name}</h3>
                    <span className={`${styles.status} ${styles[container.status]}`}>
                      {container.status === 'running' ? '실행 중' : '중지됨'}
                    </span>
                  </div>
                  <div className={styles.containerInfo}>
                    <p><strong>이미지:</strong> {container.image}</p>
                    <p><strong>ID:</strong> {container.id.slice(0, 12)}</p>
                    <p>
                      <strong>포트:</strong> {
                        container.ports.length > 0 
                          ? container.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ') 
                          : '없음'
                      }
                    </p>
                    {container.networkName && (
                      <p><strong>네트워크:</strong> {container.networkName}</p>
                    )}
                    {container.volumeName && (
                      <p><strong>볼륨:</strong> {container.volumeName}</p>
                    )}
                    <p><strong>생성일:</strong> {container.createdAt.toLocaleString()}</p>
                  </div>
                  <div className={styles.containerActions} onClick={e => e.stopPropagation()}>
                    {container.status === 'stopped' ? (
                      <button 
                        className={styles.startButton}
                        onClick={() => onStart && onStart(container.id)}
                      >
                        시작
                      </button>
                    ) : (
                      <button 
                        className={styles.stopButton}
                        onClick={() => onStop && onStop(container.id)}
                      >
                        중지
                      </button>
                    )}
                    <button 
                      className={styles.removeButton}
                      onClick={() => onRemove && onRemove(container.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContainerListModal; 