import { create } from 'zustand'

// 타입 정의
export interface Container {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'paused'
  ports: Port[]
  volumes?: Volume[]
  network: string
  created: Date
  command?: string
  environment?: Record<string, string>
  isNew?: boolean
}

export interface Volume {
  id: string
  name: string
  mountPath: string
  containerPath?: string
  connectedContainers: string[]
  networkId?: string
  isNew?: boolean
}

export interface Network {
  id: string
  name: string
  containers: Container[]
  driver?: string
  subnet?: string
  gateway?: string
  isNew?: boolean
}

export interface Port {
  hostPort: number
  containerPort: number
  protocol: 'tcp' | 'udp'
}

export interface TerminalHistory {
  id: string
  command: string
  output: string
  timestamp: string
  isError: boolean
}

interface DockerStore {
  // 상태
  containers: Container[]
  volumes: Volume[]
  networks: Network[]
  terminalHistory: TerminalHistory[]
  currentCommand: string

  // 액션
  setCurrentCommand: (command: string) => void
  addTerminalHistory: (history: TerminalHistory) => void
  clearTerminalHistory: () => void
  executeCommand: (command: string) => void
  addMessage: (message: string) => void
  
  // 컨테이너 액션
  addContainer: (container: Container) => void
  removeContainer: (id: string) => void
  updateContainer: (id: string, updates: Partial<Container>) => void
  
  // 볼륨 액션
  addVolume: (volume: Volume) => void
  removeVolume: (id: string) => void
  updateVolume: (id: string, updates: Partial<Volume>) => void
  
  // 네트워크 액션
  addNetwork: (network: Network) => void
  removeNetwork: (id: string) => void
  updateNetwork: (id: string, updates: Partial<Network>) => void
}

// --- 예시 데이터 --- 
const exampleVolume: Volume = {
  id: 'db-data',
  name: 'db-data',
  mountPath: '/var/lib/docker/volumes/db-data',
  connectedContainers: ['database'],
  networkId: 'custom-net-1'
};

const exampleContainers: Container[] = [
  {
    id: 'web-server',
    name: 'web-server',
    image: 'nginx:latest',
    status: 'running',
    ports: [],
    network: 'custom-net-1',
    created: new Date(),
  },
  {
    id: 'database',
    name: 'database',
    image: 'postgres:13',
    status: 'running',
    ports: [],
    volumes: [exampleVolume],
    network: 'custom-net-1',
    created: new Date(),
  }
];

