import { create } from 'zustand';

// --- 타입 정의 ---
export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused';
  ports: Port[];
  volumes?: Volume[];
  network: string | null;
  created: Date;
  command?: string;
  environment?: Record<string, string>;
  isNew?: boolean;
}

export interface Volume {
  id: string;
  name: string;
  driver: string;
  scope: 'local' | 'global';
  createdAt: Date;
  mountPath: string;
  labels: Record<string, string> | null;
  options: Record<string, string> | null;
  connectedContainers: string[];
  isNew?: boolean;
}

export interface Network {
  id: string;
  name: string;
  driver: string;
  scope: 'local' | 'global';
  createdAt: Date;
  containers: Container[];
  subnet?: string;
  gateway?: string;
  isNew?: boolean;
}

export interface Port {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
}

export interface TerminalHistory {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  isError: boolean;
}

interface PendingConfirmation {
  message: string;
  onConfirm: () => void;
}

interface DockerStore {
  containers: Container[];
  volumes: Volume[];
  networks: Network[];
  terminalHistory: TerminalHistory[];
  currentCommand: string;
  pendingConfirmation: PendingConfirmation | null;
  setCurrentCommand: (command: string) => void;
  addTerminalHistory: (history: TerminalHistory) => void;
  clearTerminalHistory: () => void;
  executeCommand: (command: string) => void;
  addMessage: (message: string) => void;
  generateComposeFile: () => string; // 함수 추가
  addContainer: (container: Container) => void;
  removeContainer: (id: string) => void;
  updateContainer: (id: string, updates: Partial<Container>) => void;
  addVolume: (volume: Volume) => void;
  removeVolume: (id: string) => void;
  updateVolume: (id: string, updates: Partial<Volume>) => void;
  addNetwork: (network: Network) => void;
  removeNetwork: (id: string) => void;
  updateNetwork: (id: string, updates: Partial<Network>) => void;
}

export const useDockerStore = create<DockerStore>((set, get) => ({
  containers: [],
  volumes: [],
  networks: [
    {
      id: 'bridge',
      name: 'bridge',
      driver: 'bridge',
      scope: 'local',
      createdAt: new Date(),
      containers: [],
      subnet: '172.17.0.0/16',
      gateway: '172.17.0.1',
    },
  ],
  terminalHistory: [],
  currentCommand: '',
  pendingConfirmation: null,

  setCurrentCommand: (command) => set({ currentCommand: command }),
  addTerminalHistory: (history) => set((state) => ({ terminalHistory: [...state.terminalHistory, history] })),
  clearTerminalHistory: () => set({ terminalHistory: [] }),
  addMessage: (message) => {
    get().addTerminalHistory({
      id: `msg_${Date.now()}`,
      command: '',
      output: message,
      timestamp: new Date().toISOString(),
      isError: false,
    });
  },

  generateComposeFile: () => {
    const { containers, volumes, networks } = get();
    let services = '';
    let topLevelVolumes = '';
    let topLevelNetworks = '';

    const definedVolumes = new Set<string>();

    containers.forEach(c => {
      services += `  ${c.name}:\n`;
      services += `    image: ${c.image}\n`;
      if (c.network && c.network !== 'bridge') {
        services += `    networks:\n      - ${c.network}\n`;
      }
      if (c.ports.length > 0) {
        services += `    ports:\n`;
        c.ports.forEach(p => {
          services += `      - "${p.hostPort}:${p.containerPort}"\n`;
        });
      }
      if (c.volumes && c.volumes.length > 0) {
        services += `    volumes:\n`;
        c.volumes.forEach(v => {
          services += `      - ${v.name}:${v.mountPath}\n`;
          definedVolumes.add(v.name);
        });
      }
      services += '\n';
    });

    if (definedVolumes.size > 0) {
      topLevelVolumes = 'volumes:\n';
      definedVolumes.forEach(vName => {
        topLevelVolumes += `  ${vName}:\n`;
      });
      topLevelVolumes += '\n';
    }

    const customNetworks = networks.filter(n => n.name !== 'bridge');
    if (customNetworks.length > 0) {
      topLevelNetworks = 'networks:\n';
      customNetworks.forEach(n => {
        topLevelNetworks += `  ${n.name}:\n`;
      });
    }

    return `version: '3.8'\n\nservices:\n${services}${topLevelVolumes}${topLevelNetworks}`;
  },

  executeCommand: (command) => {
    // ... (이전 executeCommand 로직과 동일)
  },

  // ... (나머지 상태 업데이트 함수들)
}));
