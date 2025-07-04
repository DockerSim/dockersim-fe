import React, { useRef } from 'react';
import { Container, Network, Volume, Image, ProcessStep } from '../../types';
import { ContainerCard } from '../containers/ContainerCard';
import { ContainerModal } from '../modals/ContainerModal';
import { VolumeModal } from '../modals/VolumeModal';
import { ImageModal } from '../modals/ImageModal';
import { ProcessVisualization } from '../visualizations/ProcessVisualization';
import { VolumeConnection } from '../visualizations/VolumeConnection';
import { DownloadVisualization, ImageIcon } from '../visualizations/DownloadVisualization';
import LevelSelectModal from '@/features/learning/components/learn/LevelSelectModal';
import ContainerListModal from '@/features/learning/components/learn/ContainerListModal';
import CommandDictionaryModal from '@/features/learning/components/learn/CommandDictionaryModal';
import { DockerMasterDetail } from '../DockerMasterDetail';
import styles from './Terminal.module.css';

interface TerminalPresentationProps {
  // 터미널 상태
  command: string;
  output: string[];
  isProcessing: boolean;

  // 데이터
  networks: Network[];
  containers: Container[];
  volumes: Volume[];
  images: Image[];
  processes: ProcessStep[];

  // 선택 상태
  activeNetwork: string | null;
  selectedContainer: Container | null;
  selectedVolume: Volume | null;

  // 모달 상태
  showImageDetails: boolean;
  isLevelModalOpen: boolean;
  isContainerListModalOpen: boolean;
  isCommandDictModalOpen: boolean;
  isImageBrowserOpen: boolean;
  isImageModalOpen: boolean;

  // 애니메이션 상태
  animating: boolean;
  newContainerId: string | null;
  newVolumeId: string | null;
  connectingVolume: boolean;

  // 다운로드 상태
  imageDownloading: string | null;
  isDownloading: boolean;
  downloadProgress: number;
  isDownloadComplete: boolean;

  // 기타 상태
  selectedImageTab: 'local' | 'registry';

  // 이벤트 핸들러
  onCommandChange: (value: string) => void;
  onCommandSubmit: (e: React.FormEvent) => void;
  onContainerClick: (container: Container) => void;
  onVolumeClick: (volume: Volume) => void;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartContainer: (id: string) => void;
  onStopContainer: (id: string) => void;
  onRemoveContainer: (id: string) => void;
  onImageRepositoryClick: () => void;
  onLocalImageClick: () => void;

  // 모달 핸들러
  onCloseImageDetails: () => void;
  onOpenLevelModal: () => void;
  onCloseLevelModal: () => void;
  onOpenContainerListModal: () => void;
  onCloseContainerListModal: () => void;
  onOpenCommandDictModal: () => void;
  onCloseCommandDictModal: () => void;
  onCloseImageBrowser: () => void;
  onCloseImageModal: () => void;

  // Refs
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  terminalRef: React.RefObject<HTMLDivElement | null>;
}

