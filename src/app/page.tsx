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
import { ProcessStep } from '../components/ProcessVisualization'; // ProcessStep 임포트

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simulationIdFromUrl = searchParams.get('simulationId');

  const {
    volumes, networks, executeCommand,
    disconnectVolumeFromContainer, disconnectNetworkFromContainer,
    simulationId, loadSimulation, resetSimulation,
    terminalHistory, createContainerInNetworks
  } = useDockerStore();
  const { isLoggedIn } = useAuthStore();

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
  const [processes, setProcesses] = useState<ProcessStep[]>([]);

  useEffect(() => {
    console.log('[HomePage] useEffect for simulation loading triggered.');
    if (simulationIdFromUrl) {
      console.log(`[HomePage] Found simulationId in URL: ${simulationIdFromUrl}. Current store simulationId: ${simulationId}`);
      if (simulationIdFromUrl !== simulationId) {
        console.log('[HomePage] URL ID and store ID mismatch. Calling loadSimulation.');
        loadSimulation(simulationIdFromUrl);
      }
    } else if (!simulationId) {
      console.log('[HomePage] No simulationId in URL or store. Calling resetSimulation.');
      resetSimulation();
    }
  }, [simulationIdFromUrl, simulationId, loadSimulation, resetSimulation]);

  useEffect(() => {
    console.log('[HomePage] Terminal history changed, updating processes.');
    const newProcesses: ProcessStep[] = terminalHistory.map((entry: TerminalHistory) => {
      const commandParts = entry.command.split(' ');
      const dockerAction = commandParts[1];
      const containerId = commandParts[2] || '';

      let type: ProcessStep['type'] = 'info';
      if (entry.isError) {
        type = 'error';
      } else if (dockerAction === 'create' || dockerAction === 'run') {
        type = 'create';
      } else if (dockerAction === 'start') {
        type = 'start';
      } else if (dockerAction === 'stop') {
        type = 'stop';
      } else if (dockerAction === 'rm') {
        type = 'remove';
      }

      return {
        id: entry.id,
        type,
        message: entry.output,
        containerId,
      };
    });
    setProcesses(newProcesses);
  }, [terminalHistory]);

  const handleAction = (action: 'start' | 'stop' | 'pause' | 'unpause' | 'rm', id: string) => {
    console.log(`[HomePage] handleAction called: action=${action}, id=${id}`);
    executeCommand(`docker ${action} ${id}`);
  };

  const handleResourceCreationConfirm = (data: ResourceCreationData) => {
    console.log('[HomePage] handleResourceCreationConfirm called with data:', data);
    switch (resourceCreationType) {
      case 'container': {
        // createContainerInNetworks를 사용하여 docker create + start 방식으로 처리
        createContainerInNetworks(data);
        break;
      }
      case 'volume': {
        // 볼륨 이름이 없으면 자동 생성
        const volumeName = (data.name && data.name.trim()) ? data.name.trim() : `volume_${Date.now()}`;
        const command = `docker volume create ${volumeName}`;
        executeCommand(command);
        break;
      }
      case 'network': {
        // 네트워크 이름이 없으면 자동 생성
        const networkName = (data.name && data.name.trim()) ? data.name.trim() : `network_${Date.now()}`;
        const command = `docker network create ${networkName}`;
        executeCommand(command);
        break;
      }
    }
    setIsResourceCreationModalOpen(false);
  };

  // ... (다른 핸들러 및 UI 코드는 변경 없음) ...
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
  const currentSelectedVolume = selectedVolumeId ? (volumes.find(v => v.id === selectedVolumeId) || null) : null;

  const handleComposeFileClick = () => {
    if (!simulationId) {
      alert('시뮬레이션을 먼저 저장해야 docker-compose.yml 파일을 생성할 수 있습니다.');
      return;
    }
    setComposeModalOpen(true);
  };
  
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
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
      <div className="home-layout">
        <Sidebar
            onControlPanelToggle={() => setIsControlPanelCollapsed(!isControlPanelCollapsed)}
            onTerminalToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
            onComposeFileClick={handleComposeFileClick}
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
          <ResizablePanel isCollapsed={isControlPanelCollapsed} onCollapseToggle={() => setIsControlPanelCollapsed(!isControlPanelCollapsed)} defaultHeight={350} minHeight={200} maxHeight={600} className="control-panel-container">
            <ControlPanel isCollapsed={isControlPanelCollapsed} showToast={showToast} onContainerClick={handleContainerClick} onVolumeClick={handleVolumeClick} onNetworkClick={handleNetworkClick} onNetworkRemove={(name) => handleAction('rm', name)} />
          </ResizablePanel>
          <ResizablePanel isCollapsed={isTerminalCollapsed} onCollapseToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)} defaultHeight={300} minHeight={150} maxHeight={500} className="terminal-container">
            <Terminal isCollapsed={isTerminalCollapsed} onCollapseToggle={() => setIsTerminalCollapsed(!isTerminalCollapsed)} />
          </ResizablePanel>
        </div>

        <div className={`resizer ${bothCollapsed ? 'collapsed' : ''}`} onMouseDown={handleMouseDown} />

        <div className={`visualizer`}>
          <Visualizer processes={processes} onContainerClick={handleContainerClick} onVolumeClick={handleVolumeClick} onNetworkClick={handleNetworkClick} onOpenNetworkSelectionModal={(c) => { setSelectedContainer(c); setIsNetworkSelectionModalOpen(true); }} onOpenNetworkCreationModal={() => { setResourceCreationType('network'); setIsResourceCreationModalOpen(true); }} activeNetwork={activeNetwork} setActiveNetwork={setActiveNetwork} />
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <ComposeFileModal open={composeModalOpen} onClose={() => setComposeModalOpen(false)} simulationPublicId={simulationId} />
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
        {selectedContainer && <NetworkSelectionModal isOpen={isNetworkSelectionModalOpen} onClose={() => { setIsNetworkSelectionModalOpen(false); setSelectedContainer(null); }} onSelect={(_nets) => { /* connect logic */ }} allNetworks={networks} connectedNetworks={Array.isArray(selectedContainer.network) ? selectedContainer.network : [selectedContainer.network]} />}
      </div>
  )
}