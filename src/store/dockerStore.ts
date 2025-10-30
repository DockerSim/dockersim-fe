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

  executeCommand: (command) => {
    const { addTerminalHistory, clearTerminalHistory, pendingConfirmation, ...actions } = get();
    let output = '';
    let isError = false;

    if (pendingConfirmation) {
      if (command.toLowerCase() === 'y') {
        pendingConfirmation.onConfirm();
      } else {
        addTerminalHistory({ id: `cmd_${Date.now()}`, command, output: 'Aborted.', timestamp: new Date().toISOString(), isError: false });
      }
      set({ pendingConfirmation: null });
      return;
    }

    try {
      if (!command.trim()) return;
      const parts = command.trim().split(/\s+/);
      const [dockerCommand, subCommand, ...args] = parts;

      if (dockerCommand !== 'docker') throw new Error(`command not found: ${dockerCommand}`);

      switch (subCommand) {
        case 'run': {
            const nameMatch = command.match(/--name\s+(\S+)/);
            const networkMatch = command.match(/--network\s+(\S+)/);
            const volumeMatches = [...command.matchAll(/(?:-v|--volume)\s+([^:]+):(\S+)/g)];
            const image = args.filter(arg => !arg.startsWith('-')).pop() || '';

            if (!image) throw new Error('"docker run" requires an image name.');
            
            const containerName = nameMatch ? nameMatch[1] : `container_${Date.now()}`;
            const targetNetworkName = networkMatch ? networkMatch[1] : 'bridge';
            
            const newContainerVolumes: Volume[] = [];
            volumeMatches.forEach(match => {
                const volumeName = match[1];
                const containerPath = match[2];
                let volume = get().volumes.find(v => v.name === volumeName);
                if (!volume) {
                    const newVolume: Volume = { id: volumeName, name: volumeName, driver: 'local', scope: 'local', createdAt: new Date(), mountPath: `/var/lib/docker/volumes/${volumeName}/_data`, labels: null, options: null, connectedContainers: [], isNew: true };
                    actions.addVolume(newVolume);
                    volume = newVolume;
                }
                newContainerVolumes.push({ ...volume, mountPath: containerPath });
                const updatedConnectedContainers = Array.from(new Set([...(volume.connectedContainers || []), containerName]));
                actions.updateVolume(volume.id, { connectedContainers: updatedConnectedContainers });
            });

            const newContainer: Container = { id: containerName, name: containerName, image, status: 'running', ports: [], network: targetNetworkName, volumes: newContainerVolumes, created: new Date(), isNew: true };
            actions.addContainer(newContainer);
            output = containerName;
            break;
        }
        case 'start':
        case 'stop':
        case 'pause': {
            const containerName = args[0];
            const targetContainer = get().containers.find(c => c.name === containerName || c.id === containerName);
            if (!targetContainer) throw new Error(`No such container: ${containerName}`);
            const newStatus = subCommand === 'start' ? 'running' : (subCommand === 'stop' ? 'stopped' : 'paused');
            actions.updateContainer(targetContainer.id, { status: newStatus });
            output = containerName;
            break;
        }
        case 'rm': {
            const containerName = args[0];
            const targetContainer = get().containers.find(c => c.name === containerName || c.id === containerName);
            if (!targetContainer) throw new Error(`No such container: ${containerName}`);
            actions.removeContainer(targetContainer.id);
            output = containerName;
            break;
        }
        case 'network': {
            const [netSubCmd, ...netArgs] = args;
            switch(netSubCmd) {
                case 'create': {
                    const networkName = netArgs[0];
                    if (!networkName) throw new Error('docker network create requires a network name');
                    if (get().networks.some(n => n.name === networkName)) throw new Error(`network with name ${networkName} already exists`);
                    actions.addNetwork({ id: `net_${networkName}_${Date.now()}`, name: networkName, driver: 'bridge', scope: 'local', createdAt: new Date(), containers: [], isNew: true });
                    output = networkName;
                    break;
                }
                // ... other network commands
                default: throw new Error(`Unknown docker network command: "${netSubCmd}"`);
            }
            break;
        }
        case 'volume': {
            const [volSubCmd, ...volArgs] = args;
            switch(volSubCmd) {
                case 'create': {
                    const volumeName = volArgs[0] || `vol_${Date.now()}`;
                    if (get().volumes.some(v => v.name === volumeName)) throw new Error(`volume with name ${volumeName} already exists`);
                    actions.addVolume({ id: volumeName, name: volumeName, driver: 'local', scope: 'local', createdAt: new Date(), mountPath: `/var/lib/docker/volumes/${volumeName}/_data`, labels: null, options: null, connectedContainers: [], isNew: true });
                    output = volumeName;
                    break;
                }
                case 'inspect': {
                    const volumeName = volArgs[0];
                    if (!volumeName) throw new Error('docker volume inspect requires a volume name');
                    const volume = get().volumes.find(v => v.name === volumeName);
                    if (!volume) throw new Error(`No such volume: ${volumeName}`);
                    const {isNew, ...rest} = volume;
                    output = JSON.stringify([rest], null, 2);
                    break;
                }
                case 'ls':
                case 'list': {
                    const quiet = volArgs.includes('-q') || volArgs.includes('--quiet');
                    if (quiet) {
                        output = get().volumes.map(v => v.name).join('\n');
                    } else {
                        const headers = "DRIVER".padEnd(10) + "VOLUME NAME";
                        const rows = get().volumes.map(v => `local`.padEnd(10) + v.name);
                        output = [headers, ...rows].join('\n');
                    }
                    break;
                }
                case 'rm':
                case 'remove': {
                    const volumeName = volArgs[0];
                    if (!volumeName) throw new Error(`docker volume ${volSubCmd} requires a volume name`);
                    const volume = get().volumes.find(v => v.name === volumeName);
                    if (!volume) throw new Error(`No such volume: ${volumeName}`);
                    if (volume.connectedContainers.length > 0) throw new Error(`remove ${volumeName}: volume is in use`);
                    actions.removeVolume(volume.id);
                    output = volumeName;
                    break;
                }
                case 'prune': {
                    const unusedVolumes = get().volumes.filter(v => v.connectedContainers.length === 0);
                    const onConfirm = () => {
                        const deletedNames = unusedVolumes.map(v => v.name);
                        unusedVolumes.forEach(v => actions.removeVolume(v.id));
                        get().addTerminalHistory({ id: `cmd_${Date.now()}`, command, output: `Deleted Volumes:\n${deletedNames.join('\n')}`, timestamp: new Date().toISOString(), isError: false });
                    };
                    set({ pendingConfirmation: { message: 'WARNING! This will remove all local volumes not used by at least one container.\nAre you sure you want to continue? [y/N]', onConfirm } });
                    output = get().pendingConfirmation!.message;
                    break;
                }
                default: throw new Error(`Unknown docker volume command: "${volSubCmd}"`);
            }
            break;
        }
        case 'system': {
            // ... system prune logic
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

    if (!get().pendingConfirmation) {
        addTerminalHistory({ id: `cmd_${Date.now()}`, command, output, timestamp: new Date().toISOString(), isError });
    }
  },

  // --- State Update Functions ---
  addContainer: (container) => set((state) => {
    const updatedNetworks = state.networks.map(network => {
      if (network.name === container.network) {
        return { ...network, containers: [...network.containers, container] };
      }
      return network;
    });
    return { containers: [...state.containers, container], networks: updatedNetworks };
  }),

  removeContainer: (id) => set((state) => {
    const containerToRemove = state.containers.find(c => c.id === id);
    if (!containerToRemove) return state;
    const updatedNetworks = state.networks.map(network => {
      if (network.containers.some(c => c.id === id)) {
        return { ...network, containers: network.containers.filter(c => c.id !== id) };
      }
      return network;
    });
    const updatedVolumes = state.volumes.map(volume => {
      if (volume.connectedContainers.includes(id)) {
        return { ...volume, connectedContainers: volume.connectedContainers.filter(cId => cId !== id) };
      }
      return volume;
    });
    return { containers: state.containers.filter(c => c.id !== id), networks: updatedNetworks, volumes: updatedVolumes };
  }),

  updateContainer: (id, updates) => set((state) => {
    const originalContainer = state.containers.find(c => c.id === id);
    if (!originalContainer) return state;
    const updatedContainer = { ...originalContainer, ...updates };
    const newContainers = state.containers.map(c => c.id === id ? updatedContainer : c);
    let newNetworks = state.networks;
    if (updates.network !== undefined && originalContainer.network !== updates.network) {
      newNetworks = state.networks.map(net => {
        if (net.name === originalContainer.network) {
          return { ...net, containers: net.containers.filter(c => c.id !== id) };
        }
        if (net.name === updates.network) {
          return { ...net, containers: [...net.containers, updatedContainer] };
        }
        return net;
      });
    }
    return { containers: newContainers, networks: newNetworks };
  }),
  
  addVolume: (volume) => set(state => ({ volumes: [...state.volumes, volume] })),
  removeVolume: (id) => set(state => ({ volumes: state.volumes.filter(v => v.id !== id) })),
  updateVolume: (id, updates) => set(state => ({ volumes: state.volumes.map(v => v.id === id ? {...v, ...updates} : v) })),
  addNetwork: (network) => set(state => ({ networks: [...state.networks, network] })),
  removeNetwork: (id) => set(state => ({ networks: state.networks.filter(n => n.id !== id) })),
  updateNetwork: (id, updates) => set(state => ({ networks: state.networks.map(n => n.id === id ? {...n, ...updates} : n) }))
}));
