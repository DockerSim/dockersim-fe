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
  const [composeFileContent, setComposeFileContent] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [dockerfileFeedbackModalOpen, setDockerfileFeedbackModalOpen] = useState(false);
  
  const { containers, networks, generateComposeFile, executeCommand, disconnectVolumeFromContainer } = useDockerStore();

  // --- Modal State Centralization ---
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [isContainerDetailModalOpen, setIsContainerDetailModalOpen] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);
  const [isVolumeDetailModalOpen, setVolumeDetailModalOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [isNetworkDetailModalOpen, setNetworkDetailModalOpen] = useState(false);
  
  const [isNetworkSelectionModalOpen, setIsNetworkSelectionModalOpen] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState<string>('bridge');

  useNetworkSync();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // --- Modal Handler Functions ---
  const handleContainerClick = (container: Container) => {
    setSelectedContainer(container);
    setIsContainerDetailModalOpen(true);
  };

  const handleVolumeClick = (volume: Volume) => {
    setSelectedVolume(volume);
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
    setIsContainerDetailModalOpen(false);
    if (container?.network[0]) {
      setActiveNetwork(container.network[0]);
    }
  };

  const handleNetworkRemove = (networkName: string) => {
    const network = networks.find(n => n.name === networkName);
    if (!network) return;

    const isHot = network.containers.some(c => c.status === 'running' || c.status === 'paused');
    if (isHot) {
      if (window.confirm(`'${networkName}' 네트워크는 현재 사용 중인 컨테이너가 있습니다. 정말로 삭제하시겠습니까?`)) {
        executeCommand(`docker network rm ${networkName}`);
      }
    } else {
      executeCommand(`docker network rm ${networkName}`);
    }
  };

  const handleOpenNetworkSelectionModal = () => {
    setIsContainerDetailModalOpen(false);
    setIsNetworkSelectionModalOpen(true);
  };

  const handleNetworkConnect = (networkIds: string[]) => {
    if (selectedContainer && networkIds.length > 0) {
      networkIds.forEach(networkId => {
        const network = networks.find(n => n.id === networkId);
        if (network) {
          executeCommand(`docker network connect ${network.name} ${selectedContainer.name}`);
        }
      });
      setActiveNetwork(networkIds[0]);
    }
    setIsNetworkSelectionModalOpen(false);
    setSelectedContainer(null); 
  };

  const handleAction = (action: 'start' | 'stop' | 'pause' | 'unpause' | 'rm', id: string) => {
    executeCommand(`docker ${action} ${id}`);
  };

  const toggleControlPanel = () => {
    setIsControlPanelCollapsed(!isControlPanelCollapsed)
  }

  const toggleTerminal = () => {
    setIsTerminalCollapsed(!isTerminalCollapsed)
  }

  const handleComposeFileClick = () => {
    const content = generateComposeFile();
    setComposeFileContent(content);
    setComposeModalOpen(true);
  };

  const handleImageClick = () => {
    setImageModalOpen(true);
  };

  const handleDockerfileFeedbackClick = () => {
    setDockerfileFeedbackModalOpen(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

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

  return (
    <div className="home-layout">
      <Sidebar 
        onControlPanelToggle={toggleControlPanel}
        onTerminalToggle={toggleTerminal}
        onComposeFileClick={handleComposeFileClick}
        onImageClick={handleImageClick}
        onDockerfileFeedbackClick={handleDockerfileFeedbackClick}
      />
      
      <div 
        className={`sidebar-content ${bothCollapsed ? 'collapsed' : ''}`}
        style={{ width: bothCollapsed ? '0' : `${sidebarWidth}px` }}
      >
        <ResizablePanel 
          isCollapsed={isControlPanelCollapsed}
          onCollapseToggle={toggleControlPanel}
          defaultHeight={350}
          minHeight={200}
          maxHeight={600}
          className="control-panel-container"
          title="리소스 제어"
        >
          <ControlPanel 
            isCollapsed={isControlPanelCollapsed}
            showToast={showToast}
            onContainerClick={handleContainerClick}
            onVolumeClick={handleVolumeClick}
            onNetworkClick={handleNetworkClick}
            onNetworkRemove={handleNetworkRemove}
          />
        </ResizablePanel>
        
        <ResizablePanel 
          isCollapsed={isTerminalCollapsed}
          onCollapseToggle={toggleTerminal}
          defaultHeight={300}
          minHeight={150}
          maxHeight={500}
          className="terminal-container"
          title="터미널"
        >
          <Terminal />
        </ResizablePanel>
      </div>

      <div className={`resizer ${bothCollapsed ? 'collapsed' : ''}`} onMouseDown={handleMouseDown} />
      
      <div className={`visualizer`}>
        <Visualizer 
          processes={[]} 
          onContainerClick={handleContainerClick}
          onVolumeClick={handleVolumeClick}
          onNetworkClick={handleNetworkClick}
          onOpenNetworkSelectionModal={handleOpenNetworkSelectionModal}
          activeNetwork={activeNetwork}
          setActiveNetwork={setActiveNetwork}
        />
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ComposeFileModal 
        open={composeModalOpen} 
        onClose={() => setComposeModalOpen(false)} 
        composeFileContent={composeFileContent} 
      />

      <ImageModal 
        isOpen={imageModalOpen} 
        onClose={() => setImageModalOpen(false)} 
      />

      <DockerfileFeedbackModal 
        open={dockerfileFeedbackModalOpen} 
        onClose={() => setDockerfileFeedbackModalOpen(false)} 
      />

      {/* Centrally Managed Modals */}
      <ContainerDetailModal 
        container={selectedContainer} 
        open={isContainerDetailModalOpen} 
        onClose={() => setIsContainerDetailModalOpen(false)} 
        onAction={handleAction}
        onOpenNetworkSelectionModal={handleOpenNetworkSelectionModal}
      />
      <VolumeDetailModal 
        volume={selectedVolume} 
        open={isVolumeDetailModalOpen} 
        onClose={() => setVolumeDetailModalOpen(false)} 
        onRemove={(id) => executeCommand(`docker volume rm ${id}`)} 
        onDisconnect={handleVolumeDisconnect}
      />
      <NetworkDetailModal 
        network={selectedNetwork} 
        open={isNetworkDetailModalOpen} 
        onClose={() => setNetworkDetailModalOpen(false)} 
      />

      {selectedContainer && (
        <NetworkSelectionModal
          isOpen={isNetworkSelectionModalOpen}
          onClose={() => {
            setIsNetworkSelectionModalOpen(false);
            setSelectedContainer(null);
          }}
          onSelect={handleNetworkConnect}
          allNetworks={networks}
          connectedNetworks={Array.isArray(selectedContainer.network) ? selectedContainer.network : [selectedContainer.network]}
        />
      )}
    </div>
  )
}