export const TerminalPresentation: React.FC<TerminalPresentationProps> = ({
  // 터미널 상태
  command,
  output,
  isProcessing,

  // 데이터
  networks,
  containers,
  volumes,
  images,
  processes,

  // 선택 상태
  activeNetwork,
  selectedContainer,
  selectedVolume,

  // 모달 상태
  showImageDetails,
  isLevelModalOpen,
  isContainerListModalOpen,
  isCommandDictModalOpen,
  isImageBrowserOpen,
  isImageModalOpen,

  // 애니메이션 상태
  animating,
  newContainerId,
  newVolumeId,
  connectingVolume,

  // 다운로드 상태
  imageDownloading,
  isDownloading,
  downloadProgress,
  isDownloadComplete,

  // 기타 상태
  selectedImageTab,

  // 이벤트 핸들러
  onCommandChange,
  onCommandSubmit,
  onContainerClick,
  onVolumeClick,
  onTabClick,
  onTabClose,
  onFileUpload,
  onStartContainer,
  onStopContainer,
  onRemoveContainer,
  onImageRepositoryClick,
  onLocalImageClick,

  // 모달 핸들러
  onCloseImageDetails,
  onOpenLevelModal,
  onCloseLevelModal,
  onOpenContainerListModal,
  onCloseContainerListModal,
  onOpenCommandDictModal,
  onCloseCommandDictModal,
  onCloseImageBrowser,
  onCloseImageModal,

  // Refs
  fileInputRef,
  terminalRef,
}) => {
  // 컨테이너 레이아웃 클래스 계산
  const getContainerLayoutClass = (containers: Container[]) => {
    if (containers.length === 0) return styles.emptyLayout;
    if (containers.length <= 2) return styles.smallLayout;
    return styles.normalLayout;
  };

  // 컨테이너 동기화 함수
  const syncContainersWithNetworks = () => {
    const allContainers: Container[] = [];
    networks.forEach(network => {
      network.containers.forEach(container => {
        allContainers.push({
          ...container,
          network: network.name
        });
      });
    });
    return allContainers;
  };

  // 이미지 브라우저 모달
  const ImageBrowserModal = () => (
    <div className={styles.modalOverlay} onClick={onCloseImageBrowser}>
      <div className={styles.chromeModal} onClick={e => e.stopPropagation()}>
        <div className={styles.chromeHeader}>
          <div className={styles.tabSection}>
            <div className={styles.activeTab}>
              <span className={styles.tabIcon}>🖼️</span>
              이미지 브라우저
            </div>
          </div>
          <button className={styles.chromeClose} onClick={onCloseImageBrowser}>×</button>
        </div>
        <div className={styles.modalContent}>
          <DockerMasterDetail initialTab={selectedImageTab} />
        </div>
      </div>
    </div>
  );

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
        <form className={styles.inputForm} onSubmit={onCommandSubmit}>
          <div className={styles.commandLine}>
            <span className={styles.prompt}>$</span>
            <input
              type="text"
              className={styles.input}
              value={command}
              onChange={(e) => onCommandChange(e.target.value)}
              placeholder="명령어를 입력하세요..."
              spellCheck={false}
              autoComplete="off"
              disabled={isProcessing}
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
                onClick={() => onTabClick(network.id)}
              >
                <span className={styles.tabIcon}>⚡</span>
                <span className={styles.tabTitle}>{network.name}</span>
                <button
                  className={styles.tabClose}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(network.id);
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
                        onClick={() => onContainerClick(container)}
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
                                  onClick={() => onVolumeClick(volume)}
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
                          onClick={() => onVolumeClick(volume)}
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
        
        {/* 이미지 아이콘 섹션 */}
        <div className={styles.imageIconsSection}>
          <ImageIcon 
            label="원격 저장소" 
            icon="🌐" 
            onClick={onImageRepositoryClick} 
          />
          <ImageIcon 
            label="로컬 이미지" 
            icon="🖼️" 
            onClick={onLocalImageClick} 
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.actionButton}
            onClick={onOpenLevelModal}
          >
            레벨 선택
          </button>
          <button 
            className={styles.actionButton}
            onClick={onOpenContainerListModal}
          >
            컨테이너 리스트
          </button>
          <button 
            className={styles.actionButton}
            onClick={onOpenCommandDictModal}
          >
            명령어 사전
          </button>
        </div>
      </div>

      {/* 프로세스 시각화 */}
      <ProcessVisualization processes={processes} />

      {/* 다운로드 시각화 */}
      <DownloadVisualization 
        isVisible={isDownloading}
        progress={downloadProgress}
        isCompleted={isDownloadComplete}
      />

      {/* 모달들 */}
      <LevelSelectModal 
        isOpen={isLevelModalOpen}
        onClose={onCloseLevelModal}
      />
      <ContainerListModal
        isOpen={isContainerListModalOpen}
        onClose={() => {
          syncContainersWithNetworks();
          onCloseContainerListModal();
        }}
        containers={syncContainersWithNetworks()} 
        onStart={onStartContainer}
        onStop={onStopContainer}
        onRemove={onRemoveContainer}
        onContainerClick={onContainerClick}
      />
      <CommandDictionaryModal 
        isOpen={isCommandDictModalOpen}
        onClose={onCloseCommandDictModal}
      />

      {selectedContainer && (
        <ContainerModal
          container={selectedContainer}
          onClose={() => onContainerClick({} as Container)}
          onStart={onStartContainer}
          onStop={onStopContainer}
          onRemove={onRemoveContainer}
        />
      )}

      {selectedVolume && (
        <VolumeModal
          volume={selectedVolume}
          onClose={() => onVolumeClick({} as Volume)}
        />
      )}

      {isImageBrowserOpen && <ImageBrowserModal />}

      {isImageModalOpen && (
        <ImageModal
          onClose={onCloseImageModal}
          images={images}
        />
      )}

      <div className={styles.uploadBar}>
        <div className={styles.uploadSection}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            accept="application/x-tar,.tar"
            style={{ display: 'none' }}
          />
          <button 
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.uploadIcon}>📁</span>
            이미지 업로드
          </button>
        </div>
      </div>
    </div>
  );
}; 