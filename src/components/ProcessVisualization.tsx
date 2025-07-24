import React, { useState, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

export interface ProcessStep {
  id: string;
  type: 'create' | 'start' | 'stop' | 'remove' | 'error' | 'info';
  message: string;
  containerId: string;
  completed?: boolean;
  position?: Position;
}

interface ProcessVisualizationProps {
  processes: ProcessStep[];
  getContainerPosition: (containerId: string) => Position | undefined;
}

const iconMap: Record<string, string> = {
  create: '🏗️',
  start: '▶️',
  stop: '⏹️',
  remove: '🗑️',
  error: '❌',
  info: 'ℹ️',
};

export const ProcessVisualization: React.FC<ProcessVisualizationProps> = ({ processes, getContainerPosition }) => {
  const [displayProcesses, setDisplayProcesses] = useState<ProcessStep[]>([]);

  console.log('ProcessVisualization received processes:', processes);

  // 위치 업데이트 함수
  const updateProcessPositions = useCallback(() => {
    console.log('Updating process positions for:', processes.length, 'processes');
    setDisplayProcesses(
      processes.map(process => {
        const pos = getContainerPosition(process.containerId);
        console.log('Process:', process.id, 'Container:', process.containerId, 'Position:', pos);
        return {
          ...process,
          position: pos || process.position,
        };
      })
    );
  }, [processes, getContainerPosition]);

  useEffect(() => {
    updateProcessPositions();
    window.addEventListener('resize', updateProcessPositions);
    return () => {
      window.removeEventListener('resize', updateProcessPositions);
    };
  }, [updateProcessPositions]);

  useEffect(() => {
    updateProcessPositions();
  }, [processes, updateProcessPositions]);

  console.log('Display processes:', displayProcesses);

  return (
    <>
      {displayProcesses.map((process, idx) => {
        console.log('Rendering process:', process.id, 'with position:', process.position);
        return process.position ? (
          <div
            key={process.id}
            style={{
              position: 'absolute',
              left: process.position.x,
              top: process.position.y - 40, // 컨테이너 위에 뜨도록
              zIndex: 2000 + idx,
              pointerEvents: 'none',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              padding: '6px 16px',
              fontSize: 18,
              fontWeight: 500,
              border: process.type === 'error' ? '2px solid #fa5252' : '2px solid #228be6',
              color: process.type === 'error' ? '#fa5252' : '#228be6',
              minWidth: 80,
              gap: 8,
              animation: 'pop-bubble 0.7s',
            }}>
              <span style={{ fontSize: 22 }}>{iconMap[process.type]}</span>
              <span>{process.message}</span>
            </div>
          </div>
        ) : null;
      })}
      <style>{`
        @keyframes pop-bubble {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}; 