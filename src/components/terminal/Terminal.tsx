'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './Terminal.module.css';
import { parseDockerRunCommand } from '@/utils/dockerCommandParser';
import LevelSelectModal from '@/components/learn/LevelSelectModal';
import ContainerListModal from '@/components/learn/ContainerListModal';
import CommandDictionaryModal from '@/components/learn/CommandDictionaryModal';

interface Port {
  hostPort: string;
  containerPort: string;
}

interface Volume {
  id: string;
  name: string;
  mountPath?: string;
  hostPath?: string;
  createdAt: Date;
}

interface Container {
  id: string;
  name: string;
  image: string;
  ports: Array<{
    hostPort: string;
    containerPort: string;
  }>;
  status: 'running' | 'stopped';
  createdAt: Date;
  volume?: Volume;
  network?: string;
  lastCommand?: string;
}

interface Network {
  id: string;
  name: string;
  containers: Container[];
  isNew?: boolean;
}

interface Image {
  id: string;
  name: string;
  tag: string;
  size: string;
  created: Date;
  isOfficial: boolean;
}

interface ProcessStep {
  id: string;
  type: 'pull' | 'create' | 'start' | 'connect' | 'error' | 'search';
  message: string;
  details?: string;
  targetId?: string;
  position?: { x: number; y: number };
  completed?: boolean;
}

interface Props {
  containers?: Container[];
  networks?: Network[];
  images?: Image[];
  onNetworkCreate?: (networkName: string) => void;
}

interface ModalProps {
  onClose: () => void;
}

const ContainerCard = ({ 
  container, 
  onClick, 
  isCreating = false 
}: { 
  container: Container; 
  onClick: () => void;
  isCreating?: boolean;
}) => (
  <div 
    className={`${styles.containerCard} ${container.status === 'running' ? styles.running : styles.stopped} ${isCreating ? styles.highlight : ''}`} 
    onClick={onClick}
  >
    <div className={styles.containerHeader}>
      <span className={styles.containerIcon}>📦</span>
      <h3 className={styles.containerName}>{container.name}</h3>
      <span className={`${styles.statusIndicator} ${styles[container.status]}`}></span>
    </div>
    <div className={styles.containerImageTag}>{container.image}</div>
    <div className={styles.portsList}>
      {container.ports.map((port, index) => (
        <span key={index} className={styles.portBadge}>
          {port.hostPort}:{port.containerPort}
        </span>
      ))}
    </div>
    {container.volume && (
      <div className={styles.volumeConnection}>
        <span className={styles.volumeBadge}>{container.volume.name}</span>
      </div>
    )}
  </div>
);

const NetworkView = ({ network }: { network: Network }) => {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  return (
    <div className={styles.networkView}>
      <div className={styles.containersGrid}>
        {network.containers.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            onClick={() => setSelectedContainer(container)}
          />
        ))}
      </div>
      {selectedContainer && (
        <ContainerModal
          container={selectedContainer}
          onClose={() => setSelectedContainer(null)}
        />
      )}
    </div>
  );
};

