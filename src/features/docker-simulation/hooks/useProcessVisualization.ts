import { useState, useCallback } from 'react';
import { ProcessStep, Position } from '../types';

interface UseProcessVisualizationReturn {
  processes: ProcessStep[];
  animating: boolean;
  newContainerId: string | null;
  newVolumeId: string | null;
  connectingVolume: boolean;
  setProcesses: React.Dispatch<React.SetStateAction<ProcessStep[]>>;
  setAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  setNewContainerId: React.Dispatch<React.SetStateAction<string | null>>;
  setNewVolumeId: React.Dispatch<React.SetStateAction<string | null>>;
  setConnectingVolume: React.Dispatch<React.SetStateAction<boolean>>;
  addProcessStep: (step: Omit<ProcessStep, 'id'>) => void;
  handleProcessComplete: (id: string) => void;
  handleAllProcessesComplete: (containerId: string) => void;
  calculateProcessPosition: (type: string, processIndex: number) => Position;
  adjustProcessPositionToContainer: (containerId: string | undefined) => Position | undefined;
}

/**
 * useProcessVisualization - 프로세스 시각화와 관련된 모든 로직을 관리하는 커스텀 훅
 * 
 * 책임:
 * - 프로세스 단계별 시각화 상태 관리
 * - 애니메이션 제어
 * - 프로세스 위치 계산
 * - 컨테이너/볼륨 생성 애니메이션 상태
 */
export const useProcessVisualization = (): UseProcessVisualizationReturn => {
  const [processes, setProcesses] = useState<ProcessStep[]>([]);
  const [animating, setAnimating] = useState(false);
  const [newContainerId, setNewContainerId] = useState<string | null>(null);
  const [newVolumeId, setNewVolumeId] = useState<string | null>(null);
  const [connectingVolume, setConnectingVolume] = useState(false);

  const calculateProcessPosition = useCallback((type: string, processIndex: number): Position => {
    const baseX = window.innerWidth / 2 - 150;
    const baseY = 150;
    
    const typeOffsets = {
      'search': 0,
      'pull': 1,
      'create': 2,
      'connect': 3,
      'start': 4,
      'error': 5
    };
    
    const typeOffset = (typeOffsets as any)[type] || 0;
    const horizontalOffset = (processIndex % 3) * 320;
    
    return {
      x: baseX + horizontalOffset,
      y: baseY + (typeOffset * 90)
    };
  }, []);

  const adjustProcessPositionToContainer = useCallback((containerId: string | undefined): Position | undefined => {
    if (!containerId) return undefined;

    // 컨테이너 카드의 대략적인 위치를 계산
    const containerElement = document.querySelector(`[data-container-id="${containerId}"]`);
    if (containerElement) {
      const rect = containerElement.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - 75,
        y: rect.top - 60
      };
    }

    // 기본 위치 반환
    return {
      x: window.innerWidth / 2 - 75,
      y: 200
    };
  }, []);

  const addProcessStep = useCallback((step: Omit<ProcessStep, 'id'>) => {
    const newStep: ProcessStep = {
      ...step,
      id: `process_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };

    // 컨테이너 위치에 맞게 조정
    if (step.containerId) {
      const adjustedPosition = adjustProcessPositionToContainer(step.containerId);
      if (adjustedPosition) {
        newStep.position = adjustedPosition;
      }
    }

    setProcesses(prev => [...prev, newStep]);

    // 자동 완료 처리 (시뮬레이션)
    if (step.type !== 'error') {
      setTimeout(() => {
        setProcesses(prev => prev.map(p => 
          p.id === newStep.id ? { ...p, completed: true } : p
        ));
      }, 2000);
    }
  }, [adjustProcessPositionToContainer]);

  const handleProcessComplete = useCallback((id: string) => {
    setProcesses(prev => prev.map(process => 
      process.id === id ? { ...process, completed: true } : process
    ));

    // 3초 후 프로세스 제거
    setTimeout(() => {
      setProcesses(prev => prev.filter(process => process.id !== id));
    }, 3000);
  }, []);

  const handleAllProcessesComplete = useCallback((containerId: string) => {
    // 해당 컨테이너와 관련된 모든 프로세스 제거
    setTimeout(() => {
      setProcesses(prev => prev.filter(process => process.containerId !== containerId));
      setAnimating(false);
      setNewContainerId(null);
      setConnectingVolume(false);
    }, 2000);
  }, []);

  return {
    processes,
    animating,
    newContainerId,
    newVolumeId,
    connectingVolume,
    setProcesses,
    setAnimating,
    setNewContainerId,
    setNewVolumeId,
    setConnectingVolume,
    addProcessStep,
    handleProcessComplete,
    handleAllProcessesComplete,
    calculateProcessPosition,
    adjustProcessPositionToContainer
  };
}; 