import { create } from 'zustand';
import { ResourceCreationData } from '../components/modals/ResourceCreationModal';

// --- 타입 정의 ---
export interface Port { hostPort: number; containerPort: number; protocol: 'tcp' | 'udp'; }
export interface Volume { id: string; name: string; driver: string; scope: 'local' | 'global'; createdAt: Date; mountPath: string; labels: Record<string, string> | null; options: Record<string, string> | null; connectedContainers: string[]; }
export interface Container { id: string; name: string; image: string; status: 'running' | 'stopped' | 'paused'; ports: Port[]; volumes: Volume[]; network: string[]; created: Date; }
export interface Network { id: string; name: string; driver: string; scope: 'local' | 'global'; createdAt: Date; containers: Container[]; }
export interface DockerImage { id: string; name: string; tag: string; created: Date; size: string; }
export interface TerminalHistory { id: string; command: string; output: string; timestamp: string; isError: boolean; }

interface DockerStore {
  containers: Container[];
  volumes: Volume[];
  networks: Network[];
  localImages: DockerImage[];
  terminalHistory: TerminalHistory[];
  executeCommand: (command: string, isInternal?: boolean) => void;
  createContainerInNetworks: (data: ResourceCreationData) => void;
  addMessage: (message: string) => void;
  generateComposeFile: () => string;
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

// --- 더미 데이터 ---
const initialLocalImages: DockerImage[] = [
    { id: 'sha256:nginx123', name: 'nginx', tag: 'latest', created: new Date(), size: '133MB' },
    { id: 'sha256:ubuntu123', name: 'ubuntu', tag: 'latest', created: new Date(), size: '72.9MB' },
    { id: 'sha256:python123', name: 'python', tag: '3.9-slim', created: new Date(), size: '114MB' },
    { id: 'sha256:mysql123', name: 'mysql', tag: 'latest', created: new Date(), size: '544MB' },
];

export const useDockerStore = create<DockerStore>((set, get) => ({
  containers: [],
  volumes: [],
  networks: [
    { id: 'bridge', name: 'bridge', driver: 'bridge', scope: 'local', createdAt: new Date(), containers: [] },
  ],
  localImages: initialLocalImages,
  terminalHistory: [],

  addMessage: (message) => {
    set(state => ({ terminalHistory: [...state.terminalHistory, { id: `msg_${Date.now()}`, command: '', output: message, timestamp: new Date().toISOString(), isError: false }] }));
  },

  generateComposeFile: () => { /* ... */ return ''; },

  createContainerInNetworks: (data) => {
    const { executeCommand, networks } = get();
    const { image, name, networkIds } = data;

    if (!image) return;

    const containerName = name || `container_${Date.now()}`;
    const primaryNetworkName = networks.find(n => n.id === (networkIds[0] || 'bridge'))?.name || 'bridge';

    // 1. Run container on the primary network
    let runCommand = `docker run -d --name ${containerName} --network ${primaryNetworkName} ${image}`;
    executeCommand(runCommand);

    // 2. Connect to additional networks
    if (networkIds.length > 1) {
      networkIds.slice(1).forEach(networkId => {
        const network = networks.find(n => n.id === networkId);
        if (network) {
          const connectCommand = `docker network connect ${network.name} ${containerName}`;
          executeCommand(connectCommand, true); // isInternal = true to suppress terminal output
        }
      });
    }
  },

  executeCommand: (command, isInternal = false) => {
    const state = get();
    let output = '';
    let isError = false;

    try {
      if (!command.trim()) return;
      const parts = command.trim().split(/\s+/);
      const [docker, sub, ...args] = parts;

      if (docker !== 'docker') throw new Error(`command not found: ${docker}`);

      switch (sub) {
        case 'pull': {
            const imageNameWithTag = args[0];
            if (!imageNameWithTag) throw new Error('docker pull requires an image name');
            const [name, tag = 'latest'] = imageNameWithTag.split(':');
            if (state.localImages.some(img => img.name === name && img.tag === tag)) {
                output = `Image is up to date for ${imageNameWithTag}`;
            } else {
                const newImage: DockerImage = { id: `sha256:${name}${Math.random()}`.slice(0, 15), name, tag, created: new Date(), size: `${(Math.random() * 100 + 50).toFixed(1)}MB` };
                set(state => ({ localImages: [...state.localImages, newImage] }));
                output = `Downloaded newer image for ${imageNameWithTag}`;
            }
            break;
        }
        case 'run': {
            const nameMatch = command.match(/--name\s+(\S+)/);
            const networkMatch = command.match(/--network\s+(\S+)/);
            const imageName = args.filter(arg => !arg.startsWith('-')).pop() || '';
            if (!imageName) throw new Error('"docker run" requires an image name.');
            
            const [imgName, imgTag = 'latest'] = imageName.split(':');
            const imageExists = state.localImages.some(img => img.name === imgName && img.tag === imgTag);
            if (!imageExists) throw new Error(`Unable to find image '${imageName}' locally`);

            const containerName = nameMatch ? nameMatch[1] : `container_${Date.now()}`;
            const targetNetworkName = networkMatch ? networkMatch[1] : 'bridge';
            const newContainer: Container = { id: containerName, name: containerName, image: imageName, status: 'running', ports: [], volumes: [], network: [targetNetworkName], created: new Date() };
            get().addContainer(newContainer);
            output = containerName;
            break;
        }
        case 'start': case 'stop': case 'pause': case 'unpause': case 'rm': {
            const containerName = args[0];
            const target = state.containers.find(c => c.name === containerName || c.id === containerName);
            if (!target) throw new Error(`No such container: ${containerName}`);
            if (sub === 'rm') {
                get().removeContainer(target.id);
            } else {
                const newStatus = sub === 'start' || sub === 'unpause' ? 'running' : (sub === 'stop' ? 'stopped' : 'paused');
                get().updateContainer(target.id, { status: newStatus });
            }
            output = containerName;
            break;
        }
        case 'network': {
            const [netCmd, ...netArgs] = args;
            if (netCmd === 'create') {
                const networkName = netArgs[0];
                if (!networkName) throw new Error('docker network create requires a name');
                if (state.networks.some(n => n.name === networkName)) throw new Error(`network with name ${networkName} already exists`);
                const newNetwork: Network = { id: `net_${networkName}_${Date.now()}`, name: networkName, driver: 'bridge', scope: 'local', createdAt: new Date(), containers: [] };
                get().addNetwork(newNetwork);
                output = networkName;
            } else if (netCmd === 'rm' || netCmd === 'remove') {
                const networkName = netArgs[0];
                const network = state.networks.find(n => n.name === networkName);
                if (!network) throw new Error(`network "${networkName}" not found`);
                if (network.containers.length > 0) throw new Error(`network "${networkName}" is in use`);
                get().removeNetwork(network.id);
                output = networkName;
            } else if (netCmd === 'connect') {
                const networkName = netArgs[0];
                const containerName = netArgs[1];
                const network = state.networks.find(n => n.name === networkName);
                const container = state.containers.find(c => c.name === containerName);
                if (!network || !container) throw new Error('Network or Container not found');
                
                const newNetworks = Array.from(new Set([...container.network, network.name]));
                get().updateContainer(container.id, { network: newNetworks });
                output = `Connected container ${containerName} to network ${networkName}`;
            } else {
                throw new Error(`Unknown network command: ${netCmd}`);
            }
            break;
        }
        case 'volume': {
            const [volCmd, ...volArgs] = args;
            if (volCmd === 'create') {
                const volumeName = volArgs[0] || `vol_${Date.now()}`;
                if (state.volumes.some(v => v.name === volumeName)) throw new Error(`volume with name ${volumeName} already exists`);
                const newVolume: Volume = { id: volumeName, name: volumeName, driver: 'local', scope: 'local', createdAt: new Date(), mountPath: `/var/lib/docker/volumes/${volumeName}/_data`, labels: null, options: null, connectedContainers: [] };
                get().addVolume(newVolume);
                output = volumeName;
            } else if (volCmd === 'rm' || volCmd === 'remove') {
                const volumeName = volArgs[0];
                const volume = state.volumes.find(v => v.name === volumeName);
                if (!volume) throw new Error(`No such volume: ${volumeName}`);
                if (volume.connectedContainers.length > 0) throw new Error(`remove ${volumeName}: volume is in use`);
                get().removeVolume(volume.id);
                output = volumeName;
            } else {
                throw new Error(`Unknown volume command: ${volCmd}`);
            }
            break;
        }
        default: throw new Error(`Unknown command: ${sub}`);
      }
    } catch (e: any) {
      output = e.message;
      isError = true;
    }
    if (!isInternal) {
      set(state => ({ terminalHistory: [...state.terminalHistory, { id: `cmd_${Date.now()}`, command, output, timestamp: new Date().toISOString(), isError }] }));
    }
  },

  addContainer: (container) => set(state => {
    const newNetworks = state.networks.map(n => {
        if (container.network.includes(n.name)) {
            return { ...n, containers: [...n.containers, container] };
        }
        return n;
    });
    return { containers: [...state.containers, container], networks: newNetworks };
  }),
  removeContainer: (id) => set(state => {
    const containerToRemove = state.containers.find(c => c.id === id);
    if (!containerToRemove) return state;
    const updatedVolumes = state.volumes.map(v => ({ ...v, connectedContainers: v.connectedContainers.filter(cId => cId !== id) }));
    const updatedNetworks = state.networks.map(n => ({ ...n, containers: n.containers.filter(c => c.id !== id) }));
    return { 
        containers: state.containers.filter(c => c.id !== id), 
        volumes: updatedVolumes, 
        networks: updatedNetworks 
    };
  }),
  updateContainer: (id, updates) => set((state) => {
    const originalContainer = state.containers.find(c => c.id === id);
    if (!originalContainer) return state;

    const updatedContainer = { ...originalContainer, ...updates };
    const newContainers = state.containers.map(c => (c.id === id ? updatedContainer : c));

    const newNetworks = state.networks.map(net => {
      // First, remove the old version of the container from the network's list
      const filteredContainers = net.containers.filter(c => c.id !== id);
      
      // If the updated container should be in this network, add its updated version
      if (updatedContainer.network.includes(net.name)) {
        return { ...net, containers: [...filteredContainers, updatedContainer] };
      }
      
      // Otherwise, just return the network with the container removed
      return { ...net, containers: filteredContainers };
    });

    return { containers: newContainers, networks: newNetworks };
  }),
  addVolume: (volume) => set(state => ({ volumes: [...state.volumes, volume] })),
  removeVolume: (id) => set(state => ({ volumes: state.volumes.filter(v => v.id !== id) })),
  updateVolume: (id, updates) => set(state => ({ volumes: state.volumes.map(v => v.id === id ? { ...v, ...updates } : v) })),
  addNetwork: (network) => set(state => ({ networks: [...state.networks, network] })),
  removeNetwork: (id) => set(state => ({ networks: state.networks.filter(n => n.id !== id) })),
  updateNetwork: (id, updates) => set(state => ({ networks: state.networks.map(n => n.id === id ? { ...n, ...updates } : n) }))
}));
