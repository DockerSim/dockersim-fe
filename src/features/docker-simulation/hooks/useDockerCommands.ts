import { useState, useCallback } from 'react';
import { parseDockerRunCommand } from '../../../utils/dockerCommandParser';
import { Container, Network, Volume, ProcessStep, Position } from '../types';
import { DockerCommandService } from '../services/DockerCommandService';

interface UseDockerCommandsReturn {
  command: string;
  output: string[];
  commandHistory: string[];
  isProcessing: boolean;
  handleCommandSubmit: (e: React.FormEvent) => Promise<void>;
  handleCommandChange: (value: string) => void;
  clearOutput: () => void;
}

interface UseDockerCommandsProps {
  networks: Network[];
  volumes: Volume[];
  containers: Container[];
  activeNetwork: string | null;
  processes: ProcessStep[];
  setNetworks: React.Dispatch<React.SetStateAction<Network[]>>;
  setVolumes: React.Dispatch<React.SetStateAction<Volume[]>>;
  setContainers: React.Dispatch<React.SetStateAction<Container[]>>;
  setActiveNetwork: React.Dispatch<React.SetStateAction<string | null>>;
  setOutput: React.Dispatch<React.SetStateAction<string[]>>;
  setNewVolumeId: React.Dispatch<React.SetStateAction<string | null>>;
  setNewContainerId: React.Dispatch<React.SetStateAction<string | null>>;
  addProcessStep: (step: Omit<ProcessStep, 'id'>) => void;
  createContainerWithAnimation: (options: any, ports: Array<{hostPort: string; containerPort: string}>, networkId: string, startContainer?: boolean) => void;
  addImageFromPull: (imageName: string, tag?: string) => void;
  createVolume: (name: string, mountPath?: string, networkId?: string) => Volume;
}

/**
 * useDockerCommands - Docker 명령어 실행과 관련된 모든 로직을 관리하는 커스텀 훅
 * 
 * 책임:
 * - 명령어 입력 상태 관리
 * - 명령어 실행 및 결과 처리
 * - 명령어 히스토리 관리
 * - 에러 처리 및 사용자 피드백
 */
