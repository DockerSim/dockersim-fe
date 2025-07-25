'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useDockerStore, Container, Volume } from '../store/dockerStore'
import { ContainerCard } from './ContainerCard'
import { VolumeConnection } from './VolumeConnection'
import { useActiveNetworkSync } from '../hooks/useActiveNetworkSync'
import ContainerDetailModal from './modals/ContainerDetailModal'
import VolumeDetailModal from './modals/VolumeDetailModal'
import '../styles/Visualizer.css'
import { ProcessVisualization, ProcessStep } from './ProcessVisualization';

interface VisualizerProps {
  processes: ProcessStep[];
}

const Visualizer: React.FC<VisualizerProps> = ({ processes }) => {
  const { containers, volumes, networks } = useDockerStore()
  const [activeNetwork, setActiveNetwork] = useState<string>('bridge')
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null)
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [connectingVolume, setConnectingVolume] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [containerDetailModalOpen, setContainerDetailModalOpen] = useState(false)
  const [volumeDetailModalOpen, setVolumeDetailModalOpen] = useState(false)
  const prevContainersRef = useRef(containers)
  
  // 새로 생성된 네트워크/컨테이너로 자동 전환
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

  // 컨테이너 레이아웃 클래스 계산
  const getContainerLayoutClass = (containers: Container[]) => {
    if (containers.length === 0) return 'empty-layout'
    if (containers.length <= 2) return 'small-layout'
    return 'normal-layout'
  }

  // 탭 클릭 핸들러
  const handleTabClick = (tabId: string) => {
    setActiveNetwork(tabId)
  }

  // 탭 닫기 핸들러
  const handleTabClose = (tabId: string) => {
    if (tabId === 'bridge') return // 기본 네트워크는 닫을 수 없음
    // 네트워크 삭제 로직 추가
  }

  // 컨테이너 클릭 핸들러
  const handleContainerClick = (container: Container) => {
    setSelectedContainer(container)
    setContainerDetailModalOpen(true)
  }

  // 볼륨 클릭 핸들러
  const handleVolumeClick = (volume: Volume) => {
    setSelectedVolume(volume)
    setVolumeDetailModalOpen(true)
  }

  // 컨테이너 카드의 DOM 위치를 계산하는 함수
  const getContainerPosition = (containerId: string) => {
    // ContainerCard 자체를 찾도록 수정
    const el = document.querySelector(`.container-card[data-container-id="${containerId}"]`);
    console.log('Looking for container:', containerId, 'Found element:', el);
    if (el) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      console.log('Container position:', rect);
      // 스크롤/뷰포트 보정
      return {
        x: rect.left + window.scrollX + rect.width / 2 - 60, // 중앙 정렬, 약간 왼쪽
        y: rect.top + window.scrollY
      };
    }
    console.log('Container not found:', containerId);
    return undefined;
  };

  // 말풍선/이모티콘 띄우기 함수
  const showProcessBubble = (type: ProcessStep['type'], message: string, containerId: string) => {
    const id = Date.now().toString() + Math.random();
    // setProcesses(prev => [...prev, { id, type, message, containerId }]); // 이 부분은 이제 상위에서 전달받음
    setTimeout(() => {
      // setProcesses(prev => prev.filter(p => p.id !== id)); // 이 부분은 이제 상위에서 전달받음
    }, 1500);
  };

  // 활성 네트워크의 컨테이너 필터링
  const activeNetworkContainers = containers.filter(c => {
    // 네트워크 ID 또는 이름으로 매칭
    const currentNetwork = networks.find(n => n.id === activeNetwork);
    if (!currentNetwork) return false;
    
    return c.network === currentNetwork.id || 
           c.network === currentNetwork.name || 
           (!c.network && activeNetwork === 'bridge');
  })

  // 활성 네트워크의 볼륨 필터링 - 해당 네트워크에 속한 볼륨만 표시
  const activeNetworkVolumes = volumes.filter(v => {
    // 현재 활성 네트워크 정보 가져오기
    const currentNetwork = networks.find(n => n.id === activeNetwork);
    if (!currentNetwork) return false;
    
    // 볼륨이 특정 네트워크에 속하는지 확인 (ID 또는 이름으로)
    const isInActiveNetwork = v.networkId === currentNetwork.id || 
                              v.networkId === currentNetwork.name ||
                              (!v.networkId && activeNetwork === 'bridge')
    
    // 컨테이너에 연결되지 않은 볼륨만 표시
    const isNotConnectedToContainer = !activeNetworkContainers.some(c => 
      c.volumes?.some(cv => cv.id === v.id)
    )
    
    return isInActiveNetwork && isNotConnectedToContainer
  })

  return (
    <div className="visualizer-container" style={{ position: 'relative' }}>
      {/* 크롬 브라우저 탭 스타일 */}
      <div className="chrome-toolbar">
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
      </div>

      {/* 네트워크 내용 */}
      <div className="network-content">
        <div className="network-container">
          {/* 컨테이너 섹션 */}
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
                
                {/* 볼륨 연결 시각화 */}
                {container.volumes && container.volumes.length > 0 && (
                  <div className="volumes-container">
                    {container.volumes.map((volume, volumeIdx) => {
                      const volumeCount = container.volumes?.length || 0
                      const offset = volumeCount > 1
                        ? (volumeIdx - (volumeCount - 1) / 2) * 100
                        : 0
                      
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
                            isConnecting={connectingVolume && container.id === highlightedId}
                          />
                          <div 
                            className={`volume-circle attached-volume ${highlightedId === volume.id ? 'highlight' : ''}`}
                            onClick={() => handleVolumeClick(volume)}
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

          {/* 연결되지 않은 볼륨 섹션 */}
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
      {/* 말풍선/이모티콘 시각화 */}
      <ProcessVisualization processes={processes} getContainerPosition={getContainerPosition} />
      
      {/* 컨테이너 상세 정보 모달 */}
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
      
      {/* 볼륨 상세 정보 모달 */}
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
    </div>
  )
}

export default Visualizer 