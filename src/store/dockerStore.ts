import { create } from 'zustand'

// 타입 정의
export interface Container {
  id: string
  name: string
  image: string
  status: 'running' | 'stopped' | 'paused'
  ports: Port[]
  volumes?: Volume[]
  network: string | null
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
  driver: string
  scope: 'local' | 'global'
  createdAt: Date
  containers: Container[]
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
      driver: 'bridge',
      scope: 'local',
      createdAt: new Date(),
      containers: [],
      subnet: '172.17.0.0/16',
      gateway: '172.17.0.1'
    },
    {
      id: 'custom-net-1',
      name: 'custom-net-1',
      driver: 'bridge',
      scope: 'local',
      createdAt: new Date(),
      containers: exampleContainers,
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
        clearTerminalHistory
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
                switch (networkSubCommand) {
                    case 'create': {
                        const networkName = parts[3];
                        if (!networkName) throw new Error('docker network create requires a network name');
                        if (get().networks.some(n => n.name === networkName)) throw new Error(`network with name ${networkName} already exists`);
                        
                        addNetwork({
                            id: `net_${networkName}_${Date.now()}`,
                            name: networkName,
                            driver: 'bridge',
                            scope: 'local',
                            createdAt: new Date(),
                            containers: [],
                            isNew: true,
                        });
                        output = networkName;
                        break;
                    }
                    case 'rm':
                    case 'remove': {
                        const networkName = parts[3];
                        if (!networkName) throw new Error(`"docker network ${networkSubCommand}" requires a network name`);
                        const network = get().networks.find(n => n.name === networkName || n.id === networkName);
                        if (!network) throw new Error(`network "${networkName}" not found`);
                        if (network.containers.length > 0) throw new Error(`network "${networkName}" is in use and cannot be removed`);
                        
                        removeNetwork(network.id);
                        output = networkName;
                        break;
                    }
                    case 'connect': {
                        const networkName = parts[3];
                        const containerName = parts[4];
                        if (!networkName || !containerName) throw new Error('docker network connect requires network and container names');
                        
                        const network = get().networks.find(n => n.name === networkName);
                        const container = get().containers.find(c => c.name === containerName);

                        if (!network) throw new Error(`Network ${networkName} not found.`);
                        if (!container) throw new Error(`Container ${containerName} not found.`);

                        updateContainer(container.id, { network: network.name });
                        output = `Connected container ${containerName} to network ${networkName}`;
                        break;
                    }
                    case 'disconnect': {
                        const networkName = parts[3];
                        const containerName = parts[4];
                        if (!networkName || !containerName) throw new Error('docker network disconnect requires network and container names');

                        const container = get().containers.find(c => c.name === containerName);
                        if (!container) throw new Error(`Container ${containerName} not found.`);
                        if (container.network !== networkName) throw new Error(`Container ${containerName} is not connected to network ${networkName}`);

                        updateContainer(container.id, { network: null });
                        output = `Disconnected container ${containerName} from network ${networkName}`;
                        break;
                    }
                    case 'ls':
                    case 'list': {
                        const quiet = parts.includes('-q') || parts.includes('--quiet');
                        if (quiet) {
                            output = get().networks.map(n => n.id).join('\n');
                        } else {
                            const headers = "NETWORK ID".padEnd(15) + "NAME".padEnd(20) + "DRIVER".padEnd(10) + "SCOPE";
                            const rows = get().networks.map(n => 
                                n.id.substring(0, 12).padEnd(15) + 
                                n.name.padEnd(20) + 
                                n.driver.padEnd(10) + 
                                n.scope
                            );
                            output = [headers, ...rows].join('\n');
                        }
                        break;
                    }
                    case 'inspect': {
                        const networkName = parts[3];
                        if (!networkName) throw new Error('docker network inspect requires a network name');
                        const network = get().networks.find(n => n.name === networkName || n.id === networkName);
                        if (!network) throw new Error(`No such network: ${networkName}`);
                        
                        const containerInfo = network.containers.reduce((acc, c) => {
                            acc[c.id] = { Name: c.name, IPv4Address: 'N/A' };
                            return acc;
                        }, {} as Record<string, any>);

                        const inspectResult = {
                            Name: network.name,
                            Id: network.id,
                            Created: network.createdAt.toISOString(),
                            Scope: network.scope,
                            Driver: network.driver,
                            Containers: containerInfo,
                        };
                        output = JSON.stringify([inspectResult], null, 2);
                        break;
                    }
                    case 'prune': {
                        const unusedNetworks = get().networks.filter(n => n.name !== 'bridge' && n.containers.length === 0);
                        if (unusedNetworks.length === 0) {
                            output = "Total reclaimed space: 0B";
                        } else {
                            const networkNames = unusedNetworks.map(n => n.name);
                            unusedNetworks.forEach(n => removeNetwork(n.id));
                            output = `Deleted Networks:\n${networkNames.join('\n')}\n\nTotal reclaimed space: 0B`;
                        }
                        break;
                    }
                    default:
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
    set((state) => {
      const containerToRemove = state.containers.find(c => c.id === id);
      if (!containerToRemove) return state;

      const updatedNetworks = state.networks.map(network => {
        if (network.name === containerToRemove.network || network.id === containerToRemove.network) {
          return {
            ...network,
            containers: network.containers.filter(c => c.id !== id)
          };
        }
        return network;
      });
      
      return { 
        containers: state.containers.filter(c => c.id !== id),
        networks: updatedNetworks
      }
    }),
  
  updateContainer: (id: string, updates: Partial<Container>) => 
    set((state) => {
      const originalContainer = state.containers.find(c => c.id === id);
      if (!originalContainer) return state;

      const updatedContainer = { ...originalContainer, ...updates };
      const newContainers = state.containers.map(c => c.id === id ? updatedContainer : c);

      let newNetworks = state.networks;
      // If network has changed, update the network's container list
      if (updates.network !== undefined && originalContainer.network !== updates.network) {
        newNetworks = state.networks.map(net => {
          // Remove from old network
          if (net.name === originalContainer.network || net.id === originalContainer.network) {
            return { ...net, containers: net.containers.filter(c => c.id !== id) };
          }
          // Add to new network
          if (net.name === updates.network || net.id === updates.network) {
            return { ...net, containers: [...net.containers, updatedContainer] };
          }
          return net;
        });
      }

      return { 
        containers: newContainers,
        networks: newNetworks
      };
    }),
  
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
