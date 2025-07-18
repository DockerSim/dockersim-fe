'use client'

import React, { useState, useRef } from 'react'
import { useDockerStore } from '../store/dockerStore'
import { ContainerCard } from './ContainerCard'
import { VolumeConnection } from './VolumeConnection'
import { Container, Volume, Network } from '../types/docker'
import '../styles/Visualizer.css'

const Visualizer: React.FC = () => {
  const { containers, volumes, networks } = useDockerStore()
  const [activeNetwork, setActiveNetwork] = useState<string>('bridge')
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null)
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null)
  const [connectingVolume, setConnectingVolume] = useState(false)
  const [newContainerId, setNewContainerId] = useState<string | null>(null)
  const [newVolumeId, setNewVolumeId] = useState<string | null>(null)

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
  }

  // 볼륨 클릭 핸들러
  const handleVolumeClick = (volume: Volume) => {
    setSelectedVolume(volume)
  }

  // 활성 네트워크의 컨테이너 필터링
  const activeNetworkContainers = containers.filter(c => c.network === activeNetwork || (!c.network && activeNetwork === 'bridge'))

  // 활성 네트워크의 볼륨 필터링
  const activeNetworkVolumes = volumes.filter(v => !activeNetworkContainers.some(c => c.volumes?.some(cv => cv.id === v.id)))

  return (
    <div className="visualizer-container">
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
                className={`container-wrapper ${newContainerId === container.id ? 'creating' : ''}`}
                data-container-id={container.id}
              >
                <ContainerCard
                  container={container}
                  onClick={() => handleContainerClick(container)}
                  isCreating={newContainerId === container.id}
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
                            isConnecting={connectingVolume && container.id === newContainerId}
                          />
                          <div 
                            className={`volume-circle attached-volume ${newVolumeId === volume.id ? 'highlight' : ''}`}
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
                  className={`volume-circle unconnected-volume ${newVolumeId === volume.id ? 'highlight' : ''}`}
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
    </div>
  )
}

export default Visualizer 