const ContainerModal: React.FC<{ container: Container, onStart?: (id: string) => void, onStop?: (id: string) => void, onRemove?: (id: string) => void } & ModalProps> = ({ container, onClose, onStart, onStop, onRemove }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chromeModal} onClick={e => e.stopPropagation()}>
        <div className={styles.chromeHeader}>
          <div className={styles.tabSection}>
            <div className={styles.activeTab}>
              <span className={styles.tabIcon}>📦</span>
              {container.name}
            </div>
          </div>
          <button className={styles.chromeClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <span className={`${styles.status} ${styles[container.status]}`}>
                  {container.status === 'running' ? '실행 중' : '중지됨'}
                </span>
              </div>
              <div className={styles.infoBody}>
                <div className={styles.infoGroup}>
                  <label>이미지</label>
                  <span className={styles.imageTag}>{container.image}</span>
                </div>
                <div className={styles.infoGroup}>
                  <label>컨테이너 ID</label>
                  <span className={styles.idTag}>{container.id.slice(0, 12)}</span>
                </div>
                <div className={styles.infoGroup}>
                  <label>네트워크</label>
                  <span className={styles.networkTag}>{container.network || '없음'}</span>
                </div>
                <div className={styles.infoGroup}>
                  <label>생성 시간</label>
                  <span>{container.createdAt.toLocaleString()}</span>
                </div>
                {container.ports.length > 0 && (
                  <div className={styles.infoGroup}>
                    <label>포트 매핑</label>
                    <div className={styles.portList}>
                      {container.ports.map((port, idx) => (
                        <span key={idx} className={styles.portTag}>
                          {port.hostPort}:{port.containerPort}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {container.volume && (
                  <div className={styles.infoGroup}>
                    <label>볼륨</label>
                    <div className={styles.volumeInfo}>
                      <span className={styles.volumeTag}>{container.volume.name}</span>
                      <span className={styles.mountPath}>{container.volume.mountPath}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button 
            className={`${styles.actionButton} ${container.status === 'running' ? styles.stop : styles.start}`}
            onClick={() => {
              if (container.status === 'running') {
                onStop && onStop(container.id);
              } else {
                onStart && onStart(container.id);
              }
              onClose();
            }}
          >
            {container.status === 'running' ? '중지' : '시작'}
          </button>
          <button 
            className={`${styles.actionButton} ${styles.remove}`}
            onClick={() => {
              onRemove && onRemove(container.id);
              onClose();
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
};

const VolumeModal: React.FC<{ volume: Volume } & ModalProps> = ({ volume, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chromeModal} onClick={e => e.stopPropagation()}>
        <div className={styles.chromeHeader}>
          <div className={styles.tabSection}>
            <div className={styles.activeTab}>
              <span className={styles.tabIcon}>💾</span>
              {volume.name}
            </div>
          </div>
          <button className={styles.chromeClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <div className={styles.infoBody}>
                <div className={styles.infoGroup}>
                  <label>볼륨 이름</label>
                  <span className={styles.volumeTag}>{volume.name}</span>
                </div>
                {volume.mountPath && (
                  <div className={styles.infoGroup}>
                    <label>마운트 경로</label>
                    <span className={styles.mountPath}>{volume.mountPath}</span>
                  </div>
                )}
                <div className={styles.infoGroup}>
                  <label>생성 시간</label>
                  <span>{volume.createdAt.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageModal: React.FC<{ onClose: () => void, images: Image[] }> = ({ onClose, images }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.chromeModal} onClick={e => e.stopPropagation()}>
        <div className={styles.chromeHeader}>
          <div className={styles.tabSection}>
            <div className={styles.activeTab}>
              <span className={styles.tabIcon}>🖼️</span>
              이미지 목록
            </div>
          </div>
          <button className={styles.chromeClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.imagesList}>
            {images.length === 0 ? (
              <div className={styles.emptyState}>
                <p>다운로드한 이미지가 없습니다.</p>
                <p className={styles.helperText}>Docker Pull 명령어를 사용하여 이미지를 다운로드하세요.</p>
                <code className={styles.commandExample}>docker pull nginx:latest</code>
              </div>
            ) : (
              <table className={styles.imagesTable}>
                <thead>
                  <tr>
                    <th>이미지명</th>
                    <th>태그</th>
                    <th>크기</th>
                    <th>생성일</th>
                    <th>타입</th>
                  </tr>
                </thead>
                <tbody>
                  {images.map(image => (
                    <tr key={image.id}>
                      <td>{image.name}</td>
                      <td>{image.tag}</td>
                      <td>{image.size}</td>
                      <td>{image.created.toLocaleDateString()}</td>
                      <td>
                        {image.isOfficial ? (
                          <span className={styles.officialBadge}>공식</span>
                        ) : (
                          <span className={styles.communityBadge}>커뮤니티</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProcessVisualization: React.FC<{ 
  processes: ProcessStep[], 
  onComplete: (id: string) => void 
}> = ({ processes, onComplete }) => {
  useEffect(() => {
    processes.forEach((process, index) => {
      if (!process.completed) {
        setTimeout(() => {
          onComplete(process.id);
        }, (index + 1) * 1500);
      }
    });
  }, [processes, onComplete]);

  return (
    <div className={styles.processVisualization}>
      {processes.map(process => (
        <div 
          key={process.id} 
          className={`${styles.processBubble} ${process.completed ? styles.completed : ''} ${styles[process.type]}`}
          style={process.position ? {
            left: process.position.x,
            top: process.position.y
          } : undefined}
        >
          <div className={styles.processIcon}>
            {process.type === 'pull' && '⬇️'}
            {process.type === 'create' && '🏗️'}
            {process.type === 'start' && '▶️'}
            {process.type === 'connect' && '🔗'}
            {process.type === 'error' && '❌'}
            {process.type === 'search' && '🔍'}
          </div>
          <div className={styles.processContent}>
            <div className={styles.processMessage}>{process.message}</div>
            {process.details && (
              <div className={styles.processDetails}>{process.details}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const Terminal: React.FC = () => {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);
  const [showImageDetails, setShowImageDetails] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isContainerListModalOpen, setIsContainerListModalOpen] = useState(false);
  const [isCommandDictModalOpen, setIsCommandDictModalOpen] = useState(false);
  const [images, setImages] = useState<Image[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageDownloading, setImageDownloading] = useState<string | null>(null);
  const [processes, setProcesses] = useState<ProcessStep[]>([]);
  const [animating, setAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [newContainerId, setNewContainerId] = useState<string | null>(null);
  const [newVolumeId, setNewVolumeId] = useState<string | null>(null);
  const [connectingVolume, setConnectingVolume] = useState<boolean>(false);
  const [containers, setContainers] = useState<Container[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setOutput(prev => [...prev, `$ ${command}`]);
    
    if (command.startsWith('docker network create')) {
      const networkName = command.split(' ')[3];
      if (networkName) {
        const newNetwork: Network = {
          id: Date.now().toString(),
          name: networkName,
          containers: []
        };
        setNetworks(prev => [...prev, newNetwork]);
        setActiveNetwork(newNetwork.id);
        setOutput(prev => [...prev, `네트워크 '${networkName}'가 생성되었습니다.`]);
      }
    }

    setCommand('');
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    setOutput(prev => [...prev, `$ ${trimmedCommand}`]);

    if (trimmedCommand.startsWith('docker')) {
      if (trimmedCommand.startsWith('docker volume create')) {
        const volumeName = trimmedCommand.split(' ')[3];
        if (volumeName) {
          const newVolume: Volume = {
            id: Date.now().toString(),
            name: volumeName,
            createdAt: new Date()
          };
          
          setVolumes(prev => [...prev, newVolume]);
          setNewVolumeId(newVolume.id);
          setOutput(prev => [...prev, `볼륨 '${volumeName}'이 생성되었습니다.`]);
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
          setOutput(prev => [...prev, `네트워크 '${networkName}'이 생성되었습니다.`]);
        }
      }
      else if (trimmedCommand.startsWith('docker run')) {
        const options = parseDockerRunCommand(trimmedCommand);
        
        if (options && activeNetwork) {
          const portMappings = trimmedCommand.match(/-p\s+(\d+:\d+)/g) || [];
          const ports = portMappings.map(mapping => {
            const [host, container] = mapping.replace('-p', '').trim().split(':');
            return { hostPort: host, containerPort: container };
          });

          const imageExists = images.some(img => {
            const fullImageName = `${img.name}:${img.tag}`;
            return fullImageName === options.image || 
                   (options.image.indexOf(':') === -1 && img.name === options.image && img.tag === 'latest');
          });

          if (!imageExists) {
            addProcessStep({
              type: 'search',
              message: '이미지 검색 중',
              details: `${options.image} 이미지를 검색합니다.`,
              position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 }
            });
            
            addProcessStep({
              type: 'pull',
              message: '이미지 다운로드 중',
              details: `${options.image} 이미지를 다운로드합니다.`,
              position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 }
            });
            
            setTimeout(() => {
              const [name, tag] = options.image.includes(':') 
                ? options.image.split(':') 
                : [options.image, 'latest'];
              
              const newImage: Image = {
            id: Date.now().toString(),
                name,
                tag: tag || 'latest',
                size: `${Math.floor(Math.random() * 200) + 10}MB`,
                created: new Date(),
                isOfficial: Math.random() > 0.3
              };
              
              setImages(prev => [...prev, newImage]);
              
              createContainerWithAnimation(options, ports, activeNetwork);
            }, 3000);
          } else {
            createContainerWithAnimation(options, ports, activeNetwork);
          }
        } else if (!activeNetwork) {
          setOutput(prev => [...prev, '먼저 네트워크를 선택해주세요.']);
        }
      }
      else if (trimmedCommand.startsWith('docker pull')) {
        const imageName = trimmedCommand.split(' ')[2];
        if (imageName) {
          setImageDownloading(imageName);
          setOutput(prev => [...prev, `이미지 '${imageName}'를 다운로드하는 중...`]);
          
          addProcessStep({
            type: 'search',
            message: '이미지 검색 중',
            details: `${imageName} 이미지를 검색합니다.`,
            position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 - 100 }
          });
          
          setTimeout(() => {
            addProcessStep({
              type: 'pull',
              message: '이미지 다운로드 중',
              details: `${imageName} 이미지를 다운로드합니다.`,
              position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 50 }
            });
            
            setTimeout(() => {
              const [name, tag] = imageName.includes(':') 
                ? imageName.split(':') 
                : [imageName, 'latest'];
              
              const newImage: Image = {
                id: Date.now().toString(),
                name,
                tag: tag || 'latest',
                size: `${Math.floor(Math.random() * 200) + 10}MB`,
                created: new Date(),
                isOfficial: Math.random() > 0.3
              };
              
              setImages(prev => [...prev, newImage]);
              setImageDownloading(null);
              setOutput(prev => [...prev, `이미지 '${imageName}'를 성공적으로 다운로드했습니다.`]);
            }, 2000);
          }, 1500);
        }
      }
      else if (trimmedCommand === 'docker images') {
        if (images.length === 0) {
          setOutput(prev => [...prev, 'REPOSITORY   TAG       IMAGE ID       CREATED         SIZE', '사용 가능한 이미지가 없습니다.']);
        } else {
          setOutput(prev => [
            ...prev, 
            'REPOSITORY   TAG       IMAGE ID       CREATED         SIZE',
            ...images.map(img => 
              `${img.name}   ${img.tag}       ${img.id.substring(0, 12)}       ${img.created.toLocaleDateString()}       ${img.size}`
            )
          ]);
        }
      }
      else if (trimmedCommand === 'docker ps' || trimmedCommand === 'docker ps -a') {
        const showAll = trimmedCommand === 'docker ps -a';
        const filteredContainers = showAll 
          ? containers 
          : containers.filter(c => c.status === 'running');
        
        if (filteredContainers.length === 0) {
          setOutput(prev => [
            ...prev, 
            'CONTAINER ID   IMAGE          COMMAND   CREATED          STATUS          PORTS           NAMES',
            '컨테이너를 찾을 수 없습니다.'
          ]);
        } else {
          setOutput(prev => [
            ...prev, 
            'CONTAINER ID   IMAGE          COMMAND   CREATED          STATUS          PORTS           NAMES',
            ...filteredContainers.map(c => 
              `${c.id.substring(0, 12)}   ${c.image}   "-"   ${c.createdAt.toLocaleString()}   ${c.status}   ${c.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ')}   ${c.name}`
            )
          ]);
        }
      }
    }

    setCommand('');
    
    if (terminalRef.current) {
      setTimeout(() => {
        terminalRef.current!.scrollTop = terminalRef.current!.scrollHeight;
      }, 100);
    }
  };

  const handleTabClick = (tabId: string) => {
    setActiveNetwork(tabId);
  };

  const handleTabClose = (tabId: string) => {
    setNetworks(prev => prev.filter(network => network.id !== tabId));
    if (activeNetwork === tabId) {
      setActiveNetwork(networks[0]?.id || null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOutput(prev => [...prev, `이미지 '${file.name}'를 업로드하는 중...`]);
      
      setTimeout(() => {
        setOutput(prev => [...prev, `이미지 '${file.name}'가 성공적으로 업로드되었습니다.`]);
      }, 1000);
    }
  };

  const getContainerLayoutClass = (containers: Container[]) => {
    if (containers.length <= 3) return styles.single;
    if (containers.length <= 6) return styles.double;
    return styles.triple;
  };

  const handleProcessComplete = (id: string) => {
    setProcesses(prev => 
      prev.map(p => p.id === id ? { ...p, completed: true } : p)
    );
    
    const lastProcess = processes[processes.length - 1];
    if (lastProcess && lastProcess.id === id) {
      setTimeout(() => {
        setAnimating(false);
        setProcesses([]);
      }, 1000);
    }
  };

  const addProcessStep = (step: Omit<ProcessStep, 'id'>) => {
    const newStep = {
      ...step,
      id: Date.now().toString(),
      completed: false
    };
    
    setProcesses(prev => [...prev, newStep]);
    
    if (!animating) {
      setAnimating(true);
    }
  };

  const createContainerWithAnimation = (
    options: any, 
    ports: Array<{hostPort: string; containerPort: string}>, 
    networkId: string
  ) => {
    addProcessStep({
      type: 'create',
      message: '컨테이너 생성 중',
      details: `${options.name || '컨테이너'}를 생성합니다.`,
      position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 }
    });
    
    setTimeout(() => {
      const container: Container = {
        id: Date.now().toString(),
        name: options.name || `container_${Date.now().toString().slice(-6)}`,
        image: options.image,
        ports: ports,
        status: 'running',
        createdAt: new Date(),
        network: networkId
      };

      if (options.volumes && options.volumes.length > 0) {
        const volumeOption = options.volumes[0];
        const volume = volumes.find(v => v.name === volumeOption.name);
        
        if (volume) {
          addProcessStep({
            type: 'connect',
            message: '볼륨 연결 중',
            details: `${volume.name} 볼륨을 컨테이너에 연결합니다.`,
            position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 + 50 }
          });
          
          setConnectingVolume(true);
          
          setVolumes(prev => prev.map(v => 
            v.id === volume.id 
              ? { ...v, mountPath: volumeOption.mountPath }
              : v
          ));
          container.volume = volume;
          
          setTimeout(() => {
            setConnectingVolume(false);
          }, 2000);
        }
      }

      addProcessStep({
        type: 'start',
        message: '컨테이너 시작 중',
        details: `${container.name} 컨테이너를 시작합니다.`,
        position: { x: window.innerWidth / 2 - 150, y: window.innerHeight / 2 + 100 }
      });

      setTimeout(() => {
        setNetworks(prev => prev.map(network => 
          network.id === networkId
            ? { ...network, containers: [...network.containers, container] }
            : network
        ));
        
        setContainers(prev => [...prev, container]);
        
        setNewContainerId(container.id);

        setOutput(prev => [
          ...prev,
          `컨테이너 '${container.name}'이 생성되었습니다.`,
          `이미지: ${container.image}`,
          ...(container.ports.length > 0 
            ? [`포트: ${container.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ')}`]
            : []),
          ...(container.volume
            ? [`볼륨: ${container.volume.name}`]
            : [])
        ]);
      }, 1500);
    }, 1500);
  };

  useEffect(() => {
    if (newContainerId) {
      const timer = setTimeout(() => {
        setNewContainerId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [newContainerId]);

  useEffect(() => {
    if (newVolumeId) {
      const timer = setTimeout(() => {
        setNewVolumeId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [newVolumeId]);

  const handleStartContainer = async (containerId: string) => {
    try {
      setIsProcessing(true);
      
      addProcessStep({
        type: 'start',
        message: `컨테이너 시작 중...`,
        details: `컨테이너 ID: ${containerId}`,
      });
      
      const container = containers.find(c => c.id === containerId);
      if (!container) {
        throw new Error('컨테이너를 찾을 수 없습니다.');
      }
      
      // 상태 업데이트된 컨테이너 생성
      const updatedContainer = { ...container, status: 'running' as const };
      
      // 전체 컨테이너 목록 업데이트
      const updatedContainers = containers.map(c => 
        c.id === containerId ? updatedContainer : c
      );
      setContainers(updatedContainers);
      
      // 네트워크 내 컨테이너도 업데이트
      const updatedNetworks = networks.map(network => ({
        ...network,
        containers: network.containers.map(c => 
          c.id === containerId ? updatedContainer : c
        )
      }));
      setNetworks(updatedNetworks);
      
      const startCommand = `docker start ${container.name}`;
      setCommandHistory(prev => [...prev, startCommand]);
      setOutput(prev => [...prev, `$ ${startCommand}`, `컨테이너 ${container.name}을(를) 시작했습니다.`]);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('컨테이너 시작 오류:', error);
      addProcessStep({
        type: 'error',
        message: '컨테이너 시작 실패',
        details: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      });
      setIsProcessing(false);
    }
  };

  const handleStopContainer = async (containerId: string) => {
    try {
      setIsProcessing(true);
      
      addProcessStep({
        type: 'start',
        message: `컨테이너 중지 중...`,
        details: `컨테이너 ID: ${containerId}`,
      });
      
      const container = containers.find(c => c.id === containerId);
      if (!container) {
        throw new Error('컨테이너를 찾을 수 없습니다.');
      }
      
      // 상태 업데이트된 컨테이너 생성
      const updatedContainer = { ...container, status: 'stopped' as const };
      
      // 전체 컨테이너 목록 업데이트
      const updatedContainers = containers.map(c => 
        c.id === containerId ? updatedContainer : c
      );
      setContainers(updatedContainers);
      
      // 네트워크 내 컨테이너도 업데이트
      const updatedNetworks = networks.map(network => ({
        ...network,
        containers: network.containers.map(c => 
          c.id === containerId ? updatedContainer : c
        )
      }));
      setNetworks(updatedNetworks);
      
      const stopCommand = `docker stop ${container.name}`;
      setCommandHistory(prev => [...prev, stopCommand]);
      setOutput(prev => [...prev, `$ ${stopCommand}`, `컨테이너 ${container.name}을(를) 중지했습니다.`]);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('컨테이너 중지 오류:', error);
      addProcessStep({
        type: 'error',
        message: '컨테이너 중지 실패',
        details: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      });
      setIsProcessing(false);
    }
  };

  const handleRemoveContainer = async (containerId: string) => {
    try {
      setIsProcessing(true);
      
      addProcessStep({
        type: 'start',
        message: `컨테이너 삭제 중...`,
        details: `컨테이너 ID: ${containerId}`,
      });
      
      const container = containers.find(c => c.id === containerId);
      if (!container) {
        throw new Error('컨테이너를 찾을 수 없습니다.');
      }
      
      if (container.status === 'running') {
        await handleStopContainer(containerId);
      }
      
      const updatedContainers = containers.filter(c => c.id !== containerId);
      setContainers(updatedContainers);
      
      const updatedNetworks = networks.map(n => ({
        ...n,
        containers: n.containers.filter(c => c.id !== containerId)
      }));
      setNetworks(updatedNetworks);
      
      const rmCommand = `docker rm ${container.name}`;
      setCommandHistory(prev => [...prev, rmCommand]);
      setOutput(prev => [...prev, `$ ${rmCommand}`, `컨테이너 ${container.name}을(를) 삭제했습니다.`]);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('컨테이너 삭제 오류:', error);
      addProcessStep({
        type: 'error',
        message: '컨테이너 삭제 실패',
        details: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      });
      setIsProcessing(false);
    }
  };

  const handleContainerClick = (container: Container) => {
    setIsContainerListModalOpen(false);
    setSelectedContainer(container);
  };

  // 컨테이너 상태 동기화 함수 추가
  const syncContainersWithNetworks = () => {
    // 모든 컨테이너 ID들
    const allContainerIds = new Set([
      ...containers.map(c => c.id),
      ...networks.flatMap(n => n.containers.map(c => c.id))
    ]);
    
    // 모든 컨테이너를 통합한 맵 생성
    const containerMap = new Map<string, Container>();
    
    // 컨테이너 배열에서 추가
    containers.forEach(container => {
      containerMap.set(container.id, container);
    });
    
    // 네트워크에서 추가 (동일 ID 있으면 덮어씀)
    networks.forEach(network => {
      network.containers.forEach(container => {
        // 이미 맵에 있는 경우, network 정보 추가/업데이트
        if (containerMap.has(container.id)) {
          const existing = containerMap.get(container.id)!;
          containerMap.set(container.id, {
            ...existing,
            network: network.name
          });
        } else {
          containerMap.set(container.id, {
            ...container,
            network: network.name
          });
        }
      });
    });
    
    // 최종 통합된 컨테이너 배열
    const uniqueContainers = Array.from(containerMap.values());
    
    // 컨테이너 배열 업데이트
    setContainers(uniqueContainers);
    
    // 네트워크 배열의 컨테이너도 업데이트
    const updatedNetworks = networks.map(network => ({
      ...network,
      containers: network.containers.map(container => {
        const updatedContainer = containerMap.get(container.id);
        return updatedContainer || container;
      })
    }));
    
    setNetworks(updatedNetworks);
  };

  // 컴포넌트 마운트 시 초기 테스트 데이터 생성
  useEffect(() => {
    // 초기 네트워크 생성
    const defaultNetworks: Network[] = [
      {
        id: '1001',
        name: 'net-front',
        containers: [],
        isNew: false
      },
      {
        id: '1002',
        name: 'net-back',
        containers: [],
        isNew: false
      }
    ];
    setNetworks(defaultNetworks);
    
    // 초기 컨테이너 생성
    const defaultContainers: Container[] = [
      {
        id: '101',
        name: 'web1',
        image: 'nginx:latest',
        ports: [{ hostPort: '80', containerPort: '80' }],
        status: 'running',
        createdAt: new Date(),
        network: 'net-front'
      },
      {
        id: '102',
        name: 'web2',
        image: 'nginx:latest',
        ports: [{ hostPort: '81', containerPort: '80' }],
        status: 'running',
        createdAt: new Date(),
        network: 'net-front'
      },
      {
        id: '103',
        name: 'web3',
        image: 'nginx:latest',
        ports: [{ hostPort: '82', containerPort: '80' }],
        status: 'running',
        createdAt: new Date(),
        network: 'net-front'
      },
      {
        id: '104',
        name: 'db1',
        image: 'mysql:8',
        ports: [{ hostPort: '3306', containerPort: '3306' }],
        status: 'stopped',
        createdAt: new Date(),
        network: 'net-back'
      }
    ];
    setContainers(defaultContainers);
    
    // 초기 이미지 생성
    const defaultImages: Image[] = [
      {
        id: '201',
        name: 'nginx',
        tag: 'latest',
        size: '133MB',
        created: new Date(),
        isOfficial: true
      },
      {
        id: '202',
        name: 'mysql',
        tag: '8',
        size: '545MB',
        created: new Date(),
        isOfficial: true
      }
    ];
    setImages(defaultImages);
    
    // 각 네트워크에 컨테이너 추가
    defaultNetworks[0].containers = defaultContainers.filter(c => c.network === 'net-front');
    defaultNetworks[1].containers = defaultContainers.filter(c => c.network === 'net-back');
    
    setActiveNetwork(defaultNetworks[0].id);
  }, []);

  return (
    <div className={styles.terminalContainer}>
      <div className={styles.terminalSection}>
        <div className={styles.output} ref={terminalRef}>
          {output.map((line, index) => (
            <div key={index} className={styles.commandLine}>
              {line}
            </div>
          ))}
        </div>
        <form className={styles.inputForm} onSubmit={handleCommandSubmit}>
          <div className={styles.commandLine}>
            <span className={styles.prompt}>$</span>
            <input
              type="text"
              className={styles.input}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="명령어를 입력하세요..."
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </form>
      </div>

      <div className={styles.browserSection}>
        <div className={styles.chromeToolbar}>
          <div className={styles.networkTabs}>
            {networks.map(network => (
              <div
                key={network.id}
                className={`${styles.chromeTab} ${activeNetwork === network.id ? styles.activeTab : ''}`}
                onClick={() => setActiveNetwork(network.id)}
              >
                <span className={styles.tabIcon}>⚡</span>
                <span className={styles.tabTitle}>{network.name}</span>
                <button
                  className={styles.tabClose}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newNetworks = networks.filter(n => n.id !== network.id);
                    setNetworks(newNetworks);
                    if (activeNetwork === network.id) {
                      setActiveNetwork(newNetworks[0]?.id || null);
                    }
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.networkContent}>
          {networks.map(network => (
            <div
              key={network.id}
              className={`${styles.networkContent} ${activeNetwork === network.id ? styles.active : ''}`}
              style={{ display: activeNetwork === network.id ? 'block' : 'none' }}
            >
              <div className={styles.networkContainer}>
                <div className={`${styles.containersSection} ${getContainerLayoutClass(network.containers)}`}>
                  {network.containers.map(container => (
                    <div 
                      key={container.id} 
                      className={`${styles.containerWrapper} ${newContainerId === container.id ? styles.creating : ''}`}
                    >
                      <ContainerCard
                        container={container}
                        onClick={() => setSelectedContainer(container)}
                        isCreating={newContainerId === container.id}
                      />
                      {container.volume && (
                        <div className={`${styles.volumeConnectionLine} ${connectingVolume && container.id === newContainerId ? styles.connecting : ''}`}>
                          {connectingVolume && container.id === newContainerId && (
                            <div className={styles.pulseDot}></div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.volumesSection}>
                  {volumes.map((volume, index) => (
                    <div
                      key={volume.id}
                      className={`${styles.volumeCircle} ${newVolumeId === volume.id ? styles.highlight : ''}`}
                      style={{ left: `${(index * 120) + 20}px` }}
                      onClick={() => setSelectedVolume(volume)}
                    >
                      <div className={styles.volumeName}>{volume.name}</div>
                      {network.containers.some(c => c.volume?.id === volume.id) && (
                        <div className={styles.volumeConnectionDot}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.actionButton}
            onClick={() => setIsLevelModalOpen(true)}
          >
            레벨 선택
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => {
              // 상태 동기화
              syncContainersWithNetworks();
              setIsContainerListModalOpen(true);
            }}
          >
            컨테이너 리스트
          </button>
          <button 
            className={styles.actionButton}
            onClick={() => setIsCommandDictModalOpen(true)}
          >
            명령어 사전
          </button>
        </div>
      </div>

      <LevelSelectModal 
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
      />
      <ContainerListModal
        isOpen={isContainerListModalOpen}
        onClose={() => {
          // 모달 닫을 때도 상태 동기화
          syncContainersWithNetworks();
          setIsContainerListModalOpen(false);
        }}
        containers={containers} 
        onStart={handleStartContainer}
        onStop={handleStopContainer}
        onRemove={handleRemoveContainer}
        onContainerClick={handleContainerClick}
      />
      <CommandDictionaryModal 
        isOpen={isCommandDictModalOpen}
        onClose={() => setIsCommandDictModalOpen(false)}
      />

      <div className={styles.uploadBar}>
        <div className={styles.uploadSection}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="application/x-tar,.tar"
            style={{ display: 'none' }}
          />
          <button
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
          >
            이미지 업로드
          </button>
          <button
            className={styles.viewImagesButton}
            onClick={() => setIsImageModalOpen(true)}
          >
            이미지 목록 보기
          </button>
        </div>
        {imageDownloading && (
          <div className={styles.downloadingStatus}>
            <div className={styles.loadingSpinner}></div>
            <span>{imageDownloading} 다운로드 중...</span>
          </div>
        )}
      </div>

      {selectedContainer && (
        <ContainerModal 
          container={selectedContainer} 
          onClose={() => setSelectedContainer(null)} 
          onStart={handleStartContainer}
          onStop={handleStopContainer}
          onRemove={handleRemoveContainer}
        />
      )}
      
      {selectedVolume && (
        <VolumeModal 
          volume={selectedVolume} 
          onClose={() => setSelectedVolume(null)} 
        />
      )}
      
      {isImageModalOpen && (
        <ImageModal 
          onClose={() => setIsImageModalOpen(false)} 
          images={images}
        />
      )}

      {animating && (
        <ProcessVisualization 
          processes={processes} 
          onComplete={handleProcessComplete} 
        />
      )}
    </div>
  );
};

export default Terminal; 