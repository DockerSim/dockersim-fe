'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useDockerStore, Container, Volume, Network } from '../store/dockerStore'
import { ContainerCard } from './ContainerCard'
import { VolumeConnection } from './VolumeConnection'
import '../styles/Visualizer.css'
import { ProcessVisualization, ProcessStep } from './ProcessVisualization';
import NetworkGraph from './visualization/NetworkGraph';
import GraphLegend from './visualization/GraphLegend';
import '../styles/OverviewPage.css';

interface VisualizerProps {
  processes: ProcessStep[];
  onContainerClick: (container: Container) => void;
  onVolumeClick: (volume: Volume) => void;
  onNetworkClick: (network: Network) => void;
  onOpenNetworkSelectionModal: () => void;
  onOpenNetworkCreationModal: () => void; // New prop
  activeNetwork: string;
  setActiveNetwork: (networkId: string) => void;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  processes, 
  onContainerClick,
  onVolumeClick,
  onNetworkClick,
  onOpenNetworkSelectionModal,
  onOpenNetworkCreationModal, // Destructure new prop
  activeNetwork,
  setActiveNetwork
}) => {
  const { containers, volumes, networks, executeCommand } = useDockerStore()
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const prevContainersRef = useRef(containers)
  
  const [showOverview, setShowOverview] = useState(false);

  useEffect(() => {
    if ((containers || []).length > (prevContainersRef.current || []).length) {
      const newContainer = (containers || []).find(c => !(prevContainersRef.current || []).some(prev => prev.id === c.id));
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

  const handleTabClose = (tabId: string, tabName: string) => {
    if (tabId === 'bridge') return;
    executeCommand(`docker network rm ${tabName}`);
    if (activeNetwork === tabId) {
      setActiveNetwork('bridge');
    }
  };

  // Removed handleAddNetworkClick and replaced with onOpenNetworkCreationModal
  // const handleAddNetworkClick = () => {
  //   const networkName = window.prompt("생성할 네트워크의 이름을 입력하세요:");
  //   if (networkName && networkName.trim()) {
  //     executeCommand(`docker network create ${networkName.trim()}`);
  //   }
  // };

  const getContainerPosition = (containerId: string) => {
    const el = document.querySelector(`.container-card[data-container-id="${containerId}"]`);
    if (el) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      return { x: rect.left + window.scrollX + rect.width / 2 - 60, y: rect.top + window.scrollY };
    }
    return undefined;
  };

  const activeNetworkContainers = (containers || []).filter(c => {
    const currentNetwork = (networks || []).find(n => n.id === activeNetwork);
    if (!currentNetwork) return false;
    
    const containerNetworks = Array.isArray(c.network) ? c.network : [c.network];
    return containerNetworks.includes(currentNetwork.id) || containerNetworks.includes(currentNetwork.name);
  });

  const unconnectedVolumes = (volumes || []).filter(v => !v.connectedContainers || v.connectedContainers.length === 0);

  const getContainerLayoutClass = (containers: Container[]) => {
    if (!containers || containers.length === 0) return 'empty-layout';
    if (containers.length <= 2) return 'small-layout';
    return 'normal-layout';
  }

  return (
    <div className="visualizer-container">
      <div className="chrome-toolbar">
        {!showOverview && (
          <div className="network-tabs-container">
            <div className="network-tabs">
              {(networks || []).map(tab => (
                <div
                  key={tab.id}
                  className={`chrome-tab ${activeNetwork === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <span className="tab-icon">⚡</span>
                  <span className="tab-title" onClick={(e) => { e.stopPropagation(); onNetworkClick(tab as Network); }}>
                    {tab.name}
                  </span>
                  {tab.id !== 'bridge' && (
                    <button className="tab-close" onClick={(e) => { e.stopPropagation(); handleTabClose(tab.id, tab.name); }}>×</button>
                  )}
                </div>
              ))}
            </div>
            <button className="add-network-btn" onClick={onOpenNetworkCreationModal}>+</button>
          </div>
        )}
        <div className="view-toggle">
          <button onClick={() => setShowOverview(false)} className={!showOverview ? 'active' : ''}>📦 시각화</button>
          <button onClick={() => setShowOverview(true)} className={showOverview ? 'active' : ''}>📊 그래프</button>
        </div>
      </div>

      {showOverview ? (
        <main id="capture-area" className="overview-main-content">
          <NetworkGraph onNodeClick={(nodeId) => {
              const resource = [...containers, ...volumes, ...networks].find(r => r.id === nodeId);
              if (resource) {
                if ('image' in resource) onContainerClick(resource);
                else if ('mountPath' in resource) onVolumeClick(resource);
                else if ('driver' in resource) onNetworkClick(resource);
              }
          }} />
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
                    onClick={() => onContainerClick(container)}
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
                              onClick={() => onVolumeClick(volume)}
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
                    onClick={() => onVolumeClick(volume)}
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
    </div>
  )
}

export default Visualizer
