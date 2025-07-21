'use client';

import React, { useState } from 'react';
import AddBtn from '@/components/common/CrudBtn/addBtn';
import DeleteBtn from '@/components/common/CrudBtn/deleteBtn';
import StartBtn from '@/components/common/CrudBtn/startBtn';
import StopBtn from '@/components/common/CrudBtn/stopBtn';
import styles from './TerminalCommandPanel.module.css';

interface TerminalCommandPanelProps {
  onAdd?: () => void;
  onDelete?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  selectedContainerId?: string | null;
  containerStatus?: 'running' | 'stopped';
  isProcessing?: boolean;
}

const TerminalCommandPanel: React.FC<TerminalCommandPanelProps> = ({
  onAdd,
  onDelete,
  onStart,
  onStop,
  selectedContainerId,
  containerStatus,
  isProcessing = false
}) => {
  return (
    <div className={styles.terminalCommandPanel}>
      <div className={styles.buttonGroup}>
        {/* 생성 버튼 */}
        <AddBtn 
          onClick={onAdd}
          size="sm"
          className={styles.commandButton}
        />
        
        {/* 삭제 버튼 */}
        <DeleteBtn 
          onClick={onDelete}
          size="sm"
          className={styles.commandButton}
        />
        
        {/* 구분선 */}
        <div className={styles.divider}></div>
        
        {/* 실행 버튼 - 컨테이너가 선택되고 중지 상태일 때만 표시 */}
        {selectedContainerId && containerStatus === 'stopped' && (
          <StartBtn 
            onClick={onStart}
            size="sm"
            className={`${styles.commandButton} ${isProcessing ? styles.processing : ''}`}
          />
        )}
        
        {/* 중지 버튼 - 컨테이너가 선택되고 실행 상태일 때만 표시 */}
        {selectedContainerId && containerStatus === 'running' && (
          <StopBtn 
            onClick={onStop}
            size="sm"
            className={`${styles.commandButton} ${isProcessing ? styles.processing : ''}`}
          />
        )}
      </div>
      
      {/* 선택된 컨테이너 정보 */}
      {selectedContainerId && (
        <div className={styles.selectedInfo}>
          <span className={styles.infoLabel}>선택됨:</span>
          <span className={styles.infoValue}>{selectedContainerId.slice(0, 12)}</span>
          <span className={`${styles.statusBadge} ${styles[containerStatus || 'stopped']}`}>
            {containerStatus === 'running' ? '실행중' : '중지됨'}
          </span>
        </div>
      )}
    </div>
  );
};

export default TerminalCommandPanel; 