'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  networkId?: string;
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
  volumes?: Volume[];
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

interface Position {
  x: number;
  y: number;
}

interface ProcessStep {
  id: string;
  type: 'pull' | 'create' | 'start' | 'connect' | 'error' | 'search';
  message: string;
  details?: string;
  targetId?: string;
  position?: Position;
  completed?: boolean;
  stepNumber?: number;
  totalSteps?: number;
  containerId?: string;
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
    data-container-id={container.id}
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
    {container.volumes && container.volumes.length > 0 && (
      <div className={styles.volumeConnection}>
        {container.volumes.map((volume, index) => (
          <span key={index} className={styles.volumeBadge}>
            {volume.name}
          </span>
        ))}
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
                {container.volumes && container.volumes.length > 0 && (
                  <div className={styles.infoGroup}>
                    <label>볼륨</label>
                    <div className={styles.volumeInfo}>
                      {container.volumes.map((volume, idx) => (
                        <div key={idx} className={styles.volumeItem}>
                          <span className={styles.volumeTag}>{volume.name}</span>
                          <span className={styles.mountPath}>{volume.mountPath}</span>
                        </div>
                      ))}
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

// 프로세스 단계 위치 계산을 개선하는 함수 추가
const calculateProcessPosition = (type: string, processIndex: number): Position => {
  // 기본 위치
  const baseX = window.innerWidth / 2 - 150;
  const baseY = 150;
  
  // 프로세스 타입별 수직 오프셋
  const typeOffsets = {
    'search': 0,
    'pull': 1,
    'create': 2,
    'connect': 3,
    'start': 4,
    'error': 5
  };
  
  // 타입별 오프셋 계산 (해당 타입이 없으면 기본값 0)
  const typeOffset = (typeOffsets as any)[type] || 0;
  
  // 프로세스 인덱스에 따른 수평 오프셋
  const horizontalOffset = (processIndex % 3) * 320; // 3개씩 수평 배치, 각 320px 간격
  
  // 최종 위치 계산
  return {
    x: baseX + horizontalOffset,
    y: baseY + (typeOffset * 90) // 각 타입별 90px 간격으로 수직 배치
  };
};

// 컨테이너 위치를 기반으로 프로세스 말풍선의 위치 조정 함수
const adjustProcessPositionToContainer = (containerId: string | undefined): Position | undefined => {
  if (!containerId) return undefined;
  
  // 먼저 컨테이너 래퍼 요소 찾기 (더 큰 컨테이너 영역)
  const containerWrapperElement = document.querySelector(`.${styles.containerWrapper}[data-container-id="${containerId}"]`);
  if (containerWrapperElement) {
    const rect = containerWrapperElement.getBoundingClientRect();
    return {
      x: rect.left + (rect.width / 2) - 150, // 말풍선 중앙 정렬
      y: rect.top - 100 // 컨테이너 위쪽에 약간 더 가깝게 배치
    };
  }
  
  // 래퍼를 찾지 못하면 컨테이너 카드 요소 찾기
  const containerElement = document.querySelector(`[data-container-id="${containerId}"]`);
  if (containerElement) {
    const rect = containerElement.getBoundingClientRect();
    return {
      x: rect.left + (rect.width / 2) - 150, // 말풍선 중앙 정렬
      y: rect.top - 100 // 컨테이너 위쪽에 약간 더 가깝게 배치
    };
  }
  
  return undefined;
};

const ProcessVisualization: React.FC<{ 
  processes: ProcessStep[];
}> = ({ processes }) => {
  // 컨테이너 ID별로 프로세스 그룹화
  const groupedProcesses = processes.reduce<Record<string, ProcessStep[]>>((acc, process) => {
    const key = process.containerId || 'global';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(process);
    return acc;
  }, {});

  // 가장 최신 단계만 표시 (각 그룹별로)
  const latestProcesses = Object.values(groupedProcesses).map(group => {
    // 완료되지 않은 프로세스가 있으면 그 중 가장 높은 단계를 표시
    const incomplete = group.filter(p => !p.completed);
    if (incomplete.length > 0) {
      return incomplete.reduce((latest, current) => 
        (current.stepNumber || 0) > (latest.stepNumber || 0) ? current : latest
      );
    }
    // 모두 완료된 경우 가장 높은 단계를 표시
    return group.reduce((latest, current) => 
      (current.stepNumber || 0) > (latest.stepNumber || 0) ? current : latest
    );
  });

  // 각 프로세스에 대해, 해당 컨테이너 위치 기반으로 위치 업데이트
  const [displayProcesses, setDisplayProcesses] = useState<ProcessStep[]>([]);
  
  // 위치 업데이트 함수
  const updateProcessPositions = useCallback(() => {
    const updatedProcesses = latestProcesses.map(process => {
      // 컨테이너가 있는 프로세스만 위치 조정
      if (process.containerId) {
        const newPosition = adjustProcessPositionToContainer(process.containerId);
        if (newPosition) {
          return {
            ...process,
            position: newPosition
          };
        }
      }
      return process;
    });
    
    setDisplayProcesses(updatedProcesses);
  }, [latestProcesses]);
  
  // 컴포넌트 마운트/업데이트 시 위치 계산
  useEffect(() => {
    updateProcessPositions();
    
    // 창 크기 변경 시 위치 재계산
    window.addEventListener('resize', updateProcessPositions);
    
    // 클린업 함수
    return () => {
      window.removeEventListener('resize', updateProcessPositions);
    };
  }, [updateProcessPositions]);
  
  // processes가 변경될 때마다 displayProcesses 업데이트
  useEffect(() => {
    updateProcessPositions();
  }, [processes, updateProcessPositions]);

  return (
    <div className={styles.processVisualization}>
      {displayProcesses.map((process, index) => (
        <div 
          key={process.id} 
          className={`${styles.processBubble} ${process.completed ? styles.completed : ''} ${styles[process.type]}`}
          style={{
            left: process.position?.x,
            top: process.position?.y,
            zIndex: 1000 + index
          }}
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
            {process.stepNumber !== undefined && process.totalSteps !== undefined && (
              <div className={styles.processProgress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{width: `${(process.stepNumber / process.totalSteps) * 100}%`}}
                  ></div>
                </div>
                <div className={styles.progressText}>
                  {process.stepNumber} / {process.totalSteps}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const VolumeConnection: React.FC<{
  container: Container;
  volume: Volume;
  isConnecting: boolean;
  index?: number;
  containerCount?: number;
}> = ({ container, volume, isConnecting, index = 0, containerCount = 1 }) => {
  // 컨테이너에서 볼륨 상단에 직접 연결되는 경로 (정확한 높이로 조정)
  const path = `M50,0 L50,95`;
  
  const connectionClass = isConnecting 
    ? styles.connecting 
    : container.id.slice(-4) === volume.id.slice(-4)
      ? styles.highlighted 
      : styles.connected;
  
  return (
    <div 
      className={`${styles.volumeConnectionContainer} ${connectionClass}`}
      data-container-id={container.id}
      data-volume-id={volume.id}
    >
      <svg className={styles.connectionPath} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <path 
          d={path}
          stroke="#1c7ed6" 
          strokeWidth="3" 
          fill="none"
          strokeLinecap="round"
          strokeDasharray={isConnecting ? "5,5" : "none"}
          className={styles.connectionPathSvg}
        />
      </svg>
      
      {isConnecting && (
        <div className={styles.pulseDot} style={{ left: '50%', bottom: '5px' }}></div>
      )}
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
            createdAt: new Date(),
            networkId: activeNetwork || undefined
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

          // -v 또는 --volume 옵션으로 볼륨 마운트
          // 정규식 패턴 개선: "확장자" 부분을 제외하고 볼륨 이름만 정확히 추출하도록 수정
          const volumeMappings = trimmedCommand.match(/(-v|--volume)\s+([^\s]+)/g) || [];
          
          // --mount 옵션도 지원
          const mountMappings = trimmedCommand.match(/--mount\s+([^\s]+)/g) || [];
          
          // 볼륨 옵션을 담을 배열
          const volumeOptions: Array<{name: string, mountPath: string}> = [];
          
          // --mount 옵션 파싱
          if (mountMappings.length > 0) {
            for (const mountMapping of mountMappings) {
              const mountItem = mountMapping;
              if (mountItem) {
                const mountStr = mountItem.replace('--mount', '').trim();
                // source=vol1,target=/data 형식 파싱
                const mountParts = mountStr.split(',');
                
                let volumeName = '';
                let mountPath = '/data'; // 기본값
                
                // source와 target 추출
                mountParts.forEach(part => {
                  if (part.startsWith('source=')) {
                    volumeName = part.replace('source=', '');
                  } else if (part.startsWith('target=')) {
                    mountPath = part.replace('target=', '');
                  }
                });
                
                if (volumeName) {
                  // 볼륨 옵션 배열에 추가
                  volumeOptions.push({
                    name: volumeName,
                    mountPath: mountPath
                  });
                  
                  // 볼륨이 존재하지 않으면 생성
                  if (!volumes.find(v => v.name === volumeName)) {
                    addProcessStep({
                      type: 'create',
                      message: '볼륨 자동 생성 중',
                      details: `볼륨 '${volumeName}'이 존재하지 않아 자동으로 생성합니다.`,
                      position: calculateProcessPosition(volumeName, processes.length),
                      containerId: volumeName,
                      stepNumber: 1,
                      totalSteps: 2
                    });
                    
                    const newVolume: Volume = {
                      id: `vol_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                      name: volumeName,
                      mountPath: mountPath,
                      createdAt: new Date(),
                      networkId: activeNetwork || undefined
                    };
                    
                    setVolumes(prev => [...prev, newVolume]);
                    setNewVolumeId(newVolume.id);
                    
                    setOutput(prev => [...prev, `볼륨 '${volumeName}'이 생성되었습니다.`]);
                  }
                }
              }
            }
          }
          
          // -v 옵션 파싱
          if (volumeMappings.length > 0) {
            // 원본 형식 추출을 위해 정규식 파싱 개선
            for (const volumeMapping of volumeMappings) {
              const volumeItem = volumeMapping.trim();
              if (volumeItem) {
                // -v 또는 --volume 제거
                const volumeStr = volumeItem.replace(/-v|--volume/, '').trim();
                const volumeParts = volumeStr.split(':');
                const volumeName = volumeParts[0];
                const mountPath = volumeParts.length > 1 ? volumeParts[1] : '/data';
                
                console.log(`볼륨 마운트 파싱: ${volumeName} -> ${mountPath}`);
                
                // 볼륨 옵션 배열에 추가
                volumeOptions.push({
                  name: volumeName,
                  mountPath: mountPath
                });
                
                // 볼륨이 존재하지 않으면 생성
                if (!volumes.find(v => v.name === volumeName)) {
                  addProcessStep({
                    type: 'create',
                    message: '볼륨 자동 생성 중',
                    details: `볼륨 '${volumeName}'이 존재하지 않아 자동으로 생성합니다.`,
                    position: calculateProcessPosition(volumeName, processes.length),
                    containerId: volumeName,
                    stepNumber: 1,
                    totalSteps: 2
                  });
                  
                  const newVolume: Volume = {
                    id: `vol_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    name: volumeName,
                    mountPath: mountPath,
                    createdAt: new Date(),
                    networkId: activeNetwork || undefined
                  };
                  
                  setVolumes(prev => [...prev, newVolume]);
                  setNewVolumeId(newVolume.id);
                  
                  setOutput(prev => [...prev, `볼륨 '${volumeName}'이 생성되었습니다.`]);
                }
              }
            }
          }
          
          // 최종적으로 모든 볼륨 옵션을 컨테이너 생성에 전달
          if (volumeOptions.length > 0) {
            options.volumes = volumeOptions;
          }

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
              position: calculateProcessPosition('search', processes.length),
              containerId: options.image,
              stepNumber: 1,
              totalSteps: 3
            });
            
            addProcessStep({
              type: 'pull',
              message: '이미지 다운로드 중',
              details: `${options.image} 이미지를 다운로드합니다.`,
              position: calculateProcessPosition('pull', processes.length),
              containerId: options.image,
              stepNumber: 2,
              totalSteps: 3
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
            position: calculateProcessPosition('search', processes.length),
            containerId: imageName,
            stepNumber: 1,
            totalSteps: 3
          });
          
          setTimeout(() => {
            addProcessStep({
              type: 'pull',
              message: '이미지 다운로드 중',
              details: `${imageName} 이미지를 다운로드합니다.`,
              position: calculateProcessPosition('pull', processes.length),
              containerId: imageName,
              stepNumber: 2,
              totalSteps: 3
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
    
    const completedCount = processes.filter(p => p.completed || p.id === id).length;
    if (completedCount === processes.length) {
      setTimeout(() => {
        setAnimating(false);
        setProcesses([]);
      }, 1000);
    }
  };

  const addProcessStep = (step: Omit<ProcessStep, 'id'>) => {
    // 프로세스 인덱스 계산
    const processIndex = processes.length;
    
    // 위치가 명시적으로 지정되지 않은 경우, 계산된 위치 사용
    const position = step.position || calculateProcessPosition(step.type, processIndex);
    
    const newStep = {
      ...step,
      id: Date.now().toString(),
      completed: false,
      position
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
    // 컨테이너 ID 미리 생성
    const containerId = Date.now().toString();
    
    // 회색 박스 효과를 위한 새 컨테이너 객체 생성 (반투명 모드)
    const previewContainer: Container = {
      id: containerId,
      name: options.name || `container_${containerId.slice(-6)}`,
      image: options.image,
      ports: ports,
      status: 'stopped', // 초기에는 중지 상태로 표시
      createdAt: new Date(),
      network: networkId,
      volumes: []
    };
    
    // 네트워크에 미리 추가 (반투명하게 표시)
    setNetworks(prev => prev.map(network => 
      network.id === networkId
        ? { ...network, containers: [...network.containers, previewContainer] }
        : network
    ));
    
    // 컨테이너 목록에 미리 추가
    setContainers(prev => [...prev, previewContainer]);
    
    // 컨테이너 생성 중임을 표시
    setNewContainerId(containerId);
    
    // 총 단계 수 계산
    const hasVolumes = options.volumes && options.volumes.length > 0;
    const totalSteps = hasVolumes ? 3 : 2; // 볼륨이 있으면 3단계, 없으면 2단계
    
    // 1단계: 컨테이너 생성 중
    addProcessStep({
      type: 'create',
      message: '컨테이너 생성 중',
      details: `${previewContainer.name} 컨테이너를 생성하고 있습니다.`,
      containerId: containerId,
      stepNumber: 1,
      totalSteps: totalSteps
    });
    
    // 볼륨 연결 단계 (있는 경우)
    if (hasVolumes) {
      setTimeout(() => {
        // 모든 볼륨을 처리
        const volumesToConnect: Volume[] = [];
        
        for (const volumeOption of options.volumes) {
          const volume = volumes.find(v => v.name === volumeOption.name);
          
          if (volume) {
            // 이미 존재하는 볼륨 연결
            volumesToConnect.push({
              ...volume,
              mountPath: volumeOption.mountPath,
              networkId: networkId
            });
            
            // 볼륨 상태 업데이트
            setVolumes(prev => prev.map(v => 
              v.id === volume.id 
                ? { ...v, mountPath: volumeOption.mountPath, networkId: networkId }
                : v
            ));
          } else {
            // 새 볼륨 생성 및 연결
            const newVolume: Volume = {
              id: `vol_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              name: volumeOption.name,
              mountPath: volumeOption.mountPath,
              createdAt: new Date(),
              networkId: networkId
            };
            
            setVolumes(prev => [...prev, newVolume]);
            setNewVolumeId(newVolume.id);
            volumesToConnect.push(newVolume);
            
            setOutput(prev => [...prev, `볼륨 '${volumeOption.name}'이 생성되었습니다.`]);
          }
        }
        
        if (volumesToConnect.length > 0) {
          // 컨테이너에 볼륨 연결
          setContainers(prev => prev.map(c => 
            c.id === containerId 
              ? { ...c, volumes: volumesToConnect }
              : c
          ));
          
          // 네트워크 내 컨테이너에도 볼륨 연결 업데이트
          setNetworks(prev => prev.map(network => ({
            ...network,
            containers: network.containers.map(c => 
              c.id === containerId 
                ? { ...c, volumes: volumesToConnect }
                : c
            )
          })));
          
          // 연결 애니메이션 효과
          setConnectingVolume(true);
          
          // 2단계: 볼륨 연결 중
          addProcessStep({
            type: 'connect',
            message: '볼륨 연결 중',
            details: `${volumesToConnect.map(v => v.name).join(', ')} 볼륨을 컨테이너에 연결하고 있습니다.`,
            containerId: containerId,
            stepNumber: 2,
            totalSteps: totalSteps
          });
          
          setTimeout(() => {
            setConnectingVolume(false);
            
            // 3단계: 컨테이너 시작 중
            addProcessStep({
              type: 'start',
              message: '컨테이너 시작 중',
              details: `${previewContainer.name} 컨테이너를 시작하고 있습니다.`,
              containerId: containerId,
              stepNumber: 3,
              totalSteps: totalSteps
            });
            
            // 컨테이너 상태를 running으로 변경
            setTimeout(() => {
              // 컨테이너 상태 업데이트
              setContainers(prev => prev.map(c => 
                c.id === containerId 
                  ? { ...c, status: 'running' }
                  : c
              ));
              
              // 네트워크 내 컨테이너 상태 업데이트
              setNetworks(prev => prev.map(network => ({
                ...network,
                containers: network.containers.map(c => 
                  c.id === containerId 
                    ? { ...c, status: 'running' }
                    : c
                )
              })));
              
              // 프로세스 완료로 표시 (1초 후 말풍선 사라짐)
              setTimeout(() => {
                handleAllProcessesComplete(containerId);
              }, 1000);
              
              // 출력 메시지 업데이트
              setOutput(prev => [
                ...prev,
                `컨테이너 '${previewContainer.name}'이 생성되었습니다.`,
                `이미지: ${previewContainer.image}`,
                ...(previewContainer.ports.length > 0 
                  ? [`포트: ${previewContainer.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ')}`]
                  : []),
                ...(volumesToConnect.length > 0
                  ? [`볼륨: ${volumesToConnect.map(v => v.name).join(', ')}`]
                  : [])
              ]);
            }, 1500);
          }, 1500);
        }
      }, 1500);
    } else {
      // 볼륨이 없는 경우, 바로 시작 단계로
      setTimeout(() => {
        // 2단계: 컨테이너 시작 중
        addProcessStep({
          type: 'start',
          message: '컨테이너 시작 중',
          details: `${previewContainer.name} 컨테이너를 시작하고 있습니다.`,
          containerId: containerId,
          stepNumber: 2,
          totalSteps: totalSteps
        });
        
        // 컨테이너 상태를 running으로 변경
        setTimeout(() => {
          // 컨테이너 상태 업데이트
          setContainers(prev => prev.map(c => 
            c.id === containerId 
              ? { ...c, status: 'running' }
              : c
          ));
          
          // 네트워크 내 컨테이너 상태 업데이트
          setNetworks(prev => prev.map(network => ({
            ...network,
            containers: network.containers.map(c => 
              c.id === containerId 
                ? { ...c, status: 'running' }
                : c
            )
          })));
          
          // 프로세스 완료로 표시 (1초 후 말풍선 사라짐)
          setTimeout(() => {
            handleAllProcessesComplete(containerId);
          }, 1000);
          
          // 출력 메시지 업데이트
          setOutput(prev => [
            ...prev,
            `컨테이너 '${previewContainer.name}'이 생성되었습니다.`,
            `이미지: ${previewContainer.image}`,
            ...(previewContainer.ports.length > 0 
              ? [`포트: ${previewContainer.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ')}`]
              : [])
          ]);
        }, 1500);
      }, 1500);
    }
  };

  // 특정 컨테이너의 모든 프로세스를 완료로 표시하는 함수
  const handleAllProcessesComplete = (containerId: string) => {
    setProcesses(prev => 
      prev.map(p => p.containerId === containerId ? { ...p, completed: true } : p)
    );
    
    // 모든 프로세스가 완료되었는지 확인
    setTimeout(() => {
      const allCompleted = processes.every(p => p.completed);
      if (allCompleted) {
        setAnimating(false);
        setProcesses([]);
      }
    }, 1000);
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
        containerId: containerId,
        stepNumber: 1,
        totalSteps: 1
      });
      
      const container = containers.find(c => c.id === containerId);
      if (!container) {
        throw new Error('컨테이너를 찾을 수 없습니다.');
      }
      
      const updatedContainer = { ...container, status: 'running' as const };
      
      const updatedContainers = containers.map(c => 
        c.id === containerId ? updatedContainer : c
      );
      setContainers(updatedContainers);
      
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
      
      setTimeout(() => {
        handleAllProcessesComplete(containerId);
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('컨테이너 시작 오류:', error);
      addProcessStep({
        type: 'error',
        message: '컨테이너 시작 실패',
        details: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        containerId: containerId
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
        containerId: containerId,
        stepNumber: 1,
        totalSteps: 1
      });
      
      const container = containers.find(c => c.id === containerId);
      if (!container) {
        throw new Error('컨테이너를 찾을 수 없습니다.');
      }
      
      const updatedContainer = { ...container, status: 'stopped' as const };
      
      const updatedContainers = containers.map(c => 
        c.id === containerId ? updatedContainer : c
      );
      setContainers(updatedContainers);
      
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
      
      setTimeout(() => {
        handleAllProcessesComplete(containerId);
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('컨테이너 중지 오류:', error);
      addProcessStep({
        type: 'error',
        message: '컨테이너 중지 실패',
        details: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        containerId: containerId
      });
      setIsProcessing(false);
    }
  };

  const handleRemoveContainer = async (containerId: string) => {
    try {
      setIsProcessing(true);
      
      // 먼저 컨테이너 객체 찾기
      const container = containers.find(c => c.id === containerId);
      if (!container) {
        throw new Error('컨테이너를 찾을 수 없습니다.');
      }
      
      // 1. 먼저 프로세스 말풍선 표시
      if (container.status === 'running') {
        // 1-1. 컨테이너가 실행 중이면 중지 메시지 표시
        addProcessStep({
          type: 'start',
          message: `컨테이너 중지 중...`,
          details: `실행 중인 컨테이너를 먼저 중지합니다.`,
          containerId: containerId,
          stepNumber: 1,
          totalSteps: 2
        });
        
        // 컨테이너 중지 (직접 상태 변경)
        const updatedContainer = { ...container, status: 'stopped' as const };
        setContainers(prev => prev.map(c => c.id === containerId ? updatedContainer : c));
        setNetworks(prev => prev.map(network => ({
          ...network,
          containers: network.containers.map(c => 
            c.id === containerId ? updatedContainer : c
          )
        })));
        
        // 중지 명령어 출력
        const stopCommand = `docker stop ${container.name}`;
        setCommandHistory(prev => [...prev, stopCommand]);
        setOutput(prev => [...prev, `$ ${stopCommand}`, `컨테이너 ${container.name}을(를) 중지했습니다.`]);
        
        // 잠시 대기 (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 1-2. 삭제 단계 메시지 표시
        addProcessStep({
          type: 'start',
          message: `컨테이너 삭제 중...`,
          details: `컨테이너 ${container.name}을(를) 삭제합니다.`,
          containerId: containerId,
          stepNumber: 2,
          totalSteps: 2
        });
      } else {
        // 컨테이너가 이미 중지 상태면 삭제 메시지만 표시
        addProcessStep({
          type: 'start',
          message: `컨테이너 삭제 중...`,
          details: `컨테이너 ${container.name}을(를) 삭제합니다.`,
          containerId: containerId,
          stepNumber: 1,
          totalSteps: 1
        });
      }
      
      // 컨테이너에 연결된 볼륨 정보 저장
      const attachedVolumes = container.volumes || [];
      
      // 말풍선 표시 시간 (1초)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 컨테이너 삭제 명령 출력 메시지 추가
      const rmCommand = `docker rm ${container.name}`;
      setCommandHistory(prev => [...prev, rmCommand]);
      setOutput(prev => [...prev, `$ ${rmCommand}`, `컨테이너 ${container.name}을(를) 삭제했습니다.`]);
      
      // 볼륨 정보 유지 관련 메시지 추가
      if (attachedVolumes.length > 0) {
        setOutput(prev => [
          ...prev, 
          `볼륨 ${attachedVolumes.map(v => `'${v.name}'`).join(', ')}은(는) 유지됩니다.`
        ]);
      }
      
      // 말풍선 완전히 제거 (컨테이너 삭제 전에)
      setProcesses(prev => prev.filter(p => p.containerId !== containerId));
      
      // 잠시 대기 (말풍선이 완전히 사라지는 시간)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 컨테이너 삭제 처리 진행
      const updatedContainers = containers.filter(c => c.id !== containerId);
      setContainers(updatedContainers);
      
      // 네트워크에서도 컨테이너 삭제
      const updatedNetworks = networks.map(n => ({
        ...n,
        containers: n.containers.filter(c => c.id !== containerId)
      }));
      setNetworks(updatedNetworks);
      
      // 처리 완료
      setIsProcessing(false);
    } catch (error) {
      console.error('컨테이너 삭제 오류:', error);
      addProcessStep({
        type: 'error',
        message: '컨테이너 삭제 실패',
        details: `오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        containerId: containerId
      });
      setIsProcessing(false);
    }
  };

  const handleContainerClick = (container: Container) => {
    setIsContainerListModalOpen(false);
    setSelectedContainer(container);
  };

  const syncContainersWithNetworks = () => {
    const allContainerIds = new Set([
      ...containers.map(c => c.id),
      ...networks.flatMap(n => n.containers.map(c => c.id))
    ]);
    
    const containerMap = new Map<string, Container>();
    
    containers.forEach(container => {
      containerMap.set(container.id, container);
    });
    
    networks.forEach(network => {
      network.containers.forEach(container => {
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
    
    const uniqueContainers = Array.from(containerMap.values());
    
    setContainers(uniqueContainers);
    
    const updatedNetworks = networks.map(network => ({
      ...network,
      containers: network.containers.map(container => {
        const updatedContainer = containerMap.get(container.id);
        return updatedContainer || container;
      })
    }));
    
    setNetworks(updatedNetworks);
  };

  useEffect(() => {
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
    
    const defaultContainers: Container[] = [
      {
        id: '101',
        name: 'web1',
        image: 'nginx:latest',
        ports: [{ hostPort: '80', containerPort: '80' }],
        status: 'running',
        createdAt: new Date(),
        network: 'net-front',
        volumes: [] // 빈 배열로 초기화
      },
      {
        id: '102',
        name: 'web2',
        image: 'nginx:latest',
        ports: [{ hostPort: '81', containerPort: '80' }],
        status: 'running',
        createdAt: new Date(),
        network: 'net-front',
        volumes: []
      },
      {
        id: '103',
        name: 'web3',
        image: 'nginx:latest',
        ports: [{ hostPort: '82', containerPort: '80' }],
        status: 'running',
        createdAt: new Date(),
        network: 'net-front',
        volumes: []
      },
      {
        id: '104',
        name: 'db1',
        image: 'mysql:8',
        ports: [{ hostPort: '3306', containerPort: '3306' }],
        status: 'stopped',
        createdAt: new Date(),
        network: 'net-back',
        volumes: []
      }
    ];
    setContainers(defaultContainers);
    
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
                  {network.containers.map((container, idx) => (
                    <div 
                      key={container.id} 
                      className={`${styles.containerWrapper} ${newContainerId === container.id ? styles.creating : ''}`}
                      data-container-id={container.id}
                    >
                      <ContainerCard
                        container={container}
                        onClick={() => setSelectedContainer(container)}
                        isCreating={newContainerId === container.id}
                      />
                      {container.volumes && container.volumes.length > 0 ? (
                        <div className={styles.volumesContainer}>
                          {container.volumes.map((volume, volumeIdx) => {
                            // 볼륨 간 간격 계산 - 적절한 간격으로 조정
                            const volumeCount = container.volumes?.length || 0;
                            const offset = volumeCount > 1
                              ? (volumeIdx - (volumeCount - 1) / 2) * 100
                              : 0;
                            
                            return (
                              <div 
                                key={`${container.id}-${volume.id}`} 
                                className={styles.volumeConnectionWrapper}
                                style={{ 
                                  transform: `translateX(${offset}px)`,
                                  position: 'absolute', 
                                  left: '50%',
                                  marginLeft: '-35px', // 볼륨 너비의 절반 (70px/2)
                                  top: '0'
                                }}
                              >
                                <VolumeConnection 
                                  container={container}
                                  volume={volume}
                                  isConnecting={connectingVolume && container.id === newContainerId}
                                />
                                <div 
                                  className={`${styles.volumeCircle} ${styles.attachedVolume} ${newVolumeId === volume.id ? styles.highlight : ''}`}
                                  onClick={() => setSelectedVolume(volume)}
                                >
                                  <div className={styles.volumeConnectionDot}></div>
                                  <div className={styles.volumeName}>{volume.name}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className={styles.volumesContainerArea}>
                  <h3 className={styles.volumeSectionTitle}>연결되지 않은 볼륨</h3>
                  <div className={styles.volumesSection}>
                    {volumes
                      .filter(volume => 
                        (volume.networkId === network.id || !volume.networkId) && 
                        !network.containers.some(c => c.volumes?.some(v => v.id === volume.id))
                      )
                      .map((volume, index) => (
                        <div
                          key={`unconnected-${volume.id}`}
                          className={`${styles.volumeCircle} ${styles.unconnectedVolume} ${newVolumeId === volume.id ? styles.highlight : ''}`}
                          style={{ 
                            left: `${(index * 120) + 20}px`,
                            position: 'relative',
                            zIndex: 5
                          }}
                          onClick={() => setSelectedVolume(volume)}
                        >
                          <div className={styles.volumeName}>{volume.name}</div>
                        </div>
                      ))}
                    
                    {volumes.filter(v => !network.containers.some(c => c.volumes?.some(cv => cv.id === v.id))).length === 0 && (
                      <div className={styles.emptyVolumeMessage}>연결되지 않은 볼륨이 없습니다</div>
                    )}
                  </div>
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
        />
      )}
    </div>
  );
};

export default Terminal; 