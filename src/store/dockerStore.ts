import { create } from 'zustand';
import { ResourceCreationData } from '../components/modals/ResourceCreationModal';
import { dockerApi } from '@/api/docker';
import { simulationApi } from '@/api/simulation';
import { Simulation } from '@/types/simulation';
import { useAuthStore } from './authStore';

// --- 타입 정의 ---
export interface Port { hostPort: number; containerPort: number; protocol: 'tcp' | 'udp'; }
export interface Volume { id: string; name: string; driver: string; scope: 'local' | 'global'; createdAt: Date; mountPath: string; labels: Record<string, string> | null; options: Record<string, string> | null; connectedContainers: string[]; }
export interface Container { id: string; name: string; image: string; status: 'running' | 'stopped' | 'paused'; ports: Port[]; volumes: Volume[]; network: string[]; created: Date; }
export interface Network { id:string; name: string; driver: string; scope: 'local' | 'global'; createdAt: Date; containers: Container[]; }
export interface DockerImage { id: string; name: string; tag: string; created: Date; size: string; }
export interface TerminalHistory { id: string; command: string; output: string; timestamp: string; isError: boolean; }

// 스토어에 저장될 Docker 상태
export interface DockerState {
  containers: Container[];
  volumes: Volume[];
  networks: Network[];
  localImages: DockerImage[];
  terminalHistory: TerminalHistory[];
}

interface DockerStore extends DockerState {
  simulationId: string | null;
  simulationTitle: string;
  setSimulationId: (id: string | null) => void;
  setSimulationTitle: (title: string) => void;

  executeCommand: (command: string, isInternal?: boolean) => Promise<any>; // Changed return type to any to get CommandResult
  createContainerInNetworks: (data: ResourceCreationData) => Promise<void>;
  disconnectVolumeFromContainer: (volumeName: string, containerName: string) => void;
  disconnectNetworkFromContainer: (networkName: string, containerName: string) => void;
  addMessage: (message: string, isError?: boolean) => void;
  generateComposeFile: () => string;

  // 상태 직접 조작 함수
  setState: (state: Partial<DockerState & { simulationId: string | null; simulationTitle: string }>) => void;

  // 시뮬레이션 저장/불러오기 함수
  saveSimulation: (title: string, shareStatus: 'READ' | 'WRITE' | 'PRIVATE') => Promise<string | null>;
  loadSimulation: (simulationId: string) => Promise<void>;
  resetSimulation: () => void;
}

const initialDockerState: DockerState = {
  containers: [],
  volumes: [],
  networks: [
    { id: 'bridge', name: 'bridge', driver: 'bridge', scope: 'local', createdAt: new Date(), containers: [] },
  ],
  localImages: [],
  terminalHistory: [],
};

