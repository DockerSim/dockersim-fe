import { create } from 'zustand';
import { ResourceCreationData } from '../components/modals/ResourceCreationModal';
import { dockerApi } from '@/api/docker';
import { simulationApi } from '@/api/simulation';
import { Simulation } from '@/types/simulation';
import { useAuthStore, User } from './authStore'; // User 타입 임포트

// --- 타입 정의 ---
export interface Port { hostPort: number; containerPort: number; protocol: 'tcp' | 'udp'; }
export interface Volume { id: string; name: string; driver: string; scope: 'local' | 'global'; createdAt: Date; mountPath: string; labels: Record<string, string> | null; options: Record<string, string> | null; connectedContainers: string[]; }
export interface Container { id: string; name: string; image: string; status: 'running' | 'stopped' | 'paused'; ports: Port[]; volumes: Volume[]; network: string[]; created: Date; }
export interface Network { id: string; name: string; driver: string; scope: 'local' | 'global'; createdAt: Date; containers: Container[]; }
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
  
  executeCommand: (command: string, simulationId: string, userId: number, isInternal?: boolean) => Promise<void>;
  createContainerInNetworks: (data: ResourceCreationData, simulationId: string, userId: number) => Promise<void>;
  disconnectVolumeFromContainer: (volumeName: string, containerName: string) => void;
  disconnectNetworkFromContainer: (networkName: string, containerName: string) => void;
  addMessage: (message: string) => void;
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
  localImages: [
    { id: 'sha256:nginx123', name: 'nginx', tag: 'latest', created: new Date(), size: '133MB' },
    { id: 'sha256:ubuntu123', name: 'ubuntu', tag: 'latest', created: new Date(), size: '72.9MB' },
    { id: 'sha256:python123', name: 'python', tag: '3.9-slim', created: new Date(), size: '114MB' },
    { id: 'sha256:mysql123', name: 'mysql', tag: 'latest', created: new Date(), size: '544MB' },
  ],
  terminalHistory: [],
};

