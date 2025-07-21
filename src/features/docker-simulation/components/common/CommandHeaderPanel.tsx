'use client';

import React, { useState } from 'react';
import AddBtn from '@/components/common/CrudBtn/addBtn';
import DeleteBtn from '@/components/common/CrudBtn/deleteBtn';
import styles from './CommandHeaderPanel.module.css';

export type TabType = 'container' | 'network' | 'volume';

interface CommandHeaderPanelProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onAdd: (type: TabType) => void;
  onDelete: (type: TabType) => void;
  children?: React.ReactNode;
}

const CommandHeaderPanel: React.FC<CommandHeaderPanelProps> = ({
  activeTab,
  onTabChange,
  onAdd,
  onDelete,
  children
}) => {
  const tabs = [
    { id: 'container' as TabType, label: '컨테이너', icon: '📦' },
    { id: 'network' as TabType, label: '네트워크', icon: '🌐' },
    { id: 'volume' as TabType, label: '볼륨', icon: '💾' }
  ];

  return (
    <div className={styles.commandHeaderPanel}>
      {/* 좌측 CRUD 버튼 영역 */}
      <div className={styles.crudButtonArea}>
        <AddBtn 
          onClick={() => onAdd(activeTab)}
          size="sm"
          className={styles.crudButton}
        />
        <DeleteBtn 
          onClick={() => onDelete(activeTab)}
          size="sm"
          className={styles.crudButton}
        />
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className={styles.mainContent}>
        {/* 상단 탭 메뉴 */}
        <div className={styles.tabMenu}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 영역 */}
        <div className={styles.tabContent}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CommandHeaderPanel; 