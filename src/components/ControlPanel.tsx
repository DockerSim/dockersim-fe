'use client'

import React, { useState, useEffect } from 'react'
import { useDockerStore } from '../store/dockerStore'
import { AddBtn, DeleteBtn, NetworkConnectBtn } from './common/BtnCrud'
import '../styles/ControlPanel.css'
import VolumeConnectModal from './VolumeConnectModal';
import ResourceCreationModal, { ResourceCreationData } from './modals/ResourceCreationModal';
import { useNetworkSync } from '../hooks/useNetworkSync';

interface ControlPanelProps {
  isCollapsed?: boolean
  onCollapseToggle?: () => void
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void
  showProcessBubble?: (type: 'create' | 'start' | 'stop' | 'remove' | 'error' | 'info', message: string, containerId: string) => void
}

const ControlPanel: React.FC<ControlPanelProps> = ({ isCollapsed = false, onCollapseToggle, showToast, showProcessBubble }) => {
  const { 
    containers, 
    volumes, 
    networks, 
    updateContainer, 
    removeContainer, 
    removeVolume, 
    removeNetwork,
    executeCommand,
    updateVolume
  } = useDockerStore()
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null)
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'containers' | 'volumes' | 'networks'>('containers')
  const [volumeModalOpen, setVolumeModalOpen] = useState(false);
  const [resourceCreationModalOpen, setResourceCreationModalOpen] = useState(false);
  const [resourceCreationType, setResourceCreationType] = useState<'container' | 'volume'>('container');
  
  // 네트워크 동기화 훅 사용
  useNetworkSync();

  const handleContainerAction = (containerId: string, action: string) => {
    const container = containers.find(c => c.id === containerId)
    if (!container) return

    switch (action) {
      case 'start':
        updateContainer(containerId, { status: 'running' })
        executeCommand(`docker start ${container.name}`)
        showToast && showToast('컨테이너가 시작되었습니다.', 'success')
        showProcessBubble && showProcessBubble('start', '시작!', containerId)
        break
      case 'stop':
        updateContainer(containerId, { status: 'stopped' })
        executeCommand(`docker stop ${container.name}`)
        showToast && showToast('컨테이너가 중지되었습니다.', 'info')
        showProcessBubble && showProcessBubble('stop', '중지', containerId)
        break
      case 'pause':
        updateContainer(containerId, { status: 'paused' })
        executeCommand(`docker pause ${container.name}`)
        showToast && showToast('컨테이너가 일시정지되었습니다.', 'info')
        showProcessBubble && showProcessBubble('info', '일시정지', containerId)
        break
      case 'remove':
        removeContainer(containerId)
        executeCommand(`docker rm ${container.name}`)
        showToast && showToast('컨테이너가 삭제되었습니다.', 'error')
        showProcessBubble && showProcessBubble('remove', '삭제', containerId)
        break
    }
  }

  const handleVolumeAction = (volumeId: string, action: string) => {
    const volume = volumes.find(v => v.id === volumeId)
    if (!volume) return

    if (action === 'remove') {
      removeVolume(volumeId)
      executeCommand(`docker volume rm ${volume.name}`)
    }
  }

  const handleNetworkAction = (networkId: string, action: string) => {
    const network = networks.find(n => n.id === networkId)
    if (!network) return

    if (action === 'remove' && network.id !== 'bridge') {
      removeNetwork(networkId)
      executeCommand(`docker network rm ${network.name}`)
    }
  }

  const handleCreateNetwork = () => {
    const networkName = prompt('네트워크 이름을 입력하세요:')
    if (networkName) {
      executeCommand(`docker network create ${networkName}`)
    }
  }

  const handleCreateVolume = () => {
    setResourceCreationType('volume');
    setResourceCreationModalOpen(true);
  }

  const handleCreateContainer = () => {
    setResourceCreationType('container');
    setResourceCreationModalOpen(true);
  }

  const handleNetworkConnect = () => {
    if (selectedNetworkId && selectedContainerId) {
      const network = networks.find(n => n.id === selectedNetworkId)
      const container = containers.find(c => c.id === selectedContainerId)
      if (network && container) {
        executeCommand(`docker network connect ${network.name} ${container.name}`)
        setSelectedNetworkId(null)
        setSelectedContainerId(null)
      }
    } else {
      alert('네트워크와 컨테이너를 선택해주세요.')
    }
  }

  const handleVolumeConnect = () => {
    setVolumeModalOpen(true);
  };

  const handleVolumeModalConnect = (volumeId: string, containerId: string, mountPath: string) => {
    const volume = volumes.find(v => v.id === volumeId);
    const container = containers.find(c => c.id === containerId);
    if (volume && container) {
      // 컨테이너에 볼륨 추가
      const newVolumeObj = {
        id: volume.id,
        name: volume.name,
        mountPath: mountPath,
        connectedContainers: [...(volume.connectedContainers || []), container.id]
      };
      const updatedVolumes = (container.volumes || []).filter(v => v.id !== volume.id).concat(newVolumeObj);
      updateContainer(container.id, { volumes: updatedVolumes });
      // 볼륨에 컨테이너 연결 추가
      updateVolume(volume.id, {
        connectedContainers: Array.from(new Set([...(volume.connectedContainers || []), container.id]))
      });
      setVolumeModalOpen(false);
    }
  };

  const handleResourceCreation = (data: ResourceCreationData) => {
    const network = networks.find(n => n.id === data.networkId);
    if (!network) return;

    if (resourceCreationType === 'container' && data.image) {
      // 컨테이너 생성 로직
      let newId = Date.now().toString();
      
      if (data.name) {
        executeCommand(`docker run --name ${data.name} --network ${network.name} -d ${data.image}`);
      } else {
        executeCommand(`docker run --network ${network.name} -d ${data.image}`);
      }
      
      showToast && showToast(`${network.name} 네트워크에 컨테이너가 생성되었습니다.`, 'success');
      showProcessBubble && showProcessBubble('create', '생성!', newId);
    } else if (resourceCreationType === 'volume') {
      // 볼륨 생성 로직
      executeCommand(`docker volume create --network ${network.name} ${data.name}`);
      showToast && showToast(`${network.name} 네트워크에 볼륨이 생성되었습니다.`, 'success');
    }

    setResourceCreationModalOpen(false);
  };

  const toggleCollapse = () => {
    onCollapseToggle?.()
  }

  return (
    <div className={`control-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="control-panel-header">
        <div className="control-panel-title">
          <span className="control-panel-icon">🎛️</span>
          리소스 제어
        </div>
        <button className="collapse-btn" onClick={toggleCollapse}>
          {isCollapsed ? '↑' : '↓'}
        </button>
      </div>

            {!isCollapsed && (
        <div className="control-panel-content">
          {/* 탭 네비게이션 */}
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'containers' ? 'active' : ''}`}
              onClick={() => setActiveTab('containers')}
            >
              📦 컨테이너 ({containers.length})
            </button>
            <button 
              className={`tab-button ${activeTab === 'volumes' ? 'active' : ''}`}
              onClick={() => setActiveTab('volumes')}
            >
              💾 볼륨 ({volumes.length})
            </button>
            <button 
              className={`tab-button ${activeTab === 'networks' ? 'active' : ''}`}
              onClick={() => setActiveTab('networks')}
            >
              🌐 네트워크 ({networks.length})
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="tab-content">
            {activeTab === 'containers' && (
              <div className="resource-section">
                <div className="section-header">
                  <h3>컨테이너 관리</h3>
                  <AddBtn 
                    onClick={handleCreateContainer}
                    size="sm"
                  />
                </div>
                <div className="resource-list">
                  {containers.map(container => (
                    <div key={container.id} className="resource-item">
                      <div className="resource-info">
                        <div className="resource-name">{container.name}</div>
                        <div className="resource-details">
                          <span className={`status-badge ${container.status}`}>
                            {container.status}
                          </span>
                          <span className="resource-image">{container.image}</span>
                        </div>
                      </div>
                      <div className="resource-actions">
                        {container.status === 'stopped' && (
                          <button 
                            className="action-btn start"
                            onClick={() => handleContainerAction(container.id, 'start')}
                          >
                            ▶️
                          </button>
                        )}
                        {container.status === 'running' && (
                          <button 
                            className="action-btn stop"
                            onClick={() => handleContainerAction(container.id, 'stop')}
                          >
                            ⏹️
                          </button>
                        )}
                        {container.status === 'running' && (
                          <button 
                            className="action-btn pause"
                            onClick={() => handleContainerAction(container.id, 'pause')}
                          >
                            ⏸️
                          </button>
                        )}
                        <button 
                          className="action-btn remove"
                          onClick={() => handleContainerAction(container.id, 'remove')}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  {containers.length === 0 && (
                    <div className="empty-state">
                      <p>컨테이너가 없습니다</p>
                      <small>터미널에서 docker run 명령어를 실행해보세요</small>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'volumes' && (
              <div className="resource-section">
                <div className="section-header">
                  <h3>볼륨 관리</h3>
                  <div className="header-actions">
                    <AddBtn 
                      onClick={handleCreateVolume}
                      size="sm"
                    />
                    <NetworkConnectBtn 
                      onClick={handleVolumeConnect}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="resource-list">
                  {volumes.map(volume => (
                    <div key={volume.id} className="resource-item">
                      <div className="resource-info">
                        <div className="resource-name">{volume.name}</div>
                        <div className="resource-details">
                          <span className="resource-path">{volume.mountPath}</span>
                          <span className="connected-count">
                            {volume.connectedContainers.length}개 연결됨
                          </span>
                        </div>
                      </div>
                      <div className="resource-actions">
                        <DeleteBtn 
                          onClick={() => handleVolumeAction(volume.id, 'remove')}
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                  {volumes.length === 0 && (
                    <div className="empty-state">
                      <p>볼륨이 없습니다</p>
                      <small>터미널에서 docker volume create 명령어를 실행해보세요</small>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'networks' && (
              <div className="resource-section">
                <div className="section-header">
                  <h3>네트워크 관리</h3>
                  <AddBtn 
                    onClick={handleCreateNetwork}
                    size="sm"
                  />
                </div>
                
                {/* 네트워크 연결 컨트롤 */}
                <div className="network-connection-control">
                  <div className="connection-selector">
                    <select 
                      value={selectedNetworkId || ''} 
                      onChange={(e) => setSelectedNetworkId(e.target.value)}
                      className="select-input"
                    >
                      <option value="">네트워크 선택</option>
                      {networks.map(network => (
                        <option key={network.id} value={network.id}>
                          {network.name}
                        </option>
                      ))}
                    </select>
                    
                    <select 
                      value={selectedContainerId || ''} 
                      onChange={(e) => setSelectedContainerId(e.target.value)}
                      className="select-input"
                    >
                      <option value="">컨테이너 선택</option>
                      {containers.map(container => (
                        <option key={container.id} value={container.id}>
                          {container.name}
                        </option>
                      ))}
                    </select>
                    
                    <NetworkConnectBtn 
                      onClick={handleNetworkConnect}
                      size="sm"
                    />
                  </div>
                </div>
                
                <div className="resource-list">
                  {networks.map(network => (
                    <div key={network.id} className="resource-item">
                      <div className="resource-info">
                        <div className="resource-name">{network.name}</div>
                        <div className="resource-details">
                          <span className="connected-count">
                            {network.containers.length}개 컨테이너 연결됨
                          </span>
                        </div>
                      </div>
                      <div className="resource-actions">
                        {network.id !== 'bridge' && (
                          <DeleteBtn 
                            onClick={() => handleNetworkAction(network.id, 'remove')}
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 볼륨 연결 모달 */}
      <VolumeConnectModal
        containers={containers}
        volumes={volumes}
        open={volumeModalOpen}
        onConnect={handleVolumeModalConnect}
        onClose={() => setVolumeModalOpen(false)}
      />
      
      {/* 리소스 생성 모달 */}
      <ResourceCreationModal
        type={resourceCreationType}
        networks={networks}
        open={resourceCreationModalOpen}
        onConfirm={handleResourceCreation}
        onClose={() => setResourceCreationModalOpen(false)}
      />
    </div>
  )
}

export default ControlPanel 