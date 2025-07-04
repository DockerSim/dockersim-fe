import { useState, useCallback } from 'react';
import { Container, Network, Volume, ProcessStep } from '../types';

interface UseContainerManagementReturn {
  containers: Container[];
  selectedContainer: Container | null;
  newContainerId: string | null;
  handleStartContainer: (containerId: string) => Promise<void>;
  handleStopContainer: (containerId: string) => Promise<void>;
  handleRemoveContainer: (containerId: string) => Promise<void>;
  handleContainerClick: (container: Container) => void;
  setSelectedContainer: React.Dispatch<React.SetStateAction<Container | null>>;
  setContainers: React.Dispatch<React.SetStateAction<Container[]>>;
  setNewContainerId: React.Dispatch<React.SetStateAction<string | null>>;
  createContainerWithAnimation: (options: any, ports: Array<{hostPort: string; containerPort: string}>, networkId: string, startContainer?: boolean) => void;
  syncContainersWithNetworks: () => void;
}

interface UseContainerManagementProps {
  networks: Network[];
  volumes: Volume[];
  processes: ProcessStep[];
  setNetworks: React.Dispatch<React.SetStateAction<Network[]>>;
  setOutput: React.Dispatch<React.SetStateAction<string[]>>;
  setProcesses: React.Dispatch<React.SetStateAction<ProcessStep[]>>;
  setAnimating: React.Dispatch<React.SetStateAction<boolean>>;
  addProcessStep: (step: Omit<ProcessStep, 'id'>) => void;
  handleAllProcessesComplete: (containerId: string) => void;
}

// 더미 컨테이너 데이터
const DUMMY_CONTAINERS: Container[] = [
  {
    id: 'container_nginx_web',
    name: 'my-nginx',
    image: 'nginx:latest',
    ports: [{ hostPort: '80', containerPort: '80' }],
    status: 'running',
    createdAt: new Date('2024-03-10'),
    volumes: [],
    network: 'bridge',
    lastCommand: 'docker run -d --name my-nginx -p 80:80 nginx:latest'
  },
  {
    id: 'container_mysql_db',
    name: 'my-mysql',
    image: 'mysql:8.0',
    ports: [{ hostPort: '3306', containerPort: '3306' }],
    status: 'running',
    createdAt: new Date('2024-03-09'),
    volumes: [{ 
      id: 'vol_mysql_data',
      name: 'mysql_data', 
      mountPath: '/var/lib/mysql',
      createdAt: new Date('2024-03-09'),
      networkId: 'bridge'
    }],
    network: 'bridge',
    lastCommand: 'docker run -d --name my-mysql -p 3306:3306 -v mysql_data:/var/lib/mysql mysql:8.0'
  },
  {
    id: 'container_node_app',
    name: 'my-app',
    image: 'node:18',
    ports: [{ hostPort: '3000', containerPort: '3000' }],
    status: 'stopped',
    createdAt: new Date('2024-03-08'),
    volumes: [],
    network: 'bridge',
    lastCommand: 'docker run -d --name my-app -p 3000:3000 node:18'
  }
];

