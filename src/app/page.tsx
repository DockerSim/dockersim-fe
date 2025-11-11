'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import ControlPanel from '../components/ControlPanel'
import Terminal from '../components/Terminal'
import Visualizer from '../components/Visualizer'
import Sidebar from '../components/Sidebar'
import ResizablePanel from '../components/ResizablePanel'
import ComposeFileModal from '../components/modals/ComposeFileModal'
import ImageModal from '../components/modals/ImageModal'
import DockerfileFeedbackModal from '../components/modals/DockerfileFeedbackModal'
import NetworkSelectionModal from '../components/modals/NetworkSelectionModal'
import ContainerDetailModal from '../components/modals/ContainerDetailModal'
import VolumeDetailModal from '../components/modals/VolumeDetailModal'
import NetworkDetailModal from '../components/modals/NetworkDetailModal'
import MissionModal from '../components/modals/MissionModal' // Import MissionModal
import ResourceCreationModal, { ResourceCreationData } from '../components/modals/ResourceCreationModal'
import { useDockerStore, Container, Volume, Network } from '../store/dockerStore'
import '../styles/HomePage.css'
import { ToastContainer, ToastProps } from '../components/common/Toast';
import { ProcessStep } from '../components/ProcessVisualization';
import { useNetworkSync } from '../hooks/useNetworkSync';

