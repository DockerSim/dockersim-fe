'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ControlPanel from '../components/ControlPanel';
import Terminal from '../components/Terminal';
import Visualizer from '../components/Visualizer';
import Sidebar from '../components/Sidebar';
import ResizablePanel from '../components/ResizablePanel';
import ComposeFileModal from '../components/modals/ComposeFileModal';
import ImageModal from '../components/modals/ImageModal';
import DockerfileFeedbackModal from '../components/modals/DockerfileFeedbackModal';
import NetworkSelectionModal from '../components/modals/NetworkSelectionModal';
import ContainerDetailModal from '../components/modals/ContainerDetailModal';
import VolumeDetailModal from '../components/modals/VolumeDetailModal';
import NetworkDetailModal from '../components/modals/NetworkDetailModal';
import MissionModal from '../components/modals/MissionModal';
import ResourceCreationModal, { ResourceCreationData } from '../components/modals/ResourceCreationModal';
import SaveSimulationModal from '../components/modals/SaveSimulationModal';
import ShareModal from '../components/modals/ShareModal';
import { useDockerStore, Container, Volume, Network, TerminalHistory } from '../store/dockerStore';
import { useAuthStore } from '../store/authStore';
import '../styles/HomePage.css';
import { ToastContainer, ToastProps } from '../components/common/Toast';
import { useNetworkSync } from '../hooks/useNetworkSync';
import { ProcessStep } from '../components/ProcessVisualization'; // ProcessStep 임포트

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulationIdFromUrl = searchParams.get('simulationId');

  const { 
    containers, volumes, networks, generateComposeFile, executeCommand, 
    disconnectVolumeFromContainer, disconnectNetworkFromContainer,
    simulationId, simulationTitle, loadSimulation, resetSimulation,
    terminalHistory // terminalHistory 추가
  } = useDockerStore();
  const { isLoggedIn, user } = useAuthStore();

  const [isControlPanelCollapsed, setIsControlPanelCollapsed] = useState(false);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);
  const [sidebarWidth, setSidebarWidth] = useState(550);
  const isResizing = useRef(false);
  
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [dockerfileFeedbackModalOpen, setDockerfileFeedbackModalOpen] = useState(false);
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [isContainerDetailModalOpen, setIsContainerDetailModalOpen] = useState(false);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);
  const [isVolumeDetailModalOpen, setVolumeDetailModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [isNetworkDetailModalOpen, setNetworkDetailModalOpen] = useState(false);
  
  const [isNetworkSelectionModalOpen, setIsNetworkSelectionModalOpen] = useState(false);
  const [isResourceCreationModalOpen, setIsResourceCreationModalOpen] = useState(false);
  const [resourceCreationType, setResourceCreationType] = useState<'container' | 'volume' | 'network'>('network');

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [activeNetwork, setActiveNetwork] = useState<string>('bridge');

  // processes 상태 추가
  const [processes, setProcesses] = useState<ProcessStep[]>([]);

  useNetworkSync();

  useEffect(() => {
    if (simulationIdFromUrl) {
      if (simulationIdFromUrl !== simulationId) {
        loadSimulation(simulationIdFromUrl);
      }
    } else if (!simulationId) {
      resetSimulation();
    }
  }, [simulationIdFromUrl, simulationId, loadSimulation, resetSimulation]);

  // terminalHistory를 processes로 변환하는 로직
  useEffect(() => {
    const newProcesses: ProcessStep[] = terminalHistory.map((entry: TerminalHistory) => ({
      id: entry.id,
      name: entry.command.split(' ')[0] || 'command', // 명령어의 첫 단어를 이름으로 사용
      status: entry.isError ? 'error' : 'success', // 에러 여부에 따라 상태 결정
      message: entry.output,
      timestamp: entry.timestamp,
    }));
    setProcesses(newProcesses);
  }, [terminalHistory]); // terminalHistory가 변경될 때마다 processes 업데이트

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleSave = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    setIsSaveModalOpen(true);
  };

  const handleShare = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }
    if (!simulationId) {
      alert('시뮬레이션을 먼저 저장해야 공유할 수 있습니다.');
      return;
    }
    setIsShareModalOpen(true);
  };

  const handleContainerClick = (container: Container) => {
    setSelectedContainer(container);
    setIsContainerDetailModalOpen(true);
  };

  const handleVolumeClick = (volume: Volume) => {
    setSelectedVolumeId(volume.id);
    setVolumeDetailModalOpen(true);
  };

  const handleNetworkClick = (network: Network) => {
    setSelectedNetwork(network);
    setNetworkDetailModalOpen(true);
  };

  const handleAction = (action: 'start' | 'stop' | 'pause' | 'unpause' | 'rm', id: string) => {
    if (!simulationId || !user?.id) {
        showToast('시뮬레이션을 저장하고 로그인해야 합니다.', 'error');
        return;
    }
    executeCommand(`docker ${action} ${id}`, simulationId, user.id);
  };

  const handleResourceCreationConfirm = (data: ResourceCreationData) => {
    if (!simulationId || !user?.id) {
        showToast('시뮬레이션을 저장하고 로그인해야 합니다.', 'error');
        return;
    }
    if (resourceCreationType === 'network') {
      let command = `docker network create`;
      if (data.name) command += ` ${data.name}`;
      executeCommand(command, simulationId, user.id);
    }
    setIsResourceCreationModalOpen(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
  };

  const handleMouseUp = () => { isResizing.current = false; };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = Math.min(Math.max(e.clientX, 250), window.innerWidth - 300);
      setSidebarWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  const bothCollapsed = isControlPanelCollapsed && isTerminalCollapsed;
  const currentSelectedVolume = selectedVolumeId ? volumes.find(v => v.id === selectedVolumeId) : null;

  const handleComposeFileClick = () => {
    if (!simulationId) {
      alert('시뮬레이션을 먼저 저장해야 docker-compose.yml 파일을 생성할 수 있습니다.');
      return;
    }
    setComposeModalOpen(true);
  };

  return (
    <div className="home-layout">
      <Sidebar 
        onControlPanelToggle={() => setIsControlPanelCollapsed(!isControlPanelCollapsed)}
        onTerminalToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
        onComposeFileClick={handleComposeFileClick} // 수정된 핸들러 사용
        onImageClick={() => setImageModalOpen(true)}
        onDockerfileFeedbackClick={() => setDockerfileFeedbackModalOpen(true)}
        onMissionClick={() => setMissionModalOpen(true)}
        onSave={handleSave}
        onShare={handleShare}
      />
      
      <div 
        className={`sidebar-content ${bothCollapsed ? 'collapsed' : ''}`}
        style={{ width: bothCollapsed ? '0' : `${sidebarWidth}px` }}
      >
        <ResizablePanel isCollapsed={isControlPanelCollapsed} onCollapseToggle={() => setIsControlPanelCollapsed(!isControlPanelCollapsed)} defaultHeight={350} minHeight={200} maxHeight={600} className="control-panel-container" title="리소스 제어">
          <ControlPanel isCollapsed={isControlPanelCollapsed} showToast={showToast} onContainerClick={handleContainerClick} onVolumeClick={handleVolumeClick} onNetworkClick={handleNetworkClick} onNetworkRemove={(name) => handleAction('rm', name)} />
        </ResizablePanel>
        <ResizablePanel isCollapsed={isTerminalCollapsed} onCollapseToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)} defaultHeight={300} minHeight={150} maxHeight={500} className="terminal-container" title="터미널">
          <Terminal />
        </ResizablePanel>
      </div>

      <div className={`resizer ${bothCollapsed ? 'collapsed' : ''}`} onMouseDown={handleMouseDown} />
      
      <div className={`visualizer`}>
        <Visualizer processes={processes} onContainerClick={handleContainerClick} onVolumeClick={handleVolumeClick} onNetworkClick={handleNetworkClick} onOpenNetworkSelectionModal={(c) => { setSelectedContainer(c); setIsNetworkSelectionModalOpen(true); }} onOpenNetworkCreationModal={() => { setResourceCreationType('network'); setIsResourceCreationModalOpen(true); }} activeNetwork={activeNetwork} setActiveNetwork={setActiveNetwork} />
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ComposeFileModal open={composeModalOpen} onClose={() => setComposeModalOpen(false)} simulationPublicId={simulationId} /> {/* simulationId 전달 */}
      <ImageModal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} />
      <DockerfileFeedbackModal open={dockerfileFeedbackModalOpen} onClose={() => setDockerfileFeedbackModalOpen(false)} />
      <MissionModal open={missionModalOpen} onClose={() => setMissionModalOpen(false)} />

      <SaveSimulationModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSaveSuccess={(newSimId) => {
          if (newSimId !== simulationId) {
            router.push(`/?simulationId=${newSimId}`, { scroll: false });
          }
          if (window.confirm("저장되었습니다. 내 작업 목록으로 이동하시겠습니까?")) {
            router.push('/settings');
          }
        }}
      />
      {simulationId && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          simulationId={simulationId}
        />
      )}
      <ContainerDetailModal container={selectedContainer} open={isContainerDetailModalOpen} onClose={() => setIsContainerDetailModalOpen(false)} onAction={handleAction} onOpenNetworkSelectionModal={() => { setIsContainerDetailModalOpen(false); setIsNetworkSelectionModalOpen(true); }} onDisconnectNetwork={disconnectNetworkFromContainer} />
      <VolumeDetailModal volume={currentSelectedVolume} open={isVolumeDetailModalOpen} onClose={() => setVolumeDetailModalOpen(false)} onRemove={(id) => handleAction('rm', id)} onDisconnect={disconnectVolumeFromContainer} />
      <NetworkDetailModal network={selectedNetwork} open={isNetworkDetailModalOpen} onClose={() => setNetworkDetailModalOpen(false)} />
      <ResourceCreationModal type={resourceCreationType} networks={networks || []} open={isResourceCreationModalOpen} onConfirm={handleResourceCreationConfirm} onClose={() => setIsResourceCreationModalOpen(false)} />
      {selectedContainer && <NetworkSelectionModal isOpen={isNetworkSelectionModalOpen} onClose={() => { setIsNetworkSelectionModalOpen(false); setSelectedContainer(null); }} onSelect={(nets) => { /* connect logic */ }} allNetworks={networks} connectedNetworks={Array.isArray(selectedContainer.network) ? selectedContainer.network : [selectedContainer.network]} />}
    </div>
  )
}