'use client';

import React, { useState, useRef } from 'react';
import { TerminalPresentation } from '../components/terminal/TerminalPresentation';
import { useDockerCommands } from '../hooks/useDockerCommands';
import { useContainerManagement } from '../hooks/useContainerManagement';
import { useProcessVisualization } from '../hooks/useProcessVisualization';
import { useNetworkManagement } from '../hooks/useNetworkManagement';
import { useImageManagement } from '../hooks/useImageManagement';
import { useVolumeManagement } from '../hooks/useVolumeManagement';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { Container, Volume } from '../types';

/**
 * TerminalContainer - Terminal의 모든 비즈니스 로직을 관리하는 Container 컴포넌트
 * 
 * 개선 사항:
 * - 통합 에러 처리 적용
 * - 타입 안전성 강화
 * 
 * 책임:
 * - Docker 명령어 실행 로직
 * - 각종 이벤트 핸들링 
 * - 비즈니스 로직과 UI 로직 분리
 */
const TerminalContainer: React.FC = () => {
  // 에러 처리
  const { handleError } = useErrorHandler();

  // 출력 상태
  const [output, setOutput] = useState<string[]>([]);
  
  // 선택 상태
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  
  // 모달 상태
  const [showImageDetails, setShowImageDetails] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isContainerListModalOpen, setIsContainerListModalOpen] = useState(false);
  const [isCommandDictModalOpen, setIsCommandDictModalOpen] = useState(false);
  
  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);

  // 훅들 사용
  const processVisualization = useProcessVisualization();
  const networkManagement = useNetworkManagement();
  const imageManagement = useImageManagement();
  const volumeManagement = useVolumeManagement();
  
  const containerManagement = useContainerManagement({
    networks: networkManagement.networks,
    volumes: volumeManagement.volumes,
    processes: processVisualization.processes,
    setNetworks: networkManagement.setNetworks,
    setOutput,
    setProcesses: processVisualization.setProcesses,
    setAnimating: processVisualization.setAnimating,
    addProcessStep: processVisualization.addProcessStep,
    handleAllProcessesComplete: processVisualization.handleAllProcessesComplete
  });

  const dockerCommands = useDockerCommands({
    networks: networkManagement.networks,
    volumes: volumeManagement.volumes,
    containers: containerManagement.containers,
    activeNetwork: networkManagement.activeNetwork,
    processes: processVisualization.processes,
    setNetworks: networkManagement.setNetworks,
    setVolumes: volumeManagement.setVolumes,
    setContainers: containerManagement.setContainers,
    setActiveNetwork: networkManagement.setActiveNetwork,
    setOutput,
    setNewVolumeId: volumeManagement.setNewVolumeId,
    setNewContainerId: containerManagement.setNewContainerId,
    addProcessStep: processVisualization.addProcessStep,
    createContainerWithAnimation: containerManagement.createContainerWithAnimation,
    addImageFromPull: imageManagement.addImageFromPull,
    createVolume: volumeManagement.createVolume
  });

  // 이벤트 핸들러들 (에러 처리 통합)
  const handleContainerClick = (container: Container) => {
    try {
      if (container.id) {
        setSelectedContainer(container);
      } else {
        setSelectedContainer(null);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleVolumeClick = (volume: Volume) => {
    try {
      volumeManagement.handleVolumeClick(volume);
    } catch (error) {
      handleError(error);
    }
  };

  // 모달 핸들러들
  const handleCloseImageDetails = () => setShowImageDetails(false);
  const handleCloseLevelModal = () => setIsLevelModalOpen(false);
  const handleCloseContainerListModal = () => setIsContainerListModalOpen(false);
  const handleCloseCommandDictModal = () => setIsCommandDictModalOpen(false);
  const handleCloseImageBrowser = () => imageManagement.setIsImageBrowserOpen(false);
  const handleCloseImageModal = () => imageManagement.setIsImageModalOpen(false);

  // 모달 열기 핸들러들
  const handleOpenLevelModal = () => setIsLevelModalOpen(true);
  const handleOpenContainerListModal = () => setIsContainerListModalOpen(true);
  const handleOpenCommandDictModal = () => setIsCommandDictModalOpen(true);

  return (
    <TerminalPresentation
      // 터미널 상태
      command={dockerCommands.command}
      output={output}
      isProcessing={dockerCommands.isProcessing}
      
      // 데이터
      networks={networkManagement.networks}
      containers={containerManagement.containers}
      volumes={volumeManagement.volumes}
      images={imageManagement.images}
      processes={processVisualization.processes}
      
      // 선택 상태
      activeNetwork={networkManagement.activeNetwork}
      selectedContainer={selectedContainer}
      selectedVolume={volumeManagement.selectedVolume}
      
      // 모달 상태
      showImageDetails={showImageDetails}
      isLevelModalOpen={isLevelModalOpen}
      isContainerListModalOpen={isContainerListModalOpen}
      isCommandDictModalOpen={isCommandDictModalOpen}
      isImageBrowserOpen={imageManagement.isImageBrowserOpen}
      isImageModalOpen={imageManagement.isImageModalOpen}
      
      // 애니메이션 상태
      animating={processVisualization.animating}
      newContainerId={processVisualization.newContainerId}
      newVolumeId={processVisualization.newVolumeId}
      connectingVolume={processVisualization.connectingVolume}
      
      // 다운로드 상태
      imageDownloading={imageManagement.imageDownloading}
      isDownloading={imageManagement.isDownloading}
      downloadProgress={imageManagement.downloadProgress}
      isDownloadComplete={imageManagement.isDownloadComplete}
      
      // 기타 상태
      selectedImageTab={imageManagement.selectedImageTab}
      
      // 이벤트 핸들러 (에러 처리 통합됨)
      onCommandChange={dockerCommands.handleCommandChange}
      onCommandSubmit={dockerCommands.handleCommandSubmit}
      onContainerClick={handleContainerClick}
      onVolumeClick={handleVolumeClick}
      onTabClick={networkManagement.handleTabClick}
      onTabClose={networkManagement.handleTabClose}
      onFileUpload={imageManagement.handleFileUpload}
      onStartContainer={containerManagement.handleStartContainer}
      onStopContainer={containerManagement.handleStopContainer}
      onRemoveContainer={containerManagement.handleRemoveContainer}
      onImageRepositoryClick={imageManagement.handleImageRepositoryClick}
      onLocalImageClick={imageManagement.handleLocalImageClick}
      
      // 모달 핸들러
      onCloseImageDetails={handleCloseImageDetails}
      onOpenLevelModal={handleOpenLevelModal}
      onCloseLevelModal={handleCloseLevelModal}
      onOpenContainerListModal={handleOpenContainerListModal}
      onCloseContainerListModal={handleCloseContainerListModal}
      onOpenCommandDictModal={handleOpenCommandDictModal}
      onCloseCommandDictModal={handleCloseCommandDictModal}
      onCloseImageBrowser={handleCloseImageBrowser}
      onCloseImageModal={handleCloseImageModal}
      
      // Refs
      fileInputRef={imageManagement.fileInputRef}
      terminalRef={terminalRef}
    />
  );
};

export default TerminalContainer; 