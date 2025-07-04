import React, { useState, useEffect, useCallback } from 'react';
import { ProcessStep } from '../../types';
import { adjustProcessPositionToContainer } from '../../utils/processUtils';
import styles from './ProcessVisualization.module.css';

interface ProcessVisualizationProps {
  processes: ProcessStep[];
}

export const ProcessVisualization: React.FC<ProcessVisualizationProps> = ({ processes }) => {
  // 컨테이너 ID별로 프로세스 그룹화
  const groupedProcesses = processes.reduce<Record<string, ProcessStep[]>>((acc, process) => {
    const key = process.containerId || 'global';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(process);
    return acc;
  }, {});

  // 가장 최신 단계만 표시 (각 그룹별로)
  const latestProcesses = Object.values(groupedProcesses).map(group => {
    // 완료되지 않은 프로세스가 있으면 그 중 가장 높은 단계를 표시
    const incomplete = group.filter(p => !p.completed);
    if (incomplete.length > 0) {
      return incomplete.reduce((latest, current) => 
        (current.stepNumber || 0) > (latest.stepNumber || 0) ? current : latest
      );
    }
    // 모두 완료된 경우 가장 높은 단계를 표시
    return group.reduce((latest, current) => 
      (current.stepNumber || 0) > (latest.stepNumber || 0) ? current : latest
    );
  });

  // 각 프로세스에 대해, 해당 컨테이너 위치 기반으로 위치 업데이트
  const [displayProcesses, setDisplayProcesses] = useState<ProcessStep[]>([]);
  
  // 위치 업데이트 함수
  const updateProcessPositions = useCallback(() => {
    const updatedProcesses = latestProcesses.map(process => {
      // 컨테이너가 있는 프로세스만 위치 조정
      if (process.containerId) {
        const newPosition = adjustProcessPositionToContainer(process.containerId);
        if (newPosition) {
          return {
            ...process,
            position: newPosition
          };
        }
      }
      return process;
    });
    
    setDisplayProcesses(updatedProcesses);
  }, [latestProcesses]);
  
  // 컴포넌트 마운트/업데이트 시 위치 계산
  useEffect(() => {
    updateProcessPositions();
    
    // 창 크기 변경 시 위치 재계산
    window.addEventListener('resize', updateProcessPositions);
    
    // 클린업 함수
    return () => {
      window.removeEventListener('resize', updateProcessPositions);
    };
  }, [updateProcessPositions]);
  
  // processes가 변경될 때마다 displayProcesses 업데이트
  useEffect(() => {
    updateProcessPositions();
  }, [processes, updateProcessPositions]);

  return (
    <div className={styles.processVisualization}>
      {displayProcesses.map((process, index) => (
        <div 
          key={process.id} 
          className={`${styles.processBubble} ${process.completed ? styles.completed : ''} ${styles[process.type]}`}
          style={{
            left: process.position?.x,
            top: process.position?.y,
            zIndex: 1000 + index
          }}
        >
          <div className={styles.processIcon}>
            {process.type === 'pull' && '⬇️'}
            {process.type === 'create' && '🏗️'}
            {process.type === 'start' && '▶️'}
            {process.type === 'connect' && '🔗'}
            {process.type === 'error' && '❌'}
            {process.type === 'search' && '🔍'}
          </div>
          <div className={styles.processContent}>
            <div className={styles.processMessage}>{process.message}</div>
            {process.details && (
              <div className={styles.processDetails}>{process.details}</div>
            )}
            {process.stepNumber !== undefined && process.totalSteps !== undefined && (
              <div className={styles.processProgress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{width: `${(process.stepNumber / process.totalSteps) * 100}%`}}
                  ></div>
                </div>
                <div className={styles.progressText}>
                  {process.stepNumber} / {process.totalSteps}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 