export const useDockerStore = create<DockerStore>((set, get) => {
  const syncNetworksWithContainers = (containers: Container[], networks: Network[]): Network[] => {
    return networks.map(network => ({
      ...network,
      containers: containers.filter(container => container.network.includes(network.name))
    }));
  };

  return {
    ...initialDockerState,
    simulationId: null,
    simulationTitle: '새로운 시뮬레이션',

    setSimulationId: (id) => set({ simulationId: id }),
    setSimulationTitle: (title) => set({ simulationTitle: title }),
    setState: (newState) => set(newState),

    addMessage: (message) => {
      set(state => ({ terminalHistory: [...state.terminalHistory, { id: `msg_${Date.now()}`, command: '', output: message, timestamp: new Date().toISOString(), isError: false }] }));
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
    
    createContainerInNetworks: async (data, simulationId, userId) => {
      const { executeCommand, networks } = get();
      const { image, name, networkIds } = data;
      if (!image) return;
      const containerName = name || `container_${Date.now()}`;
      const safeNetworkIds = Array.isArray(networkIds) && networkIds.length > 0 ? networkIds : ['bridge'];
      const primaryNetworkName = networks.find(n => n.id === safeNetworkIds[0])?.name || 'bridge';
      let runCommand = `docker run -d --name ${containerName} --network ${primaryNetworkName} ${image}`;
      await executeCommand(runCommand, simulationId, userId, true);
      if (safeNetworkIds.length > 1) {
        for (const networkId of safeNetworkIds.slice(1)) {
          const network = networks.find(n => n.id === networkId);
          if (network) {
            await executeCommand(`docker network connect ${network.name} ${containerName}`, simulationId, userId, true);
          }
        }
      }
      get().addMessage(`Container ${containerName} created and connected to specified networks.`);
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
      const { updateContainer } = get();
      const container = get().containers.find(c => c.name === containerName);
      if (!container) return;

      if (container.network.length === 1 && container.network[0] === networkName) {
        get().addMessage(`Error: Cannot disconnect container from its only network "${networkName}".`);
        return;
      }

      const newNetworks = container.network.filter(n => n !== networkName);
      updateContainer(container.id, { network: newNetworks });
      get().addMessage(`Disconnected container ${containerName} from network ${networkName}`);
    },

    executeCommand: async (command, simulationId, userId, isInternal = false) => {
      const state = get();
      let output = '';
      let isError = false;

      try {
        if (!command.trim()) return;

        const response = await dockerApi.executeCommand(command, simulationId, userId);

        if (response.code === 'SUCCESS' && response.data) {
          output = response.data.output;
          isError = !response.data.success;

          set(state => {
            let newContainers = state.containers;
            let newVolumes = state.volumes;
            let newNetworks = state.networks;

            if (response.data?.containers) {
              newContainers = response.data.containers;
            }
            if (response.data?.volumes) {
              newVolumes = response.data.volumes;
            }
            if (response.data?.networks) {
              newNetworks = response.data.networks;
            }

            const updatedNetworks = syncNetworksWithContainers(newContainers, newNetworks);

            return {
              containers: newContainers,
              volumes: newVolumes,
              networks: updatedNetworks,
            };
          });

        } else {
          output = response.message || response.error || 'Unknown error from backend.';
          isError = true;
        }

      } catch (e: any) {
        output = e.message;
        isError = true;
      }

      if (!isInternal && output) {
        set(state => ({ terminalHistory: [...state.terminalHistory, { id: `cmd_${Date.now()}`, command, output, timestamp: new Date().toISOString(), isError }] }));
      }
    },

    addContainer: (container) => set(state => {
      const newContainers = [...state.containers, container];
      const newNetworks = syncNetworksWithContainers(newContainers, state.networks);
      return { containers: newContainers, networks: newNetworks };
    }),

    removeContainer: (id) => set(state => {
      const newContainers = state.containers.filter(c => c.id !== id);
      const newNetworks = syncNetworksWithContainers(newContainers, state.networks);
      const updatedVolumes = state.volumes.map(v => ({ ...v, connectedContainers: v.connectedContainers.filter(cId => cId !== id) }));
      return { containers: newContainers, volumes: updatedVolumes, networks: newNetworks };
    }),

    updateContainer: (id, updates) => set(state => {
      const newContainers = state.containers.map(c => c.id === id ? { ...c, ...updates } : c);
      const newNetworks = syncNetworksWithContainers(newContainers, state.networks);
      return { containers: newContainers, networks: newNetworks };
    }),

    addVolume: (volume) => set(state => ({ volumes: [...state.volumes, volume] })),
    removeVolume: (id) => set(state => ({ volumes: state.volumes.filter(v => v.id !== id) })),
    updateVolume: (id, updates) => set(state => ({ volumes: state.volumes.map(v => v.id === id ? { ...v, ...updates } : v) })),
    
    addNetwork: (network) => set(state => ({ networks: [...state.networks, network] })),
    removeNetwork: (networkName) => set(state => ({
      networks: state.networks.filter(n => n.name !== networkName),
    })),
    updateNetwork: (id, updates) => set(state => ({ networks: state.networks.map(n => n.id === id ? { ...n, ...updates } : n) })),

    saveSimulation: async (title, shareStatus) => {
      const { simulationId, containers, volumes, networks, localImages, terminalHistory } = get();
      const dockerState: DockerState = { containers, volumes, networks, localImages, terminalHistory };
      
      const { accessToken, user } = useAuthStore.getState(); // useAuthStore에서 상태 가져오기

      console.log("--- saveSimulation Debug Info ---");
      console.log("AccessToken:", accessToken ? "Present" : "Missing");
      console.log("User:", user);
      console.log("User Public ID:", user?.userPublicId);
      console.log("---------------------------------");

      if (!accessToken || !user?.userPublicId) {
        get().addMessage('Error: 로그인 정보가 없거나 유효하지 않아 시뮬레이션을 저장할 수 없습니다.');
        return null;
      }

      const serializedState = JSON.stringify(dockerState, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });

      const request = {
        title: title,
        dockerState: serializedState,
        shareState: shareStatus, // shareStatus -> shareState로 변경
      };
      console.log("useDockerStore: Simulation save request payload:", request);

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
        get().addMessage(`Error: 시뮬레이션 저장에 실패했습니다. ${error instanceof Error ? error.message : ''}`);
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
            ...dockerState,
            simulationId: response.simulationPublicId,
            simulationTitle: response.title,
          });
          get().addMessage(`시뮬레이션 "${response.title}"을(를) 불러왔습니다.`);
        }
      } catch (error) {
        console.error('Failed to load simulation:', error);
        get().addMessage(`Error: 시뮬레이션 불러오기에 실패했습니다. ${error instanceof Error ? error.message : ''}`);
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