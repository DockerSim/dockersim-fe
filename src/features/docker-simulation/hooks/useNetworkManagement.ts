import { useState, useCallback } from 'react';
import { Network, Container } from '../types';
import { useToast } from '../../../hooks/useToast';

interface UseNetworkManagementReturn {
  networks: Network[];
  activeNetwork: string | null;
  setNetworks: React.Dispatch<React.SetStateAction<Network[]>>;
  setActiveNetwork: React.Dispatch<React.SetStateAction<string | null>>;
  createNetwork: (name: string) => Network;
  removeNetwork: (id: string) => void;
  handleTabClick: (tabId: string) => void;
  handleTabClose: (tabId: string) => void;
  syncNetworksWithContainers: (containers: Container[]) => void;
}

/**
 * useNetworkManagement - 네트워크 관리와 관련된 모든 로직을 관리하는 커스텀 훅
 * 
 * 책임:
 * - 네트워크 목록 상태 관리
 * - 네트워크 생성 및 삭제 로직
 * - 네트워크 브라우저 모달 상태 관리
 * - 네트워크 선택 및 조회
 */
export const useNetworkManagement = (): UseNetworkManagementReturn => {
  const [networks, setNetworks] = useState<Network[]>([
    {
      id: 'default',
      name: 'bridge',
      containers: []
    }
  ]);
  const [activeNetwork, setActiveNetwork] = useState<string | null>('default');

  const { showSuccessToast, showErrorToast } = useToast();

  const createNetwork = useCallback((name: string): Network => {
    const newNetwork: Network = {
      id: `network_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: name,
      containers: [],
      isNew: true
    };

    setNetworks(prev => [...prev, newNetwork]);
    
    // 3초 후 isNew 플래그 제거
    setTimeout(() => {
      setNetworks(prev => prev.map(network => 
        network.id === newNetwork.id 
          ? { ...network, isNew: false }
          : network
      ));
    }, 3000);

    return newNetwork;
  }, []);

  const removeNetwork = useCallback((id: string) => {
    // 기본 네트워크는 삭제할 수 없음
    if (id === 'default') return;

    setNetworks(prev => prev.filter(network => network.id !== id));
    
    // 활성 네트워크가 삭제된 경우 기본 네트워크로 변경
    if (activeNetwork === id) {
      setActiveNetwork('default');
    }
  }, [activeNetwork]);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveNetwork(tabId);
  }, []);

  const handleTabClose = useCallback((tabId: string) => {
    // 기본 네트워크는 닫을 수 없음
    if (tabId === 'default') return;
    
    // 네트워크에 컨테이너가 있는 경우 확인
    const network = networks.find(n => n.id === tabId);
    if (network && network.containers.length > 0) {
      const confirmDelete = window.confirm(
        `네트워크 '${network.name}'에 ${network.containers.length}개의 컨테이너가 연결되어 있습니다. 정말 삭제하시겠습니까?`
      );
      if (!confirmDelete) return;
    }

    removeNetwork(tabId);
  }, [networks, removeNetwork]);

  const syncNetworksWithContainers = useCallback((containers: Container[]) => {
    setNetworks(prev => prev.map(network => {
      // 네트워크에 속한 컨테이너들을 찾아서 업데이트
      const networkContainers = containers.filter(container => 
        container.network === network.name || 
        (network.name === 'bridge' && !container.network)
      );

      return {
        ...network,
        containers: networkContainers
      };
    }));
  }, []);

  return {
    networks,
    activeNetwork,
    setNetworks,
    setActiveNetwork,
    createNetwork,
    removeNetwork,
    handleTabClick,
    handleTabClose,
    syncNetworksWithContainers
  };
};

/**
 * 초기 기본 네트워크 데이터
 */
const initialNetworks: Network[] = [
  {
    id: 'bridge',
    name: 'bridge',
    containers: [],
  },
  {
    id: 'host',
    name: 'host',
    containers: [],
  },
  {
    id: 'none',
    name: 'none',
    containers: [],
  },
];

/**
 * 유틸리티 함수들
 */
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 