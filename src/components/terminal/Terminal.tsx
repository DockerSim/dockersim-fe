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
  createdAt: Date;
}

interface Container {
  id: string;
  name: string;
  image: string;
  ports: Port[];
  status: 'running' | 'stopped';
  createdAt: Date;
  volumes: string[];  // Volume IDs
  network?: string;
}

interface Network {
  id: string;
  name: string;
  containers: Container[];
}

interface ModalProps {
  onClose: () => void;
}

const ContainerModal: React.FC<{ container: Container } & ModalProps> = ({ container, onClose }) => {
  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>컨테이너 상세 정보</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.modalSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoLabel}>이름</div>
            <div className={styles.infoValue}>{container.name}</div>
            
            <div className={styles.infoLabel}>이미지</div>
            <div className={styles.infoValue}>{container.image}</div>
            
            <div className={styles.infoLabel}>상태</div>
            <div className={styles.infoValue}>
              <span className={`${styles.statusDot} ${styles[container.status]}`} />
              {container.status === 'running' ? '실행 중' : '중지됨'}
            </div>
            
            <div className={styles.infoLabel}>생성 시간</div>
            <div className={styles.infoValue}>
              {container.createdAt.toLocaleString()}
            </div>
          </div>
        </div>

        {container.ports.length > 0 && (
          <div className={styles.modalSection}>
            <h3 className={styles.sectionTitle}>포트 매핑</h3>
            <div className={styles.tagList}>
              {container.ports.map((port, index) => (
                <span key={index} className={styles.tag}>
                  {port.hostPort}:{port.containerPort}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const VolumeModal: React.FC<{ volume: Volume } & ModalProps> = ({ volume, onClose }) => {
  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>볼륨 상세 정보</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        
        <div className={styles.modalSection}>
          <div className={styles.infoGrid}>
            <div className={styles.infoLabel}>이름</div>
            <div className={styles.infoValue}>{volume.name}</div>
            
            {volume.mountPath && (
              <>
                <div className={styles.infoLabel}>마운트 경로</div>
                <div className={styles.infoValue}>{volume.mountPath}</div>
              </>
            )}
            
            <div className={styles.infoLabel}>생성 시간</div>
            <div className={styles.infoValue}>
              {volume.createdAt.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

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
          const container: Container = {
            id: Date.now().toString(),
            name: options.name || `container_${Date.now().toString().slice(-6)}`,
            image: options.image,
            ports: options.ports.map(port => ({
              hostPort: port.host,
              containerPort: port.container
            })),
            status: 'running',
            createdAt: new Date(),
            volumes: [],
            network: activeNetwork
          };

          if (options.volumes && options.volumes.length > 0) {
            const volumeIds = options.volumes
              .map(vol => {
                const volume = volumes.find(v => v.name === vol.name);
                if (volume) {
                  setVolumes(prev => prev.map(v => 
                    v.id === volume.id 
                      ? { ...v, mountPath: vol.mountPath }
                      : v
                  ));
                  return volume.id;
                }
                return null;
              })
              .filter((id): id is string => id !== null);

            container.volumes = volumeIds;
          }

          setNetworks(prev => prev.map(network => 
            network.id === activeNetwork
              ? { ...network, containers: [...network.containers, container] }
              : network
          ));

          setOutput(prev => [
            ...prev,
            `컨테이너 '${container.name}'이 생성되었습니다.`,
            `이미지: ${container.image}`,
            ...(container.ports.length > 0 
              ? [`포트: ${container.ports.map(p => `${p.hostPort}:${p.containerPort}`).join(', ')}`]
              : []),
            ...(container.volumes.length > 0
              ? [`볼륨: ${container.volumes.length}개의 볼륨이 연결되었습니다.`]
              : [])
          ]);
        } else if (!activeNetwork) {
          setOutput(prev => [...prev, '먼저 네트워크를 선택해주세요.']);
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
      // 여기에 파일 업로드 로직 추가
      setOutput(prev => [...prev, `이미지 '${file.name}'를 업로드하는 중...`]);
      
      // 실제 업로드 로직을 구현하세요
      setTimeout(() => {
        setOutput(prev => [...prev, `이미지 '${file.name}'가 성공적으로 업로드되었습니다.`]);
      }, 1000);
    }
  };

  const getContainerLayoutClass = (containers: Container[]) => {
    if (containers.length === 1) return styles.single;
    if (containers.length === 2) return styles.double;
    return '';
  };

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
                {network.containers.map(container => (
                  <div key={container.id} className={styles.containerWrapper}>
                    <div 
                      className={styles.containerCard}
                      onClick={() => setSelectedContainer(container)}
                    >
                      <div className={styles.containerTitle}>{container.name}</div>
                      <div className={styles.containerPorts}>
                        포트 번호: {container.ports.map(port => `${port.hostPort}:${port.containerPort}`).join(', ')}
                      </div>
                    </div>
                    {container.volumes.map(volumeId => {
                      const volume = volumes.find(v => v.id === volumeId);
                      if (volume) {
                        return (
                          <React.Fragment key={volume.id}>
                            <div className={styles.connectionLine} />
                            <div 
                              className={styles.volumeNode}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVolume(volume);
                              }}
                            >
                              <div className={styles.volumeName}>{volume.name}</div>
                            </div>
                          </React.Fragment>
                        );
                      }
                      return null;
                    })}
                  </div>
                ))}
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
            onClick={() => setIsContainerListModalOpen(true)}
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
        onClose={() => setIsContainerListModalOpen(false)}
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
            onClick={() => setShowImageDetails(!showImageDetails)}
          >
            이미지 목록 보기
          </button>
        </div>
      </div>

      {selectedContainer && (
        <ContainerModal 
          container={selectedContainer} 
          onClose={() => setSelectedContainer(null)} 
        />
      )}
      
      {selectedVolume && (
        <VolumeModal 
          volume={selectedVolume} 
          onClose={() => setSelectedVolume(null)} 
        />
      )}
    </div>
  );
};

export default Terminal; 