export const useContainerManagement = ({
  networks,
  volumes,
  processes,
  setNetworks,
  setOutput,
  setProcesses,
  setAnimating,
  addProcessStep,
  handleAllProcessesComplete
}: UseContainerManagementProps): UseContainerManagementReturn => {
  // 더미 데이터로 초기화
  const [containers, setContainers] = useState<Container[]>(DUMMY_CONTAINERS);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [newContainerId, setNewContainerId] = useState<string | null>(null);

  const calculateProcessPosition = (type: string, processIndex: number) => {
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

  const createContainerWithAnimation = useCallback((
    options: any, 
    ports: Array<{hostPort: string; containerPort: string}>, 
    networkId: string,
    startContainer: boolean = true // 새로운 매개변수 추가
  ) => {
    const containerId = `container_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const containerName = options.name || `container-${containerId.slice(-8)}`;
    
    setAnimating(true);
    setNewContainerId(containerId);

    // 1단계: 이미지 검색 및 풀
    addProcessStep({
      type: 'search',
      message: '이미지 검색 중',
      details: `'${options.image}' 이미지를 Docker Hub에서 검색하고 있습니다.`,
      position: calculateProcessPosition('search', processes.length),
      containerId: containerId,
      stepNumber: 1,
      totalSteps: startContainer ? 4 : 3 // create만 할 경우 3단계
    });

    setTimeout(() => {
      addProcessStep({
        type: 'pull',
        message: '이미지 다운로드 중',
        details: `'${options.image}' 이미지를 다운로드하고 있습니다.`,
        position: calculateProcessPosition('pull', processes.length),
        containerId: containerId,
        stepNumber: 2,
        totalSteps: startContainer ? 4 : 3
      });

      setTimeout(() => {
        addProcessStep({
          type: 'create',
          message: '컨테이너 생성 중',
          details: `'${containerName}' 컨테이너를 생성하고 있습니다.`,
          position: calculateProcessPosition('create', processes.length),
          containerId: containerId,
          stepNumber: 3,
          totalSteps: startContainer ? 4 : 3
        });

        setTimeout(() => {
          // 새 컨테이너 생성
          const newContainer: Container = {
            id: containerId,
            name: containerName,
            image: options.image,
            ports: ports,
            status: startContainer ? 'running' : 'stopped', // create만 할 경우 stopped
            createdAt: new Date(),
            volumes: options.volumes || [],
            network: networks.find(n => n.id === networkId)?.name || 'bridge',
            lastCommand: startContainer 
              ? `docker run ${options.name ? `--name ${options.name}` : ''} ${ports.length > 0 ? ports.map(p => `-p ${p.hostPort}:${p.containerPort}`).join(' ') : ''} ${options.image}`
              : `docker create ${options.name ? `--name ${options.name}` : ''} ${ports.length > 0 ? ports.map(p => `-p ${p.hostPort}:${p.containerPort}`).join(' ') : ''} ${options.image}`
          };

          setContainers(prev => [...prev, newContainer]);

          // 네트워크에 컨테이너 추가
          setNetworks(prev => prev.map(network => 
            network.id === networkId 
              ? { ...network, containers: [...network.containers, newContainer] }
              : network
          ));

          if (startContainer) {
            // run 명령어일 경우 시작 단계 추가
            addProcessStep({
              type: 'start',
              message: '컨테이너 시작됨',
              details: `'${containerName}' 컨테이너가 성공적으로 시작되었습니다.`,
              position: calculateProcessPosition('start', processes.length),
              containerId: containerId,
              stepNumber: 4,
              totalSteps: 4,
              completed: true
            });

            setOutput(prev => [...prev, 
              `컨테이너 '${containerName}'이 생성되어 실행되었습니다.`,
              `컨테이너 ID: ${containerId.slice(0, 12)}`
            ]);
          } else {
            // create 명령어일 경우 생성 완료 단계
            addProcessStep({
              type: 'create',
              message: '컨테이너 생성됨',
              details: `'${containerName}' 컨테이너가 성공적으로 생성되었습니다. (중지 상태)`,
              position: calculateProcessPosition('create', processes.length),
              containerId: containerId,
              stepNumber: 3,
              totalSteps: 3,
              completed: true
            });

            setOutput(prev => [...prev, 
              `컨테이너 '${containerName}'이 생성되었습니다. (중지 상태)`,
              `컨테이너 ID: ${containerId.slice(0, 12)}`
            ]);
          }

          setTimeout(() => {
            handleAllProcessesComplete(containerId);
          }, 2000);
        }, 1500);
      }, 1500);
    }, 1500);
  }, [networks, processes, addProcessStep, setAnimating, setNewContainerId, setContainers, setNetworks, setOutput, handleAllProcessesComplete]);

  const handleStartContainer = useCallback(async (containerId: string) => {
    try {
      setOutput(prev => [...prev, `컨테이너 ${containerId.slice(0, 12)} 시작 중...`]);
      
      // 시뮬레이션 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setContainers(prev => prev.map(container => 
        container.id === containerId 
          ? { ...container, status: 'running' as const }
          : container
      ));

      // 네트워크에서도 업데이트
      setNetworks(prev => prev.map(network => ({
        ...network,
        containers: network.containers.map(container =>
          container.id === containerId
            ? { ...container, status: 'running' as const }
            : container
        )
      })));

      setOutput(prev => [...prev, `컨테이너 ${containerId.slice(0, 12)}이 시작되었습니다.`]);
    } catch (error) {
      setOutput(prev => [...prev, `컨테이너 시작 중 오류 발생: ${error}`]);
    }
  }, [setContainers, setNetworks, setOutput]);

  const handleStopContainer = useCallback(async (containerId: string) => {
    try {
      setOutput(prev => [...prev, `컨테이너 ${containerId.slice(0, 12)} 중지 중...`]);
      
      // 시뮬레이션 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setContainers(prev => prev.map(container => 
        container.id === containerId 
          ? { ...container, status: 'stopped' as const }
          : container
      ));

      // 네트워크에서도 업데이트
      setNetworks(prev => prev.map(network => ({
        ...network,
        containers: network.containers.map(container =>
          container.id === containerId
            ? { ...container, status: 'stopped' as const }
            : container
        )
      })));

      setOutput(prev => [...prev, `컨테이너 ${containerId.slice(0, 12)}이 중지되었습니다.`]);
    } catch (error) {
      setOutput(prev => [...prev, `컨테이너 중지 중 오류 발생: ${error}`]);
    }
  }, [setContainers, setNetworks, setOutput]);

  const handleRemoveContainer = useCallback(async (containerId: string) => {
    try {
      const container = containers.find(c => c.id === containerId);
      if (!container) return;

      setOutput(prev => [...prev, `컨테이너 ${containerId.slice(0, 12)} 삭제 중...`]);
      
      // 시뮬레이션 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 컨테이너 목록에서 제거
      setContainers(prev => prev.filter(c => c.id !== containerId));

      // 네트워크에서도 제거
      setNetworks(prev => prev.map(network => ({
        ...network,
        containers: network.containers.filter(c => c.id !== containerId)
      })));

      // 선택된 컨테이너가 삭제된 경우 초기화
      if (selectedContainer?.id === containerId) {
        setSelectedContainer(null);
      }

      setOutput(prev => [...prev, `컨테이너 ${container.name}이 삭제되었습니다.`]);
    } catch (error) {
      setOutput(prev => [...prev, `컨테이너 삭제 중 오류 발생: ${error}`]);
    }
  }, [containers, selectedContainer, setContainers, setNetworks, setSelectedContainer, setOutput]);

  const handleContainerClick = useCallback((container: Container) => {
    setSelectedContainer(container);
  }, []);

  const syncContainersWithNetworks = useCallback(() => {
    // 네트워크와 컨테이너 동기화
    setNetworks(prev => prev.map(network => ({
      ...network,
      containers: containers.filter(container => 
        container.network === network.name || 
        (network.name === 'bridge' && !container.network)
      )
    })));
  }, [containers, setNetworks]);

  return {
    containers,
    selectedContainer,
    newContainerId,
    handleStartContainer,
    handleStopContainer,
    handleRemoveContainer,
    handleContainerClick,
    setSelectedContainer,
    setContainers,
    setNewContainerId,
    createContainerWithAnimation,
    syncContainersWithNetworks
  };
}; 