'use client'

import React, { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas';
import { useDockerStore, Container, Volume } from '../store/dockerStore'
import { ContainerCard } from './ContainerCard'
import { VolumeConnection } from './VolumeConnection'
import { useActiveNetworkSync } from '../hooks/useActiveNetworkSync'
import ContainerDetailModal from './modals/ContainerDetailModal'
import VolumeDetailModal from './modals/VolumeDetailModal'
import '../styles/Visualizer.css'
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
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [containerDetailModalOpen, setContainerDetailModalOpen] = useState(false)
  const [volumeDetailModalOpen, setVolumeDetailModalOpen] = useState(false)
  const prevContainersRef = useRef(containers)
  
  const [showOverview, setShowOverview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Container | Volume | null>(null);

  const handleNodeClick = (nodeId: string) => {
    const resource = [...containers, ...volumes].find(r => r.id === nodeId);
    if (resource) {
        setSelectedResource(resource);
        setIsModalOpen(true);
    }
  };

  const handleModalAction = (action: 'start' | 'stop' | 'remove', resourceId: string) => {
    const command = action === 'remove' ? `docker rm ${resourceId}` : `docker ${action} ${resourceId}`;
    executeCommand(command);
    setIsModalOpen(false);
  };

  useActiveNetworkSync(activeNetwork, setActiveNetwork)

  useEffect(() => {
    if (containers.length > prevContainersRef.current.length) {
      const newContainer = containers.find(
        c => !prevContainersRef.current.some(prev => prev.id === c.id)
      )
      if (newContainer) {
        setHighlightedId(newContainer.id)
        setTimeout(() => setHighlightedId(null), 1500)
      }
    }
    prevContainersRef.current = containers
  }, [containers])

  const getContainerLayoutClass = (containers: Container[]) => {
    if (containers.length === 0) return 'empty-layout'
    if (containers.length <= 2) return 'small-layout'
    return 'normal-layout'
  }

  const handleTabClick = (tabId: string) => {
    setActiveNetwork(tabId)
  }

  const handleTabClose = (tabId: string) => {
    if (tabId === 'bridge') return
  }

  const handleContainerClick = (container: Container) => {
    setSelectedContainer(container)
    setContainerDetailModalOpen(true)
  }

  const handleVolumeClick = (volume: Volume) => {
    setSelectedVolume(volume)
    setVolumeDetailModalOpen(true)
  }

  const getContainerPosition = (containerId: string) => {
    const el = document.querySelector(`.container-card[data-container-id="${containerId}"]`);
    if (el) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      return {
        x: rect.left + window.scrollX + rect.width / 2 - 60,
        y: rect.top + window.scrollY
      };
    }
    return undefined;
  };

  const activeNetworkContainers = containers.filter(c => {
    const currentNetwork = networks.find(n => n.id === activeNetwork);
    if (!currentNetwork) return false;
    
    return c.network === currentNetwork.id || 
           c.network === currentNetwork.name || 
           (!c.network && activeNetwork === 'bridge');
  })

  const activeNetworkVolumes = volumes.filter(v => {
    const currentNetwork = networks.find(n => n.id === activeNetwork);
    if (!currentNetwork) return false;
    
    const isInActiveNetwork = v.networkId === currentNetwork.id || 
                              v.networkId === currentNetwork.name ||
                              (!v.networkId && activeNetwork === 'bridge')
    
    const isNotConnectedToAnyContainer = !containers.some(c => 
      c.volumes?.some(cv => cv.id === v.id)
    )
    
    return isInActiveNetwork && isNotConnectedToAnyContainer
  })

  return (
    <div className="visualizer-container">
      <div className={`chrome-toolbar ${showOverview ? 'overview-mode' : ''}`}>
        {!showOverview && (
          <div className="network-tabs">
            {networks.map(network => (
              <div
                key={network.id}
                className={`chrome-tab ${activeNetwork === network.id ? 'active' : ''}`}
                onClick={() => handleTabClick(network.id)}
              >
                <span className="tab-icon">⚡</span>
                <span className="tab-title">{network.name}</span>
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTabClose(network.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="view-toggle">
          <button onClick={() => setShowOverview(false)} className={!showOverview ? 'active' : ''}>📦 시각화</button>
          <button onClick={() => setShowOverview(true)} className={showOverview ? 'active' : ''}>📊 그래프</button>
        </div>
      </div>

      {showOverview ? (
        <main id="capture-area" className="overview-main-content">
          <NetworkGraph onNodeClick={handleNodeClick} />
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
                        const offset = volumeCount > 1
                          ? (volumeIdx - (volumeCount - 1) / 2) * 100
                          : 0;
                        
                        return (
                          <div 
                            key={`${container.id}-${volume.id}`} 
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
                              title={`Path: ${volume.containerPath}`}
                            >
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
                {activeNetworkVolumes.map((volume, index) => (
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
                
                {activeNetworkVolumes.length === 0 && (
                  <div className="empty-volume-message">연결되지 않은 볼륨이 없습니다</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ProcessVisualization processes={processes} getContainerPosition={getContainerPosition} />
      
      <ContainerDetailModal
        container={selectedContainer}
        open={containerDetailModalOpen}
        onClose={() => {
          setContainerDetailModalOpen(false)
          setSelectedContainer(null)
        }}
        onStart={(containerId) => {
          const { updateContainer, executeCommand } = useDockerStore.getState()
          const container = containers.find(c => c.id === containerId)
          if (container) {
            updateContainer(containerId, { status: 'running' })
            executeCommand(`docker start ${container.name}`)
          }
        }}
        onStop={(containerId) => {
          const { updateContainer, executeCommand } = useDockerStore.getState()
          const container = containers.find(c => c.id === containerId)
          if (container) {
            updateContainer(containerId, { status: 'stopped' })
            executeCommand(`docker stop ${container.name}`)
          }
        }}
        onPause={(containerId) => {
            const { updateContainer, executeCommand } = useDockerStore.getState()
            const container = containers.find(c => c.id === containerId)
            if (container) {
            updateContainer(containerId, { status: 'paused' })
            executeCommand(`docker pause ${container.name}`)
            }
        }}
        onRemove={(containerId) => {
            const { removeContainer, executeCommand } = useDockerStore.getState()
            const container = containers.find(c => c.id === containerId)
            if (container) {
            removeContainer(containerId)
            executeCommand(`docker rm ${container.name}`)
            }
        }}
      />
      
      <VolumeDetailModal
        volume={selectedVolume}
        open={volumeDetailModalOpen}
        onClose={() => {
          setVolumeDetailModalOpen(false)
          setSelectedVolume(null)
        }}
        onRemove={(volumeId) => {
          const { removeVolume, executeCommand } = useDockerStore.getState()
          const volume = volumes.find(v => v.id === volumeId)
          if (volume) {
            removeVolume(volumeId)
            executeCommand(`docker volume rm ${volume.name}`)
          }
        }}
      />

      <ResourceDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          resource={selectedResource}
          onAction={handleModalAction}
      />
    </div>
  )
}

export default Visualizer
