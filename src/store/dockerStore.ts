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
  containers: Container[]
  volumes: Volume[]
  networks: Network[]
  terminalHistory: TerminalHistory[]
  currentCommand: string
  setCurrentCommand: (command: string) => void
  addTerminalHistory: (history: TerminalHistory) => void
  clearTerminalHistory: () => void
  executeCommand: (command: string) => void
  addMessage: (message: string) => void
  addContainer: (container: Container) => void
  removeContainer: (id: string) => void
  updateContainer: (id: string, updates: Partial<Container>) => void
  addVolume: (volume: Volume) => void
  removeVolume: (id: string) => void
  updateVolume: (id: string, updates: Partial<Volume>) => void
  addNetwork: (network: Network) => void
  removeNetwork: (id: string) => void
  updateNetwork: (id: string, updates: Partial<Network>) => void
}

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
      containers: exampleContainers,
      driver: 'bridge'
    }
  ],
  terminalHistory: [],
  currentCommand: '',

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
    const { 
        addTerminalHistory, addContainer, removeContainer, updateContainer, 
        addVolume, removeVolume, updateVolume, addNetwork, removeNetwork, 
        clearTerminalHistory, containers, volumes, networks 
    } = get();
    const timestamp = new Date().toISOString();
    let output = '';
    let isError = false;

    try {
        if (!command.trim()) return;

        const parts = command.trim().split(/\s+/);
        const dockerCommand = parts[0];
        const subCommand = parts[1];

        if (dockerCommand !== 'docker') {
            throw new Error(`command not found: ${dockerCommand}`);
        }

        switch (subCommand) {
            case 'run': {
                const nameMatch = command.match(/--name\s+(\S+)/);
                const networkMatch = command.match(/--network\s+(\S+)/);
                const volumeMatches = [...command.matchAll(/(?:-v|--volume)\s+([^:]+):(\S+)/g)];
                
                const imageArgIndex = parts.slice(2).findIndex(p => !p.startsWith('-'));
                const image = imageArgIndex !== -1 ? parts[imageArgIndex + 2] : '';

                if (image) {
                    const containerName = nameMatch ? nameMatch[1] : `container_${Date.now()}`;
                    const targetNetworkName = networkMatch ? networkMatch[1] : 'bridge';
                    
                    const newContainerVolumes: Volume[] = [];
                    
                    volumeMatches.forEach(match => {
                        const volumeName = match[1];
                        const containerPath = match[2];
                        let volume = get().volumes.find(v => v.name === volumeName);

                        if (!volume) {
                            const newVolume: Volume = {
                                id: `vol_${volumeName}_${Date.now()}`,
                                name: volumeName,
                                mountPath: `/var/lib/docker/volumes/${volumeName}/_data`,
                                connectedContainers: [],
                                networkId: targetNetworkName,
                                isNew: true,
                            };
                            addVolume(newVolume);
                            volume = newVolume;
                        }
                        
                        newContainerVolumes.push({ ...volume, containerPath });

                        const updatedConnectedContainers = Array.from(new Set([...(volume.connectedContainers || []), containerName]));
                        updateVolume(volume.id, { connectedContainers: updatedConnectedContainers });
                    });

                    const newContainer: Container = {
                        id: containerName,
                        name: containerName,
                        image: image,
                        status: 'running',
                        ports: [],
                        network: targetNetworkName,
                        volumes: newContainerVolumes,
                        created: new Date(),
                        isNew: true
                    };

                    addContainer(newContainer);
                    output = containerName;
                } else {
                    throw new Error('"docker run" requires an image name.');
                }
                break;
            }
            case 'start':
            case 'stop':
            case 'pause': {
                const containerName = parts[2];
                const targetContainer = get().containers.find(c => c.name === containerName || c.id === containerName);
                if (targetContainer) {
                    const newStatus = subCommand === 'start' ? 'running' : (subCommand === 'stop' ? 'stopped' : 'paused');
                    updateContainer(targetContainer.id, { status: newStatus });
                    output = containerName;
                } else {
                    throw new Error(`No such container: ${containerName}`);
                }
                break;
            }
            case 'rm': {
                const containerName = parts[2];
                const targetContainer = get().containers.find(c => c.name === containerName || c.id === containerName);
                if (targetContainer) {
                    (targetContainer.volumes || []).forEach(volInContainer => {
                        const globalVol = get().volumes.find(v => v.id === volInContainer.id);
                        if (globalVol) {
                            const updatedConnections = globalVol.connectedContainers.filter(cId => cId !== targetContainer.id);
                            updateVolume(globalVol.id, { connectedContainers: updatedConnections });
                        }
                    });
                    removeContainer(targetContainer.id);
                    output = containerName;
                } else {
                    throw new Error(`No such container: ${containerName}`);
                }
                break;
            }
            case 'volume': {
                const volumeSubCommand = parts[2];
                const volumeName = parts[3];
                if (volumeSubCommand === 'create') {
                    addVolume({
                        id: `vol_${volumeName || Date.now()}`,
                        name: volumeName || `volume_${Date.now()}`,
                        mountPath: `/var/lib/docker/volumes/${volumeName}/_data`,
                        connectedContainers: [],
                        networkId: 'bridge',
                        isNew: true,
                    });
                    output = volumeName;
                } else if (volumeSubCommand === 'rm') {
                    const targetVolume = get().volumes.find(v => v.name === volumeName);
                    if (targetVolume) {
                        if (targetVolume.connectedContainers && targetVolume.connectedContainers.length > 0) {
                            throw new Error(`remove ${volumeName}: volume is in use`);
                        } else {
                            removeVolume(targetVolume.id);
                            output = volumeName;
                        }
                    } else {
                        throw new Error(`No such volume: ${volumeName}`);
                    }
                } else {
                    throw new Error(`Unknown docker volume command: "${volumeSubCommand}"`);
                }
                break;
            }
            case 'network': {
                 const networkSubCommand = parts[2];
                 const networkName = parts[3];
                 if (networkSubCommand === 'create') {
                    addNetwork({
                        id: `net_${networkName || Date.now()}`,
                        name: networkName || `network_${Date.now()}`,
                        containers: [],
                        isNew: true,
                    });
                    output = networkName;
                 } else {
                    throw new Error(`Unknown docker network command: "${networkSubCommand}"`);
                 }
                break;
            }
            case 'clear': {
                clearTerminalHistory();
                return;
            }
            default: {
                throw new Error(`'${subCommand}' is not a docker command.`);
            }
        }
    } catch (e: any) {
        output = e.message;
        isError = true;
    }

    addTerminalHistory({
        id: `cmd_${Date.now()}`,
        command,
        output,
        timestamp,
        isError,
    });
  },
  
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