export const useDockerStore = create<DockerStore>((set, get) => ({
  // --- 초기 상태 (예시 데이터 포함) ---
  containers: exampleContainers,
  volumes: [exampleVolume],
  networks: [
    {
      id: 'bridge',
      name: 'bridge',
      containers: [],
      driver: 'bridge',
      subnet: '172.17.0.0/16',
      gateway: '172.17.0.1'
    },
    {
      id: 'custom-net-1',
      name: 'custom-net-1',
      containers: exampleContainers, // `web-server`와 `database` 컨테이너를 포함
      driver: 'bridge'
    }
  ],
  terminalHistory: [],
  currentCommand: '',

  // 액션 구현
  setCurrentCommand: (command: string) => set({ currentCommand: command }),
  
  addTerminalHistory: (history: TerminalHistory) => 
    set((state) => ({ 
      terminalHistory: [...state.terminalHistory, history] 
    })),
  
  clearTerminalHistory: () => set({ terminalHistory: [] }),

  addMessage: (message: string) => {
    const { addTerminalHistory } = get()
    addTerminalHistory({
      id: `msg_${Date.now()}`,
      command: '',
      output: message,
      timestamp: new Date().toISOString(),
      isError: false
    })
  },
  
  executeCommand: (command: string) => {
    const { addTerminalHistory, addContainer, removeContainer, updateContainer, addVolume, addNetwork, clearTerminalHistory, containers } = get()
    const timestamp = new Date().toISOString()
    let output = ''
    let isError = false

    try {
      if (!command.trim()) return;

      const parts = command.trim().split(/\s+/);
      const dockerCommand = parts[1];

      if (dockerCommand === 'run') {
        const nameMatch = command.match(/--name\s+(\S+)/)
        const networkMatch = command.match(/--network\s+(\S+)/)
        const imageMatch = command.match(/(\S+)(?:\s+(.*))?$/)
        
        if (imageMatch) {
          const image = imageMatch[1]
          const containerName = nameMatch ? nameMatch[1] : `container_${Date.now()}`
          const targetNetwork = networkMatch ? networkMatch[1] : 'bridge'
          
          addContainer({
            id: containerName,
            name: containerName,
            image: image,
            status: 'running',
            ports: [],
            network: targetNetwork,
            created: new Date(),
            isNew: true
          })
          
          output = `Container ${containerName} created and started in network ${targetNetwork}`
        } else {
          output = 'Error: Invalid docker run command'
          isError = true
        }
      } else if (dockerCommand === 'start') {
        const containerName = parts[2];
        const targetContainer = containers.find(c => c.name === containerName || c.id === containerName);
        if (targetContainer) {
          updateContainer(targetContainer.id, { status: 'running' });
          output = containerName;
        } else {
          output = `Error: No such container: ${containerName}`;
          isError = true;
        }
      } else if (dockerCommand === 'stop') {
        const containerName = parts[2];
        const targetContainer = containers.find(c => c.name === containerName || c.id === containerName);
        if (targetContainer) {
          updateContainer(targetContainer.id, { status: 'stopped' });
          output = containerName;
        } else {
          output = `Error: No such container: ${containerName}`;
          isError = true;
        }
      } else if (dockerCommand === 'rm') {
        const containerName = parts[2];
        const targetContainer = containers.find(c => c.name === containerName || c.id === containerName);
        if (targetContainer) {
          removeContainer(targetContainer.id);
          output = containerName;
        } else {
          output = `Error: No such container: ${containerName}`;
          isError = true;
        }
      } else if (command.startsWith('docker volume create')) {
        const networkMatch = command.match(/--network\s+(\S+)/)
        const targetNetworkId = networkMatch ? networkMatch[1] : 'bridge'
        
        let volumeName;
        if (networkMatch) {
          const networkIndex = parts.findIndex(part => part === '--network');
          volumeName = parts[networkIndex + 2] || `volume_${Date.now()}`;
        } else {
          volumeName = parts[3] || `volume_${Date.now()}`;
        }
        
        addVolume({
          id: `vol_${Date.now()}`,
          name: volumeName,
          mountPath: '/var/lib/docker/volumes',
          connectedContainers: [],
          networkId: targetNetworkId
        })
        
        output = `Volume ${volumeName} created in network ${targetNetworkId}`
      } else if (command.startsWith('docker network create')) {
        const networkName = parts[3] || `network_${Date.now()}`
        
        addNetwork({
          id: `net_${Date.now()}`,
          name: networkName,
          containers: [],
          isNew: true
        })
        
        output = `Network ${networkName} created`
      } else if (command === 'clear') {
        clearTerminalHistory()
        return
      } else {
        output = `Command executed: ${command}`
      }
    } catch (error) {
      output = `Error executing command: ${error}`
      isError = true
    }

    addTerminalHistory({
      id: `cmd_${Date.now()}`,
      command,
      output,
      timestamp,
      isError
    })
  },
  
  // 컨테이너 액션
  addContainer: (container: Container) => 
    set((state) => {
      const updatedNetworks = state.networks.map(network => {
        if (network.name === container.network || network.id === container.network) {
          return {
            ...network,
            containers: [...network.containers, container]
          };
        }
        return network;
      });

      return {
        containers: [...state.containers, container],
        networks: updatedNetworks
      };
    }),
  
  removeContainer: (id: string) => 
    set((state) => ({ 
      containers: state.containers.filter(c => c.id !== id) 
    })),
  
  updateContainer: (id: string, updates: Partial<Container>) => 
    set((state) => ({ 
      containers: state.containers.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ) 
    })),
  
  // 볼륨 액션
  addVolume: (volume: Volume) => 
    set((state) => ({ 
      volumes: [...state.volumes, volume] 
    })),
  
  removeVolume: (id: string) => 
    set((state) => ({ 
      volumes: state.volumes.filter(v => v.id !== id) 
    })),
  
  updateVolume: (id: string, updates: Partial<Volume>) => 
    set((state) => ({ 
      volumes: state.volumes.map(v => 
        v.id === id ? { ...v, ...updates } : v
      ) 
    })),
  
  // 네트워크 액션
  addNetwork: (network: Network) => 
    set((state) => ({ 
      networks: [...state.networks, network] 
    })),
  
  removeNetwork: (id: string) => 
    set((state) => ({ 
      networks: state.networks.filter(n => n.id !== id) 
    })),
  
  updateNetwork: (id: string, updates: Partial<Network>) => 
    set((state) => ({ 
      networks: state.networks.map(n => 
        n.id === id ? { ...n, ...updates } : n
      ) 
    }))
}))