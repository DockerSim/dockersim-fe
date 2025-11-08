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
  disconnectVolumeFromContainer: (volumeName: string, containerName: string) => void;
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
    // Use the first selected network as the primary, or default to bridge
    const primaryNetworkId = networkIds?.[0] || 'bridge';
    const primaryNetwork = networks.find(n => n.id === primaryNetworkId);
    const primaryNetworkName = primaryNetwork?.name || 'bridge';

    // Create container and attach to the primary network
    let runCommand = `docker run -d --name ${containerName} --network ${primaryNetworkName} ${image}`;
    executeCommand(runCommand, true); // isInternal to avoid double output

    // Connect to any additional selected networks
    const additionalNetworkIds = networkIds?.slice(1) || [];
    additionalNetworkIds.forEach(networkId => {
      const network = networks.find(n => n.id === networkId);
      if (network) {
        const connectCommand = `docker network connect ${network.name} ${containerName}`;
        executeCommand(connectCommand, true);
      }
    });
    
    // Add a final message to the terminal
    get().addMessage(`Container ${containerName} created and connected to specified networks.`);
  },

  disconnectVolumeFromContainer: (volumeName, containerName) => {
    set(state => {
      const volume = state.volumes.find(v => v.name === volumeName);
      const container = state.containers.find(c => c.name === containerName);

      if (!volume || !container) {
        console.error("Volume or Container not found for disconnection.");
        return state;
      }

      // Update container: remove volume from its list
      const updatedContainer = {
        ...container,
        volumes: container.volumes.filter(v => v.name !== volumeName)
      };
      const newContainers = state.containers.map(c => c.id === container.id ? updatedContainer : c);

      // Update volume: remove container from its connected list
      const updatedVolume = {
        ...volume,
        connectedContainers: volume.connectedContainers.filter(cId => cId !== container.id)
      };
      const newVolumes = state.volumes.map(v => v.id === volume.id ? updatedVolume : v);
      
      get().addMessage(`Disconnected volume ${volumeName} from container ${containerName}`);
      return { containers: newContainers, volumes: newVolumes };
    });
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
            
            // The container is created with an array of networks from the start
            const newContainer: Container = { id: containerName, name: containerName, image: imageName, status: 'running', ports: [], volumes: [], network: [targetNetworkName], created: new Date() };
            get().addContainer(newContainer);
            output = containerName;
            break;
        }
        case 'network': {
            const [netCmd, ...netArgs] = args;
            if (netCmd === 'connect') {
                const networkName = netArgs[0];
                const containerName = netArgs[1];
                const network = state.networks.find(n => n.name === networkName);
                const container = state.containers.find(c => c.name === containerName);
                if (!network || !container) throw new Error('Network or Container not found');
                
                // Add the new network if it's not already there
                const newNetworksForContainer = Array.from(new Set([...container.network, network.id]));
                get().updateContainer(container.id, { network: newNetworksForContainer });
                output = ``; // Suppress output as createContainerInNetworks handles it
            } else if (netCmd === 'create') {
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
                get().removeNetwork(network.id);
                output = networkName;
            } else {
                throw new Error(`Unknown network command: ${netCmd}`);
            }
            break;
        }
        // Other cases remain the same
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
            } else if (volCmd === 'disconnect') {
                const volumeName = volArgs[0];
                const containerName = volArgs[1];
                if (!volumeName || !containerName) throw new Error('docker volume disconnect requires volume and container names');
                get().disconnectVolumeFromContainer(volumeName, containerName);
                output = ``;
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
    if (!isInternal && output) {
      set(state => ({ terminalHistory: [...state.terminalHistory, { id: `cmd_${Date.now()}`, command, output, timestamp: new Date().toISOString(), isError }] }));
    }
  },

  addContainer: (container) => set(state => {
    const newNetworks = state.networks.map(n => {
        // Use network ID for matching
        if (container.network.includes(n.id) || container.network.includes(n.name)) {
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
      const filteredContainers = net.containers.filter(c => c.id !== id);
      // Check by both ID and name for robustness
      if (updatedContainer.network.includes(net.id) || updatedContainer.network.includes(net.name)) {
        // Ensure not to add duplicates
        const containerExists = filteredContainers.some(c => c.id === id);
        if (containerExists) return { ...net, containers: filteredContainers.map(c => c.id === id ? updatedContainer : c) };
        return { ...net, containers: [...filteredContainers, updatedContainer] };
      }
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