export const useDockerStore = create<DockerStore>((set, get) => {
  let isCreatingSimulation = false;

  const syncNetworksWithContainers = (containers: Container[], networks: Network[]): Network[] => {
    const networkMap = new Map(networks.map(n => [n.name, { ...n, containers: [] }]));
    if (!networkMap.has('bridge')) {
      networkMap.set('bridge', { id: 'bridge', name: 'bridge', driver: 'bridge', scope: 'local', createdAt: new Date(), containers: [] });
    }
    containers.forEach(container => {
      (container.network || []).forEach(networkName => {
        if (networkMap.has(networkName)) {
          networkMap.get(networkName)!.containers.push(container);
        }
      });
    });
    return Array.from(networkMap.values());
  };

  const updateStateWithApiResponse = (data: any) => {
    set(state => {
      // 컨테이너 병합: 새로운 컨테이너 추가, 기존 컨테이너 업데이트
      let newContainers = [...state.containers];
      if (data.containers && data.containers.length > 0) {
        data.containers.forEach((newContainer: Container) => {
          const existingIndex = newContainers.findIndex(c => c.id === newContainer.id);
          if (existingIndex >= 0) {
            // 기존 컨테이너 업데이트
            newContainers[existingIndex] = newContainer;
          } else {
            // 새 컨테이너 추가
            newContainers.push(newContainer);
          }
        });
      }

      // 볼륨 병합: 새로운 볼륨 추가, 기존 볼륨 업데이트
      let newVolumes = [...state.volumes];
      if (data.volumes && data.volumes.length > 0) {
        data.volumes.forEach((newVolume: Volume) => {
          const existingIndex = newVolumes.findIndex(v => v.id === newVolume.id);
          if (existingIndex >= 0) {
            // 기존 볼륨 업데이트
            newVolumes[existingIndex] = newVolume;
          } else {
            // 새 볼륨 추가
            newVolumes.push(newVolume);
          }
        });
      }

      // 네트워크 병합: 새로운 네트워크 추가, 기존 네트워크 업데이트
      let newNetworks = [...state.networks];
      if (data.networks && data.networks.length > 0) {
        data.networks.forEach((newNetwork: Network) => {
          const existingIndex = newNetworks.findIndex(n => n.id === newNetwork.id);
          if (existingIndex >= 0) {
            // 기존 네트워크 업데이트
            newNetworks[existingIndex] = newNetwork;
          } else {
            // 새 네트워크 추가
            newNetworks.push(newNetwork);
          }
        });
      }

      // bridge 네트워크가 없으면 추가
      if (!newNetworks.some(n => n.name === 'bridge')) {
        const bridgeNetwork = { id: 'bridge', name: 'bridge', driver: 'bridge', scope: 'local' as 'local', createdAt: new Date(), containers: [] };
        newNetworks.push(bridgeNetwork);
      }

      // localImages 병합: 기존 이미지 + 새로운 이미지 병합
      let newLocalImages = [...state.localImages];
      if (data.localImages && data.localImages.length > 0) {
        data.localImages.forEach((newImage: DockerImage) => {
          const existingIndex = newLocalImages.findIndex(img => img.id === newImage.id);
          if (existingIndex >= 0) {
            // 기존 이미지 업데이트
            newLocalImages[existingIndex] = newImage;
          } else {
            // 새 이미지 추가
            newLocalImages.push(newImage);
          }
        });
        console.log('Updated localImages:', newLocalImages);
      }

      const updatedNetworks = syncNetworksWithContainers(newContainers, newNetworks);

      return {
        containers: newContainers,
        volumes: newVolumes,
        networks: updatedNetworks,
        localImages: newLocalImages,
      };
    });
  };

  const ensureSimulationId = async (): Promise<string | null> => {
    let { simulationId } = get();
    if (simulationId) return simulationId;

    if (isCreatingSimulation) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return ensureSimulationId();
    }

    isCreatingSimulation = true;
    try {
      const { accessToken, user } = useAuthStore.getState();
      if (!accessToken || !user?.userPublicId) {
        get().addMessage('Error: 로그인이 필요합니다. 로그인 후 Docker 명령어를 실행할 수 있습니다.', true);
        return null;
      }

      const timestamp = new Date().toLocaleString('ko-KR', { hour12: false }).replace(/ /g, '');
      const tempSimId = await get().saveSimulation(`임시 작업 ${timestamp}`, 'PRIVATE');

      if (tempSimId) {
        set({ simulationId: tempSimId });
        get().addMessage('임시 시뮬레이션이 자동으로 생성되었습니다. 나중에 제목을 변경할 수 있습니다.');

        // 기본 네트워크 생성 (bridge는 Docker의 기본 네트워크)
        try {
          console.log('[ensureSimulationId] Creating default bridge network for new simulation');
          const bridgeResponse = await dockerApi.executeCommand('docker network create bridge', tempSimId);
          if (bridgeResponse.code === 'SUCCESS' && bridgeResponse.data) {
            updateStateWithApiResponse(bridgeResponse.data);
            console.log('[ensureSimulationId] Bridge network created successfully');
          }
        } catch (e) {
          console.warn('[ensureSimulationId] Failed to create bridge network (may already exist):', e);
          // bridge 네트워크 생성 실패는 무시 (이미 존재할 수 있음)
        }

        return tempSimId;
      } else {
        get().addMessage('Error: 임시 시뮬레이션 생성에 실패했습니다.', true);
        return null;
      }
    } catch (e: any) {
      get().addMessage(`Error: 임시 시뮬레이션 생성 중 오류가 발생했습니다. ${e.message}`, true);
      return null;
    } finally {
      isCreatingSimulation = false;
    }
  };

  return {
    ...initialDockerState,
    simulationId: null,
    simulationTitle: '새로운 시뮬레이션',

    setSimulationId: (id) => set({ simulationId: id }),
    setSimulationTitle: (title) => set({ simulationTitle: title }),
    setState: (newState) => set(newState),

    addMessage: (message, isError = false) => {
      set(state => ({
        terminalHistory: [...state.terminalHistory, {
          id: `msg_${Date.now()}`,
          command: '',
          output: message,
          timestamp: new Date().toISOString(),
          isError
        }]
      }));
    },

    generateComposeFile: () => {
        const { containers, volumes, networks } = get();
        let services = '';
        if (containers.length > 0) {
          services = containers.map(c => `
      ${c.name}:
        image: ${c.image}
        ports:
    ${c.ports.map(p => `      - "${p.hostPort}:${p.containerPort}"`).join('\n')}
        networks:
    ${c.network.map(n => `      - ${n}`).join('\n')}
        volumes:
    ${c.volumes.map(v => `      - ${v.name}:${v.mountPath}`).join('\n')}`).join('');
        }
    
        let volumeDefs = '';
        if (volumes.length > 0) {
          volumeDefs = '\nvolumes:\n' + volumes.map(v => `  ${v.name}:\n    driver: ${v.driver}`).join('\n');
        }
    
        let networkDefs = '';
        const customNetworks = networks.filter(n => n.name !== 'bridge');
        if (customNetworks.length > 0) {
          networkDefs = '\nnetworks:\n' + customNetworks.map(n => `  ${n.name}:\n    driver: ${n.driver}`).join('\n');
        }
    
        return `version: '3.8'
    
    services:${services}${networkDefs}${volumeDefs}`;
    },
    
    createContainerInNetworks: async (data) => {
      const { executeCommand, networks, localImages } = get();
      const { image, name, networkIds } = data;

      if (!image) {
          get().addMessage('컨테이너를 생성하려면 이미지가 필요합니다.', true);
          return;
      }

      const containerName = (name && name.trim()) ? name.trim() : `container_${Date.now()}`;
      const finalImage = image.includes(':') ? image : `${image}:latest`;

      const safeNetworkIds = Array.isArray(networkIds) && networkIds.length > 0 ? networkIds : ['bridge'];

      // 네트워크 ID를 이름으로 변환 (ID와 name이 같은 경우도 있음)
      let primaryNetworkName = 'bridge';
      const primaryNetwork = networks.find(n => n.id === safeNetworkIds[0]);
      if (primaryNetwork) {
        primaryNetworkName = primaryNetwork.name;
      } else {
        // networks 배열에 없으면 ID를 그대로 name으로 사용 (bridge, host 등)
        primaryNetworkName = safeNetworkIds[0];
        console.log(`[createContainerInNetworks] Network ID '${safeNetworkIds[0]}' not found in networks array, using as name directly`);
      }
  
      // 1. 이미지가 로컬에 있는지 확인
      const imageExistsLocally = localImages.some(img => img.name === finalImage.split(':')[0] && img.tag === finalImage.split(':')[1]);
  
      if (!imageExistsLocally) {
        get().addMessage(`로컬에 이미지 '${finalImage}'가 없습니다. 이미지를 풀(pull)합니다.`, false);
        const pullCommand = `docker pull ${finalImage}`;
        const pullResult = await executeCommand(pullCommand, true);

        console.log('[createContainerInNetworks] Pull result:', pullResult);

        if (!pullResult || !pullResult.success) {
          get().addMessage(`Error: 이미지 '${finalImage}' 풀(pull)에 실패했습니다.`, true);
          return;
        }
        get().addMessage(`이미지 '${finalImage}' 풀(pull) 성공.`, false);

        // pull 후 잠시 대기 (백엔드가 이미지 정보를 저장할 시간)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // docker create 명령어 구성 (이미지 동기화 문제를 위한 재시도 로직 포함)
      console.log('[createContainerInNetworks] Creating container with image:', finalImage);
      let createCommand = `docker create --name ${containerName} --network ${primaryNetworkName} ${finalImage}`;
      // TODO: publish, volume, env 옵션 추가

      // 재시도 로직: 백엔드가 pull 후 이미지를 DB에 저장하는 데 시간이 걸릴 수 있음
      const MAX_RETRIES = 5;
      const INITIAL_DELAY = 500; // 500ms
      let createResult = null;
      let lastError = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        console.log(`[createContainerInNetworks] Create attempt ${attempt}/${MAX_RETRIES}`);

        createResult = await executeCommand(createCommand, true);
        console.log(`[createContainerInNetworks] Create attempt ${attempt} result:`, createResult);

        // 성공한 경우
        if (createResult && createResult.success && createResult.containers && createResult.containers.length > 0) {
          console.log(`[createContainerInNetworks] Create succeeded on attempt ${attempt}`);
          break;
        }

        // 실패한 경우 - 이미지를 찾을 수 없다는 오류인지 확인
        const errorOutput = createResult?.output || '';
        const isImageNotFoundError = errorOutput.includes('이미지') && errorOutput.includes('찾을 수 없습니다');

        lastError = errorOutput;

        if (isImageNotFoundError && attempt < MAX_RETRIES) {
          // 지수 백오프로 대기 시간 증가: 500ms, 1000ms, 2000ms, 4000ms, 8000ms
          const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
          console.log(`[createContainerInNetworks] Image not found, retrying after ${delay}ms...`);
          get().addMessage(`이미지 동기화 중... (${attempt}/${MAX_RETRIES - 1} 재시도)`, false);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // 다른 종류의 오류이거나 마지막 시도인 경우 중단
          console.log(`[createContainerInNetworks] Create failed with non-retryable error or max retries reached`);
          break;
        }
      }

      if (createResult && createResult.success && createResult.containers && createResult.containers.length > 0) {
        const createdContainer = createResult.containers[0];
        const createdContainerId = createdContainer.name || createdContainer.id;
        get().addMessage(`컨테이너 '${createdContainerId}'이(가) 생성되었습니다.`);

        // 생성된 컨테이너 시작
        const startResult = await executeCommand(`docker start ${createdContainerId}`, true);
        console.log('[createContainerInNetworks] Start result:', startResult);

        if (startResult && startResult.success) {
          get().addMessage(`컨테이너 '${createdContainerId}'이(가) 시작되었습니다.`);
        } else {
          get().addMessage(`Warning: 컨테이너 '${createdContainerId}' 시작에 실패했습니다.`, true);
        }

        // 추가 네트워크 연결 (docker create는 하나의 네트워크만 지정 가능하므로, 나머지는 connect로 연결)
        if (safeNetworkIds.length > 1) {
            for (const networkId of safeNetworkIds.slice(1)) {
                const network = networks.find(n => n.id === networkId);
                if (network) {
                    await executeCommand(`docker network connect ${network.name} ${createdContainerId}`, true);
                }
            }
            get().addMessage(`컨테이너 '${createdContainerId}'이(가) 추가 네트워크에 연결되었습니다.`);
        }
      } else {
        get().addMessage(`Error: 컨테이너 생성에 실패했습니다.`, true);
        console.error('[createContainerInNetworks] Create failed. Result:', createResult);
      }
    },

    disconnectVolumeFromContainer: (volumeName, containerName) => {
        set(state => {
          const container = state.containers.find(c => c.name === containerName);
          if (!container) return state;
          const updatedContainer = { ...container, volumes: container.volumes.filter(v => v.name !== volumeName) };
          const newContainers = state.containers.map(c => c.id === container.id ? updatedContainer : c);
          const updatedVolumes = state.volumes.map(v => v.name === volumeName ? { ...v, connectedContainers: v.connectedContainers.filter(cId => cId !== container.id) } : v);
          get().addMessage(`Disconnected volume ${volumeName} from container ${containerName}`);
          return { containers: newContainers, volumes: updatedVolumes };
        });
    },

    disconnectNetworkFromContainer: (networkName, containerName) => {
        const { containers, addMessage } = get();
        const container = containers.find(c => c.name === containerName);
        if (!container) return;
    
        if (container.network.length === 1 && container.network[0] === networkName) {
          addMessage(`Error: Cannot disconnect container from its only network "${networkName}".`, true);
          return;
        }
    
        const newNetworks = container.network.filter(n => n !== networkName);
        set(state => ({
            containers: state.containers.map(c => c.id === container.id ? { ...c, network: newNetworks } : c)
        }));
        addMessage(`Disconnected container ${containerName} from network ${containerName}`);
    },

    executeCommand: async (command, isInternal = false) => {
      if (!command.trim()) return;

      const simId = await ensureSimulationId();
      if (!simId) {
        if (!isInternal) {
          set(state => ({
            terminalHistory: [...state.terminalHistory, {
              id: `cmd_${Date.now()}`,
              command,
              output: '시뮬레이션 ID를 확보하지 못해 명령을 실행할 수 없습니다.',
              timestamp: new Date().toISOString(),
              isError: true
            }]
          }));
        }
        return;
      }

      let output = '';
      let isError = false;
      let responseData: any = null; // To store the full response data

      try {
        const response = await dockerApi.executeCommand(command, simId);

        if (response.code === 'SUCCESS' && response.data) {
          output = response.data.output;
          isError = !response.data.success;
          responseData = response.data; // Store the full data
          if (response.data) {
            updateStateWithApiResponse(response.data);
          }
        } else {
          output = response.message || response.error || '백엔드에서 알 수 없는 오류가 발생했습니다.';
          isError = true;
        }
      } catch (e: any) {
        output = e.message;
        isError = true;
      }

      if (!isInternal) {
        set(state => ({
          terminalHistory: [...state.terminalHistory, {
            id: `cmd_${Date.now()}`,
            command,
            output,
            timestamp: new Date().toISOString(),
            isError
          }]
        }));
      }
      return responseData; // Return the full response data
    },

    saveSimulation: async (title, shareStatus) => {
      const { simulationId, containers, volumes, networks, localImages, terminalHistory } = get();
      const dockerState: DockerState = { containers, volumes, networks, localImages, terminalHistory };
      
      const { accessToken, user } = useAuthStore.getState();

      if (!accessToken || !user?.userPublicId) {
        get().addMessage('Error: 로그인 정보가 없거나 유효하지 않아 시뮬레이션을 저장할 수 없습니다.', true);
        return null;
      }

      const serializedState = JSON.stringify(dockerState);

      const request = {
        title: title,
        dockerState: serializedState,
        shareState: shareStatus,
      };

      try {
        let response: Simulation;
        if (simulationId) {
          response = await simulationApi.updateSimulation(simulationId, request);
          get().addMessage('시뮬레이션이 성공적으로 업데이트되었습니다.');
        } else {
          response = await simulationApi.createSimulation(request);
          get().addMessage('시뮬레이션이 성공적으로 저장되었습니다.');
        }
        set({ simulationId: response.simulationPublicId, simulationTitle: response.title });
        return response.simulationPublicId;
      } catch (error) {
        console.error('Failed to save simulation:', error);
        get().addMessage(`Error: 시뮬레이션 저장에 실패했습니다. ${error instanceof Error ? error.message : ''}`, true);
        return null;
      }
    },

    loadSimulation: async (simulationId) => {
      try {
        const response = await simulationApi.getSimulation(simulationId);
        if (response && response.dockerState) {
          const dockerState: DockerState = JSON.parse(response.dockerState, (key, value) => {
            const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
            if (typeof value === 'string' && isoDateRegex.test(value)) {
              return new Date(value);
            }
            return value;
          });
          
          set({
            ...initialDockerState,
            ...dockerState,
            simulationId: response.simulationPublicId,
            simulationTitle: response.title,
          });
          updateStateWithApiResponse(dockerState);
          get().addMessage(`시뮬레이션 "${response.title}"을(를) 불러왔습니다.`);
        }
      } catch (error) {
        console.error('Failed to load simulation:', error);
        get().addMessage(`Error: 시뮬레이션 불러오기에 실패했습니다. ${error instanceof Error ? error.message : ''}`, true);
        get().resetSimulation();
      }
    },
    
    resetSimulation: () => {
      set({
        ...initialDockerState,
        simulationId: null,
        simulationTitle: '새로운 시뮬레이션',
      });
    },
  };
});