export const useDockerCommands = ({
  networks,
  volumes, 
  containers,
  activeNetwork,
  processes,
  setNetworks,
  setVolumes,
  setContainers,
  setActiveNetwork,
  setOutput,
  setNewVolumeId,
  setNewContainerId,
  addProcessStep,
  createContainerWithAnimation,
  addImageFromPull,
  createVolume
}: UseDockerCommandsProps): UseDockerCommandsReturn => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateProcessPosition = (type: string, processIndex: number): Position => {
    const baseX = window.innerWidth / 2 - 150;
    const baseY = 150;
    
    const typeOffsets = {
      'search': 0,
      'pull': 1,
      'create': 2,
      'connect': 3,
      'start': 4,
      'error': 5
    };
    
    const typeOffset = (typeOffsets as any)[type] || 0;
    const horizontalOffset = (processIndex % 3) * 320;
    
    return {
      x: baseX + horizontalOffset,
      y: baseY + (typeOffset * 90)
    };
  };

  const handleCommandSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    setOutput(prev => [...prev, `$ ${trimmedCommand}`]);
    setCommandHistory(prev => [...prev, trimmedCommand]);
    setIsProcessing(true);

    try {
      // Handle special commands locally
      if (trimmedCommand === 'clear') {
        setOutput([]);
        setIsProcessing(false);
        setCommand('');
        return;
      }

      // Handle docker ps commands with live data
      if (trimmedCommand === 'docker ps') {
        const runningContainers = containers.filter(c => c.status === 'running');
        setOutput(prev => [...prev, 
          'CONTAINER ID   IMAGE          COMMAND   CREATED          STATUS          PORTS           NAMES',
          ...runningContainers.map(c => 
            `${c.id.slice(0, 12)}   ${c.image}   -   ${c.createdAt.toLocaleDateString()}   ${c.status}   ${c.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ')}   ${c.name}`
          )
        ]);
        setIsProcessing(false);
        setCommand('');
        return;
      }

      if (trimmedCommand === 'docker ps -a') {
        setOutput(prev => [...prev,
          'CONTAINER ID   IMAGE          COMMAND   CREATED          STATUS          PORTS           NAMES', 
          ...containers.map(c =>
            `${c.id.slice(0, 12)}   ${c.image}   -   ${c.createdAt.toLocaleDateString()}   ${c.status}   ${c.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ')}   ${c.name}`
          )
        ]);
        setIsProcessing(false);
        setCommand('');
        return;
      }

      // Use DockerCommandService for other commands
      const result = await DockerCommandService.execute(trimmedCommand);
      
      // Handle command result
      if (result.success) {
        setOutput(prev => [...prev, ...result.output]);
        
        // Handle special cases that need state updates and animations
        if (trimmedCommand.startsWith('docker pull')) {
          // docker pull 성공 시 이미지 추가
          const imageParts = trimmedCommand.split(' ');
          if (imageParts.length >= 3) {
            const fullImageName = imageParts[2];
            const [imageName, tag] = fullImageName.includes(':') 
              ? fullImageName.split(':') 
              : [fullImageName, 'latest'];
            addImageFromPull(imageName, tag);
          }
        }
        else if (trimmedCommand.startsWith('docker run')) {
          // docker run 시 이미지가 없으면 자동으로 pull하고 추가
          const runParts = trimmedCommand.split(' ');
          const imageIndex = runParts.findIndex((part, idx) => 
            idx > 1 && !part.startsWith('-') && runParts[idx - 1] !== '-p' && 
            runParts[idx - 1] !== '-v' && runParts[idx - 1] !== '--name'
          );
          
          if (imageIndex !== -1) {
            const fullImageName = runParts[imageIndex];
            const [imageName, tag] = fullImageName.includes(':') 
              ? fullImageName.split(':') 
              : [fullImageName, 'latest'];
            addImageFromPull(imageName, tag);
          }
          
          // Handle volume auto-creation and animations
          await handleDockerRunWithVolumes(trimmedCommand);
        }
        else if (trimmedCommand.startsWith('docker create')) {
          // docker create 시 이미지가 없으면 자동으로 pull하고 추가
          const createParts = trimmedCommand.split(' ');
          const imageIndex = createParts.findIndex((part, idx) => 
            idx > 1 && !part.startsWith('-') && createParts[idx - 1] !== '-p' && 
            createParts[idx - 1] !== '-v' && createParts[idx - 1] !== '--name'
          );
          
          if (imageIndex !== -1) {
            const fullImageName = createParts[imageIndex];
            const [imageName, tag] = fullImageName.includes(':') 
              ? fullImageName.split(':') 
              : [fullImageName, 'latest'];
            addImageFromPull(imageName, tag);
          }
          
          // Handle volume auto-creation and animations for docker create
          await handleDockerCreateWithVolumes(trimmedCommand);
        }
        else if (trimmedCommand.startsWith('docker volume create')) {
          const volumeName = trimmedCommand.split(' ')[3];
          if (volumeName) {
            const newVolume = createVolume(volumeName, '/data', activeNetwork || undefined);
            setNewVolumeId(newVolume.id);
          }
        }
        else if (trimmedCommand.startsWith('docker network create')) {
          const networkName = trimmedCommand.split(' ')[3];
          if (networkName) {
            const newNetwork: Network = {
              id: Date.now().toString(),
              name: networkName,
              containers: []
            };
            setNetworks(prev => [...prev, newNetwork]);
            setActiveNetwork(newNetwork.id);
          }
        }
      } else {
        setOutput(prev => [...prev, ...result.output]);
      }
    } catch (error) {
      setOutput(prev => [...prev, `오류가 발생했습니다: ${error}`]);
    } finally {
      setIsProcessing(false);
    }

    setCommand('');
  }, [command, networks, volumes, containers, activeNetwork, processes, setNetworks, setVolumes, setContainers, setActiveNetwork, setOutput, setNewVolumeId, setNewContainerId, addProcessStep, createContainerWithAnimation, addImageFromPull, createVolume]);

  // Separate function to handle docker run with volume logic
  const handleDockerRunWithVolumes = useCallback(async (trimmedCommand: string) => {
    const options = parseDockerRunCommand(trimmedCommand);
    
    if (options && activeNetwork) {
      const portMappings = trimmedCommand.match(/-p\s+(\d+:\d+)/g) || [];
      const ports = portMappings.map(mapping => {
        const [host, container] = mapping.replace('-p', '').trim().split(':');
        return { hostPort: host, containerPort: container };
      });

      // Volume processing logic (preserved from original)
      const volumeMappings = trimmedCommand.match(/(-v|--volume)\s+([^\s]+)/g) || [];
      const mountMappings = trimmedCommand.match(/--mount\s+([^\s]+)/g) || [];
      
      // Handle --mount options
      if (mountMappings.length > 0) {
        for (const mountMapping of mountMappings) {
          const mountItem = mountMapping;
          if (mountItem) {
            const mountStr = mountItem.replace('--mount', '').trim();
            const mountParts = mountStr.split(',');
            
            let volumeName = '';
            let mountPath = '/data';
            
            mountParts.forEach(part => {
              if (part.startsWith('source=')) {
                volumeName = part.replace('source=', '');
              } else if (part.startsWith('target=')) {
                mountPath = part.replace('target=', '');
              }
            });
            
            if (volumeName && !volumes.find(v => v.name === volumeName)) {
              await createVolumeIfNotExists(volumeName, mountPath);
            }
          }
        }
      }
      
      // Handle -v options
      if (volumeMappings.length > 0) {
        for (const volumeMapping of volumeMappings) {
          const volumeItem = volumeMapping.trim();
          if (volumeItem) {
            const volumeStr = volumeItem.replace(/-v|--volume/, '').trim();
            const volumeParts = volumeStr.split(':');
            const volumeName = volumeParts[0];
            const mountPath = volumeParts.length > 1 ? volumeParts[1] : '/data';
            
            if (!volumes.find(v => v.name === volumeName)) {
              await createVolumeIfNotExists(volumeName, mountPath);
            }
          }
        }
      }

      // Trigger container creation animation (start = true for run)
      createContainerWithAnimation(options, ports, activeNetwork, true);
    }
  }, [activeNetwork, volumes, processes, addProcessStep, createContainerWithAnimation]);

  // Separate function to handle docker create with volume logic
  const handleDockerCreateWithVolumes = useCallback(async (trimmedCommand: string) => {
    const options = parseDockerRunCommand(trimmedCommand); // 같은 파서 사용
    
    if (options && activeNetwork) {
      const portMappings = trimmedCommand.match(/-p\s+(\d+:\d+)/g) || [];
      const ports = portMappings.map(mapping => {
        const [host, container] = mapping.replace('-p', '').trim().split(':');
        return { hostPort: host, containerPort: container };
      });

      // Volume processing logic (same as run)
      const volumeMappings = trimmedCommand.match(/(-v|--volume)\s+([^\s]+)/g) || [];
      const mountMappings = trimmedCommand.match(/--mount\s+([^\s]+)/g) || [];
      
      // Handle --mount options
      if (mountMappings.length > 0) {
        for (const mountMapping of mountMappings) {
          const mountItem = mountMapping;
          if (mountItem) {
            const mountStr = mountItem.replace('--mount', '').trim();
            const mountParts = mountStr.split(',');
            
            let volumeName = '';
            let mountPath = '/data';
            
            mountParts.forEach(part => {
              if (part.startsWith('source=')) {
                volumeName = part.replace('source=', '');
              } else if (part.startsWith('target=')) {
                mountPath = part.replace('target=', '');
              }
            });
            
            if (volumeName && !volumes.find(v => v.name === volumeName)) {
              await createVolumeIfNotExists(volumeName, mountPath);
            }
          }
        }
      }
      
      // Handle -v options
      if (volumeMappings.length > 0) {
        for (const volumeMapping of volumeMappings) {
          const volumeItem = volumeMapping.trim();
          if (volumeItem) {
            const volumeStr = volumeItem.replace(/-v|--volume/, '').trim();
            const volumeParts = volumeStr.split(':');
            const volumeName = volumeParts[0];
            const mountPath = volumeParts.length > 1 ? volumeParts[1] : '/data';
            
            if (!volumes.find(v => v.name === volumeName)) {
              await createVolumeIfNotExists(volumeName, mountPath);
            }
          }
        }
      }

      // Trigger container creation animation (start = false for create)
      createContainerWithAnimation(options, ports, activeNetwork, false);
    }
  }, [activeNetwork, volumes, processes, addProcessStep, createContainerWithAnimation]);

  // Helper function to create volume if it doesn't exist
  const createVolumeIfNotExists = useCallback(async (volumeName: string, mountPath: string) => {
    addProcessStep({
      type: 'create',
      message: '볼륨 자동 생성 중',
      details: `볼륨 '${volumeName}'이 존재하지 않아 자동으로 생성합니다.`,
      position: calculateProcessPosition(volumeName, processes.length),
      containerId: volumeName,
      stepNumber: 1,
      totalSteps: 2
    });
    
    const newVolume = createVolume(volumeName, mountPath, activeNetwork || undefined);
    setNewVolumeId(newVolume.id);
    setOutput(prev => [...prev, `볼륨 '${volumeName}'이 생성되었습니다.`]);
  }, [activeNetwork, processes, addProcessStep, createVolume, setNewVolumeId, setOutput]);

  const handleCommandChange = useCallback((value: string) => {
    setCommand(value);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
  }, [setOutput]);

  return {
    command,
    output: [], // output은 외부에서 관리
    commandHistory,
    isProcessing,
    handleCommandSubmit,
    handleCommandChange,
    clearOutput
  };
}; 