export default function HomePage() {
  const [isControlPanelCollapsed, setIsControlPanelCollapsed] = useState(false)
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false)
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])
  const [processes, setProcesses] = useState<ProcessStep[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(550);
  const isResizing = useRef(false);
  
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [dockerfileFeedbackModalOpen, setDockerfileFeedbackModalOpen] = useState(false);
  const [missionModalOpen, setMissionModalOpen] = useState(false); // State for MissionModal
  
  const { containers, volumes, networks, generateComposeFile, executeCommand, disconnectVolumeFromContainer, disconnectNetworkFromContainer } = useDockerStore();

  // --- Modal State Centralization ---
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [isContainerDetailModalOpen, setIsContainerDetailModalOpen] = useState(false);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(null);
  const [isVolumeDetailModalOpen, setVolumeDetailModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [isNetworkDetailModalOpen, setNetworkDetailModalOpen] = useState(false);
  
  const [isNetworkSelectionModalOpen, setIsNetworkSelectionModalOpen] = useState(false);
  const [isResourceCreationModalOpen, setIsResourceCreationModalOpen] = useState(false);
  const [resourceCreationType, setResourceCreationType] = useState<'container' | 'volume' | 'network'>('network');

  const [activeNetwork, setActiveNetwork] = useState<string>('bridge');

  useNetworkSync();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // 임시 simulationId와 userId. 실제 값은 사용자 세션 또는 전역 상태에서 가져와야 합니다.
  const SIMULATION_ID = "test-simulation-id"; // TODO: 실제 simulationId로 교체 필요
  const USER_ID = 1; // TODO: 실제 userId로 교체 필요

  // --- Modal Handler Functions ---
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

  const handleVolumeDisconnect = (volumeName: string, containerName: string) => {
    const container = containers.find(c => c.name === containerName);
    disconnectVolumeFromContainer(volumeName, containerName);
    setIsVolumeDetailModalOpen(false);
    if (container?.network[0]) {
      setActiveNetwork(container.network[0]);
    }
    setSelectedVolumeId(null); 
  };

  const handleNetworkDisconnect = (networkName: string, containerName: string) => {
    disconnectNetworkFromContainer(networkName, containerName);
  };

  const handleNetworkRemove = (networkName: string) => {
    const containersInNetwork = containers.filter(c => c.network.includes(networkName));
    if (containersInNetwork.length > 0) {
      alert(`'${networkName}' 네트워크는 현재 사용 중인 컨테이너가 있어 삭제할 수 없습니다.`);
      return;
    }
    executeCommand(`docker network rm ${networkName}`, SIMULATION_ID, USER_ID);
  };

  const handleOpenNetworkSelectionModal = (containerToConnect: Container) => {
    setSelectedContainer(containerToConnect);
    setIsContainerDetailModalOpen(false);
    setIsNetworkSelectionModalOpen(true);
  };

  const handleOpenNetworkCreationModal = () => {
    setResourceCreationType('network');
    setIsResourceCreationModalOpen(true);
  };

  const handleResourceCreationConfirm = (data: ResourceCreationData) => {
    if (resourceCreationType === 'network') {
      let command = `docker network create`;
      if (data.name) command += ` ${data.name}`;
      executeCommand(command, SIMULATION_ID, USER_ID);
    }
    setIsResourceCreationModalOpen(false);
  };

  const handleNetworkConnect = (networkIds: string[]) => {
    if (selectedContainer && networkIds.length > 0) {
      networkIds.forEach(networkId => {
        const network = networks.find(n => n.id === networkId);
        if (network) {
          executeCommand(`docker network connect ${network.name} ${selectedContainer.name}`, SIMULATION_ID, USER_ID);
        }
      });
      setActiveNetwork(networkIds[0]);
    }
    setIsNetworkSelectionModalOpen(false);
    setSelectedContainer(null); 
  };

  const handleAction = (action: 'start' | 'stop' | 'pause' | 'unpause' | 'rm', id: string) => {
    executeCommand(`docker ${action} ${id}`, SIMULATION_ID, USER_ID);
  };

  const toggleControlPanel = () => setIsControlPanelCollapsed(!isControlPanelCollapsed)
  const toggleTerminal = () => setIsTerminalCollapsed(!isTerminalCollapsed)

  const handleComposeFileClick = () => setComposeModalOpen(true);
  const handleImageClick = () => setImageModalOpen(true);
  const handleDockerfileFeedbackClick = () => setDockerfileFeedbackModalOpen(true);
  const handleMissionClick = () => setMissionModalOpen(true); // Handler for MissionModal

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

  return (
    <div className="home-layout">
      <Sidebar 
        onControlPanelToggle={toggleControlPanel}
        onTerminalToggle={toggleTerminal}
        onComposeFileClick={handleComposeFileClick}
        onImageClick={handleImageClick}
        onDockerfileFeedbackClick={handleDockerfileFeedbackClick}
        onMissionClick={handleMissionClick} // Pass handler to Sidebar
      />
      
      <div 
        className={`sidebar-content ${bothCollapsed ? 'collapsed' : ''}`}
        style={{ width: bothCollapsed ? '0' : `${sidebarWidth}px` }}
      >
        <ResizablePanel isCollapsed={isControlPanelCollapsed} onCollapseToggle={toggleControlPanel} defaultHeight={350} minHeight={200} maxHeight={600} className="control-panel-container" title="리소스 제어">
          <ControlPanel isCollapsed={isControlPanelCollapsed} showToast={showToast} onContainerClick={handleContainerClick} onVolumeClick={handleVolumeClick} onNetworkClick={handleNetworkClick} onNetworkRemove={handleNetworkRemove} />
        </ResizablePanel>
        <ResizablePanel isCollapsed={isTerminalCollapsed} onCollapseToggle={toggleTerminal} defaultHeight={300} minHeight={150} maxHeight={500} className="terminal-container" title="터미널">
          <Terminal />
        </ResizablePanel>
      </div>

      <div className={`resizer ${bothCollapsed ? 'collapsed' : ''}`} onMouseDown={handleMouseDown} />
      
      <div className={`visualizer`}>
        <Visualizer processes={[]} onContainerClick={handleContainerClick} onVolumeClick={handleVolumeClick} onNetworkClick={handleNetworkClick} onOpenNetworkSelectionModal={handleOpenNetworkSelectionModal} onOpenNetworkCreationModal={handleOpenNetworkCreationModal} activeNetwork={activeNetwork} setActiveNetwork={setActiveNetwork} />
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ComposeFileModal open={composeModalOpen} onClose={() => setComposeModalOpen(false)} composeFileContent={generateComposeFile()} />
      <ImageModal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} />
      <DockerfileFeedbackModal open={dockerfileFeedbackModalOpen} onClose={() => setDockerfileFeedbackModalOpen(false)} />
      <MissionModal open={missionModalOpen} onClose={() => setMissionModalOpen(false)} />

      {/* Centrally Managed Modals */}
      <ContainerDetailModal container={selectedContainer} open={isContainerDetailModalOpen} onClose={() => setIsContainerDetailModalOpen(false)} onAction={handleAction} onOpenNetworkSelectionModal={() => selectedContainer && handleOpenNetworkSelectionModal(selectedContainer)} onDisconnectNetwork={handleNetworkDisconnect} />
      <VolumeDetailModal volume={currentSelectedVolume} open={isVolumeDetailModalOpen} onClose={() => setVolumeDetailModalOpen(false)} onRemove={(id) => executeCommand(`docker volume rm ${id}`, SIMULATION_ID, USER_ID)} onDisconnect={handleVolumeDisconnect} />
      <NetworkDetailModal network={selectedNetwork} open={isNetworkDetailModalOpen} onClose={() => setNetworkDetailModalOpen(false)} />
      <ResourceCreationModal type={resourceCreationType} networks={networks || []} open={isResourceCreationModalOpen} onConfirm={handleResourceCreationConfirm} onClose={() => setIsResourceCreationModalOpen(false)} />
      {selectedContainer && <NetworkSelectionModal isOpen={isNetworkSelectionModalOpen} onClose={() => { setIsNetworkSelectionModalOpen(false); setSelectedContainer(null); }} onSelect={handleNetworkConnect} allNetworks={networks} connectedNetworks={Array.isArray(selectedContainer.network) ? selectedContainer.network : [selectedContainer.network]} />}
    </div>
  )
}