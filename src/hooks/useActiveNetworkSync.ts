import { useEffect } from 'react';
import { useDockerStore } from '../store/dockerStore';

/**
 * useActiveNetworkSync - 새로 생성된 네트워크로 자동 전환하는 훅
 * 
 * 책임:
 * - 새 네트워크 생성 시 해당 네트워크로 자동 전환
 * - 컨테이너 생성 시 해당 네트워크로 자동 전환
 */
export const useActiveNetworkSync = (
  activeNetwork: string,
  setActiveNetwork: (networkId: string) => void
) => {
  const { networks, containers } = useDockerStore();

  useEffect(() => {
    // 새로 생성된 네트워크가 있는지 확인
    const newNetwork = networks.find(n => n.isNew);
    if (newNetwork && activeNetwork !== newNetwork.id) {
      setActiveNetwork(newNetwork.id);
      // isNew 플래그 제거
      const { updateNetwork } = useDockerStore.getState();
      updateNetwork(newNetwork.id, { isNew: false });
    }
  }, [networks, activeNetwork, setActiveNetwork]);

  useEffect(() => {
    // 새로 생성된 컨테이너가 있으면 해당 네트워크로 전환
    const newContainer = containers.find(c => c.isNew);
    if (newContainer && newContainer.network && activeNetwork !== newContainer.network) {
      // 네트워크 이름으로 ID 찾기
      const targetNetwork = networks.find(n => 
        n.name === newContainer.network || n.id === newContainer.network
      );
      if (targetNetwork) {
        setActiveNetwork(targetNetwork.id);
      }
      
      // isNew 플래그 제거
      const { updateContainer } = useDockerStore.getState();
      updateContainer(newContainer.id, { isNew: false });
    }
  }, [containers, networks, activeNetwork, setActiveNetwork]);

  return null;
}; 