import { create } from 'zustand';

// --- 타입 정의 ---
export interface Port {
  hostPort: number;
  containerPort: number;
  protocol: 'tcp' | 'udp';
}

export interface Volume {
  id: string;
  name: string;
  driver: string;
  scope: 'local' | 'global';
  createdAt: Date;
  mountPath: string; // 컨테이너에 연결될 때의 경로
  labels: Record<string, string> | null;
  options: Record<string, string> | null;
  connectedContainers: string[];
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused';
  ports: Port[];
  volumes: Volume[];
  network: string | null;
  created: Date;
}

export interface Network {
  id: string;
  name: string;
  driver: string;
  scope: 'local' | 'global';
  createdAt: Date;
  containers: Container[];
}

export interface DockerImage {
  id: string;
  name: string;
  tag: string;
  created: Date;
  size: string;
}

export interface TerminalHistory {
  id: string;
  command: string;
  output: string;
  timestamp: string;
  isError: boolean;
}

interface DockerStore {
  containers: Container[];
  volumes: Volume[];
  networks: Network[];
  localImages: DockerImage[];
  terminalHistory: TerminalHistory[];
  executeCommand: (command: string) => void;
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
}

const initialLocalImages: DockerImage[] = [
    { id: 'sha256:nginx123', name: 'nginx', tag: 'latest', created: new Date(), size: '133MB' },
    { id: 'sha256:ubuntu123', name: 'ubuntu', tag: 'latest', created: new Date(), size: '72.9MB' },
    { id: 'sha256:python123', name: 'python', tag: '3.9-slim', created: new Date(), size: '114MB' },
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

  generateComposeFile: () => {
    // ... (Compose file generation logic)
    return '';
  },

  executeCommand: (command) => {
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
                set({ localImages: [...state.localImages, newImage] });
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
            const newContainer: Container = { id: containerName, name: containerName, image: imageName, status: 'running', ports: [], volumes: [], network: targetNetworkName, created: new Date() };
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
                get().updateContainer(container.id, { network: network.name });
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
    set(state => ({ terminalHistory: [...state.terminalHistory, { id: `cmd_${Date.now()}`, command, output, timestamp: new Date().toISOString(), isError }] }));
  },

  addContainer: (container) => set(state => ({ containers: [...state.containers, container] })),
  removeContainer: (id) => set(state => {
    const containerToRemove = state.containers.find(c => c.id === id);
    if (!containerToRemove) return state;
    const updatedVolumes = state.volumes.map(v => ({ ...v, connectedContainers: v.connectedContainers.filter(cId => cId !== id) }));
    return { containers: state.containers.filter(c => c.id !== id), volumes: updatedVolumes };
  }),
  updateContainer: (id, updates) => set(state => ({ containers: state.containers.map(c => c.id === id ? { ...c, ...updates } : c) })),
  addVolume: (volume) => set(state => ({ volumes: [...state.volumes, volume] })),
  removeVolume: (id) => set(state => ({ volumes: state.volumes.filter(v => v.id !== id) })),
  updateVolume: (id, updates) => set(state => ({ volumes: state.volumes.map(v => v.id === id ? { ...v, ...updates } : v) })),
  addNetwork: (network) => set(state => ({ networks: [...state.networks, network] })),
  removeNetwork: (id) => set(state => ({ networks: state.networks.filter(n => n.id !== id) }))
}));
