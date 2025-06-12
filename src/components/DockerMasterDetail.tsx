import React, { useState, useEffect } from 'react';
import { useDockerStore } from '../store/dockerStore';
import { ImageList } from './ImageList';
import { ImageDetail } from './ImageDetail';
import styles from './DockerMasterDetail.module.css';

type DockerMasterDetailProps = {
  initialTab?: 'local' | 'registry';
};

export const DockerMasterDetail: React.FC<DockerMasterDetailProps> = ({ initialTab = 'local' }) => {
  const viewMode = useDockerStore(state => state.viewMode);
  const setViewMode = useDockerStore(state => state.setViewMode);
  
  // 부모 컴포넌트에서 initialTab이 변경되면 viewMode 업데이트
  useEffect(() => {
    if (initialTab) {
      setViewMode(initialTab);
    }
  }, [initialTab, setViewMode]);

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${viewMode === 'local' ? styles.active : ''}`}
          onClick={() => setViewMode('local')}
        >
          로컬 이미지
        </button>
        <button
          className={`${styles.tab} ${viewMode === 'registry' ? styles.active : ''}`}
          onClick={() => setViewMode('registry')}
        >
          원격 레지스트리
        </button>
      </div>
      <div className={styles.content}>
        <ImageList />
        <ImageDetail />
      </div>
    </div>
  );
}; 