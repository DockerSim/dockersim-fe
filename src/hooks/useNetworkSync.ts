import { useEffect } from 'react';
import { useDockerStore } from '../store/dockerStore';

/**
 * useNetworkSync - 네트워크와 컨테이너 간의 동기화를 담당하는 훅
 * 
 * 책임:
 * - 컨테이너 변경 시 네트워크의 containers 배열 업데이트
 * - 네트워크별 컨테이너 수 실시간 반영
 */
export const useNetworkSync = () => {
  const { containers, networks, updateNetwork } = useDockerStore();

  useEffect(() => {
    // 각 네트워크별로 연결된 컨테이너 수를 계산하고 업데이트
    networks.forEach(network => {
      const networkContainers = containers.filter(container => 
        container.network === network.name || 
        container.network === network.id ||
        (!container.network && network.id === 'bridge')
      );

      // 네트워크의 containers 배열이 실제 컨테이너와 다르면 업데이트
      const currentContainerIds = network.containers.map(c => c.id).sort();
      const newContainerIds = networkContainers.map(c => c.id).sort();
      
      if (currentContainerIds.length !== newContainerIds.length ||
          !currentContainerIds.every((id, index) => id === newContainerIds[index])) {
        updateNetwork(network.id, {
          containers: networkContainers
        });
      }
    });
  }, [containers, networks, updateNetwork]);

  return null;
}; 