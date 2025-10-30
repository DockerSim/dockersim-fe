'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useDockerStore, Container, Volume, Network } from '../store/dockerStore'
import { ContainerCard } from './ContainerCard'
import { VolumeConnection } from './VolumeConnection' // 연결선 컴포넌트
import { useActiveNetworkSync } from '../hooks/useActiveNetworkSync'
import ContainerDetailModal from './modals/ContainerDetailModal'
import VolumeDetailModal from './modals/VolumeDetailModal'
import NetworkDetailModal from './modals/NetworkDetailModal'
import '../styles/Visualizer.css'
import './modals/NetworkDetailModal.css'
import { ProcessVisualization, ProcessStep } from './ProcessVisualization';

// Imports from OverviewPage
import NetworkGraph from './visualization/NetworkGraph';
import GraphLegend from './visualization/GraphLegend';
import ResourceDetailModal from './modals/ResourceDetailModal';
import '../styles/OverviewPage.css';

interface VisualizerProps {
  processes: ProcessStep[];
}

const Visualizer: React.FC<VisualizerProps> = ({ processes }) => {
  const { containers, volumes, networks, executeCommand } = useDockerStore()
  const [activeNetwork, setActiveNetwork] = useState<string>('bridge')
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null)
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [containerDetailModalOpen, setContainerDetailModalOpen] = useState(false)
  const [volumeDetailModalOpen, setVolumeDetailModalOpen] = useState(false)
  const [networkDetailModalOpen, setNetworkDetailModalOpen] = useState(false)
  const prevContainersRef = useRef(containers)
  
  const [showOverview, setShowOverview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Container | Volume | null>(null);

  useActiveNetworkSync(activeNetwork, setActiveNetwork)

  useEffect(() => {
    if (containers.length > prevContainersRef.current.length) {
      const newContainer = containers.find(c => !prevContainersRef.current.some(prev => prev.id === c.id));
      if (newContainer) {
        setHighlightedId(newContainer.id);
        setTimeout(() => setHighlightedId(null), 1500);
      }
    }
    prevContainersRef.current = containers;
  }, [containers]);

  const handleTabClick = (tabId: string) => {
    setActiveNetwork(tabId)
  }

  const handleTabNameClick = (network: Network) => {
    setSelectedNetwork(network);
    setNetworkDetailModalOpen(true);
  };

  const handleTabClose = (tabId: string, tabName: string) => {
    if (tabId === 'bridge') return;
    executeCommand(`docker network rm ${tabName}`);
    if (activeNetwork === tabId) {
      setActiveNetwork('bridge');
    }
  };

  const handleAddNetworkClick = () => {
    const networkName = window.prompt("생성할 네트워크의 이름을 입력하세요:");
    if (networkName && networkName.trim()) {
      executeCommand(`docker network create ${networkName.trim()}`);
    }
  };

  const handleContainerClick = (container: Container) => {
    setSelectedContainer(container);
    setContainerDetailModalOpen(true);
  }

  const handleVolumeClick = (volume: Volume) => {
    setSelectedVolume(volume);
    setVolumeDetailModalOpen(true);
  }

  const getContainerPosition = (containerId: string) => {
    const el = document.querySelector(`.container-card[data-container-id="${containerId}"]`);
    if (el) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      return { x: rect.left + window.scrollX + rect.width / 2 - 60, y: rect.top + window.scrollY };
    }
    return undefined;
  };

  const activeNetworkContainers = containers.filter(c => {
    const currentNetwork = networks.find(n => n.id === activeNetwork);
    if (!currentNetwork) return false;
    return c.network === currentNetwork.id || c.network === currentNetwork.name;
  });

  const unconnectedVolumes = volumes.filter(v => v.connectedContainers.length === 0);

  const getContainerLayoutClass = (containers: Container[]) => {
    if (containers.length === 0) return 'empty-layout';
    if (containers.length <= 2) return 'small-layout';
    return 'normal-layout';
  }

  return (
    <div className="visualizer-container">
      <div className="chrome-toolbar">
        {!showOverview && (
          <div className="network-tabs-container">
            <div className="network-tabs">
              {networks.map(tab => (
                <div
                  key={tab.id}
                  className={`chrome-tab ${activeNetwork === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <span className="tab-icon">⚡</span>
                  <span className="tab-title" onClick={(e) => { e.stopPropagation(); handleTabNameClick(tab as Network); }}>
                    {tab.name}
                  </span>
                  {tab.id !== 'bridge' && (
                    <button className="tab-close" onClick={(e) => { e.stopPropagation(); handleTabClose(tab.id, tab.name); }}>×</button>
                  )}
                </div>
              ))}
            </div>
            <button className="add-network-btn" onClick={handleAddNetworkClick}>+</button>
          </div>
        )}
        <div className="view-toggle">
          <button onClick={() => setShowOverview(false)} className={!showOverview ? 'active' : ''}>📦 시각화</button>
          <button onClick={() => setShowOverview(true)} className={showOverview ? 'active' : ''}>📊 그래프</button>
        </div>
      </div>

      {showOverview ? (
        <main id="capture-area" className="overview-main-content">
          <NetworkGraph onNodeClick={() => {}} />
          <GraphLegend />
        </main>
      ) : (
        <div className="network-content">
          <div className="network-container">
            <div className={`containers-section ${getContainerLayoutClass(activeNetworkContainers)}`}>
              {activeNetworkContainers.map((container) => (
                <div 
                  key={container.id} 
                  className={`container-wrapper ${highlightedId === container.id ? 'creating' : ''}`}
                  data-container-id={container.id}
                >
                  <ContainerCard
                    container={container}
                    onClick={() => handleContainerClick(container)}
                    isCreating={highlightedId === container.id}
                  />
                  
                  {container.volumes && container.volumes.length > 0 && (
                    <div className="volumes-container">
                      {container.volumes.map((volume, volumeIdx) => {
                        const volumeCount = container.volumes?.length || 0;
                        const offset = volumeCount > 1 ? (volumeIdx - (volumeCount - 1) / 2) * 100 : 0;
                        
                        return (
                          <div 
                            key={`${container.id}-${volume.id}-${volume.mountPath}`}
                            className="volume-connection-wrapper"
                            style={{ 
                              transform: `translateX(${offset}px)`,
                              position: 'absolute', 
                              left: '50%',
                              marginLeft: '-35px',
                              top: '0'
                            }}
                          >
                            <VolumeConnection 
                              container={container}
                              volume={volume}
                              isConnecting={false}
                            />
                            <div 
                              className={`volume-circle attached-volume ${highlightedId === volume.id ? 'highlight' : ''}`}
                              onClick={() => handleVolumeClick(volume)}
                              title={`Path: ${volume.mountPath}`}>
                              <div className="volume-connection-dot"></div>
                              <div className="volume-name">{volume.name}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
              
              {activeNetworkContainers.length === 0 && (
                <div className="empty-message">
                  컨테이너가 없습니다. docker run 명령어로 컨테이너를 생성해보세요.
                </div>
              )}
            </div>

            <div className="volumes-container-area">
              <h3 className="volume-section-title">연결되지 않은 볼륨</h3>
              <div className="volumes-section">
                {unconnectedVolumes.map((volume, index) => (
                  <div
                    key={`unconnected-${volume.id}`}
                    className={`volume-circle unconnected-volume ${highlightedId === volume.id ? 'highlight' : ''}`}
                    style={{ 
                      left: `${(index * 120) + 20}px`,
                      position: 'relative',
                      zIndex: 5
                    }}
                    onClick={() => handleVolumeClick(volume)}
                  >
                    <div className="volume-name">{volume.name}</div>
                  </div>
                ))}
                
                {unconnectedVolumes.length === 0 && (
                  <div className="empty-volume-message">연결되지 않은 볼륨이 없습니다</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProcessVisualization processes={processes} getContainerPosition={getContainerPosition} />
      
      <ContainerDetailModal container={selectedContainer} open={containerDetailModalOpen} onClose={() => setContainerDetailModalOpen(false)} onStart={(id) => executeCommand(`docker start ${id}`)} onStop={(id) => executeCommand(`docker stop ${id}`)} onPause={(id) => executeCommand(`docker pause ${id}`)} onRemove={(id) => executeCommand(`docker rm ${id}`)} />
      <VolumeDetailModal volume={selectedVolume} open={volumeDetailModalOpen} onClose={() => setVolumeDetailModalOpen(false)} onRemove={(id) => executeCommand(`docker volume rm ${id}`)} />
      <NetworkDetailModal network={selectedNetwork} open={networkDetailModalOpen} onClose={() => setNetworkDetailModalOpen(false)} />
      <ResourceDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} resource={selectedResource} onAction={(action, resourceId) => executeCommand(`docker ${action} ${resourceId}`)} />
    </div>
  )
}

export default Visualizer
