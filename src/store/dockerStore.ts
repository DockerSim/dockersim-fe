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

export const useDockerStore = create<DockerStore>((set, get) => {
  // --- Helper function to ensure network state is consistent ---
  const syncNetworksWithContainers = (containers: Container[], networks: Network[]): Network[] => {
    return networks.map(network => {
      const containersInNetwork = containers.filter(container => 
        container.network.includes(network.name)
      );
      return { ...network, containers: containersInNetwork };
    });
  };

  return {
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
      // Ensure networkIds is an array
      const safeNetworkIds = Array.isArray(networkIds) ? networkIds : [];
      const primaryNetworkName = networks.find(n => n.id === (safeNetworkIds[0] || 'bridge'))?.name || 'bridge';

      // 1. Run container on the primary network
      let runCommand = `docker run -d --name ${containerName} --network ${primaryNetworkName} ${image}`;
      executeCommand(runCommand, true); // Run internally first

      // 2. Connect to additional networks
      if (safeNetworkIds.length > 1) {
        safeNetworkIds.slice(1).forEach(networkId => {
          const network = networks.find(n => n.id === networkId);
          if (network) {
            const connectCommand = `docker network connect ${network.name} ${containerName}`;
            executeCommand(connectCommand, true);
          }
        });
      }
      
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

        const updatedContainer = {
          ...container,
          volumes: container.volumes.filter(v => v.name !== volumeName)
        };
        const newContainers = state.containers.map(c => c.id === container.id ? updatedContainer : c);

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
                  get().removeNetwork(network.id);
                  output = networkName;
              } else if (netCmd === 'connect') {
                  const networkName = netArgs[0];
                  const containerName = netArgs[1];
                  const container = state.containers.find(c => c.name === containerName);
                  if (!container) throw new Error('Container not found');
                  
                  const newNetworks = Array.from(new Set([...container.network, networkName]));
                  get().updateContainer(container.id, { network: newNetworks });
                  // No output for internal connect calls
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
            } else if (volCmd === 'disconnect') {
                const volumeName = volArgs[0];
                const containerName = volArgs[1];
                if (!volumeName || !containerName) throw new Error('docker volume disconnect requires volume and container names');
                get().disconnectVolumeFromContainer(volumeName, containerName);
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

    // --- State Update Functions with Syncing ---
    addContainer: (container) => set(state => {
      const newContainers = [...state.containers, container];
      const newNetworks = syncNetworksWithContainers(newContainers, state.networks);
      return { containers: newContainers, networks: newNetworks };
    }),

    removeContainer: (id) => set(state => {
      const newContainers = state.containers.filter(c => c.id !== id);
      const newNetworks = syncNetworksWithContainers(newContainers, state.networks);
      const updatedVolumes = state.volumes.map(v => ({ ...v, connectedContainers: v.connectedContainers.filter(cId => cId !== id) }));
      return { 
          containers: newContainers, 
          volumes: updatedVolumes, 
          networks: newNetworks 
      };
    }),

    updateContainer: (id, updates) => set(state => {
      const newContainers = state.containers.map(c => 
        c.id === id ? { ...c, ...updates } : c
      );
      const newNetworks = syncNetworksWithContainers(newContainers, state.networks);
      return { containers: newContainers, networks: newNetworks };
    }),

    addVolume: (volume) => set(state => ({ volumes: [...state.volumes, volume] })),
    removeVolume: (id) => set(state => ({ volumes: state.volumes.filter(v => v.id !== id) })),
    updateVolume: (id, updates) => set(state => ({ volumes: state.volumes.map(v => v.id === id ? { ...v, ...updates } : v) })),
    
    addNetwork: (network) => set(state => ({ networks: [...state.networks, network] })),
    removeNetwork: (id) => set(state => {
      const newNetworks = state.networks.filter(n => n.id !== id);
      // We don't need to sync containers here, as the network name will just be orphaned in the container's list, which is acceptable.
      return { networks: newNetworks };
    }),
    updateNetwork: (id, updates) => set(state => ({ networks: state.networks.map(n => n.id === id ? { ...n, ...updates } : n) }))
  };
});