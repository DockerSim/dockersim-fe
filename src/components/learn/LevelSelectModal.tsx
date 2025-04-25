'use client';

import React from 'react';
import styles from './Modal.module.css';

interface Level {
  id: number;
  title: string;
  description: string;
  steps: {
    id: number;
    title: string;
    description: string;
  }[];
}

const levels: Level[] = [
  {
    id: 1,
    title: '도커 기초',
    description: '도커의 기본 개념과 명령어를 배웁니다.',
    steps: [
      {
        id: 1,
        title: '도커 이미지 다루기',
        description: '도커 이미지를 검색하고 다운로드하는 방법을 배웁니다.'
      },
      {
        id: 2,
        title: '컨테이너 실행하기',
        description: '도커 컨테이너를 생성하고 실행하는 방법을 배웁니다.'
      }
    ]
  },
  {
    id: 2,
    title: '도커 네트워크',
    description: '도커 네트워크의 개념과 설정 방법을 배웁니다.',
    steps: [
      {
        id: 1,
        title: '네트워크 생성',
        description: '도커 네트워크를 생성하고 설정하는 방법을 배웁니다.'
      },
      {
        id: 2,
        title: '컨테이너 연결',
        description: '컨테이너를 네트워크에 연결하는 방법을 배웁니다.'
      }
    ]
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LevelSelectModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedLevel, setSelectedLevel] = React.useState<Level | null>(null);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>학습 레벨 선택</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.levelList}>
            {levels.map(level => (
              <div 
                key={level.id}
                className={`${styles.levelItem} ${selectedLevel?.id === level.id ? styles.selected : ''}`}
                onClick={() => setSelectedLevel(level)}
              >
                <h3>{level.title}</h3>
                <p>{level.description}</p>
              </div>
            ))}
          </div>
          {selectedLevel && (
            <div className={styles.stepList}>
              <h3>학습 단계</h3>
              {selectedLevel.steps.map(step => (
                <div key={step.id} className={styles.stepItem}>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button 
            className={styles.startButton} 
            disabled={!selectedLevel}
            onClick={onClose}
          >
            학습 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelSelectModal; 