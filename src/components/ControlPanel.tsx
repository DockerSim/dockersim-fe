'use client'

import React, { useState } from 'react';
import { useDockerStore, Container, Volume, Network } from '../store/dockerStore';
import { AddBtn, DeleteBtn, NetworkConnectBtn } from './common/BtnCrud';
import '../styles/ControlPanel.css';
import VolumeConnectModal from './VolumeConnectModal';
import ResourceCreationModal, { ResourceCreationData } from './modals/ResourceCreationModal';

interface ControlPanelProps {
  isCollapsed?: boolean;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onContainerClick: (container: Container) => void;
  onVolumeClick: (volume: Volume) => void;
  onNetworkClick: (network: Network) => void;
  onNetworkRemove: (networkName: string) => void;
  onToggle?: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
                                                     isCollapsed = false,
                                                     showToast,
                                                     onContainerClick,
                                                     onVolumeClick,
                                                     onNetworkClick,
                                                     onNetworkRemove,
                                                     onToggle
                                                   }) => {
  const {
    containers,
    volumes,
    networks,
    executeCommand,
    addMessage,
    updateContainer,
    updateVolume,
    createContainerInNetworks
  } = useDockerStore();

  const [activeTab, setActiveTab] = useState<'containers' | 'volumes' | 'networks'>('containers');
  const [volumeConnectModalOpen, setVolumeConnectModalOpen] = useState(false);
  const [resourceCreationModalOpen, setResourceCreationModalOpen] = useState(false);
  const [resourceCreationType, setResourceCreationType] = useState<'container' | 'volume' | 'network'>('container');
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);

  const handleContainerAction = (containerName: string, action: 'start' | 'stop' | 'pause' | 'unpause' | 'rm') => {
    executeCommand(`docker ${action} ${containerName}`);
  };

  const handleRemoveConfirm = (resourceType: 'container' | 'volume', name: string) => {
    if (window.confirm(`정말로 '${name}'을(를) 삭제하시겠습니까?`)) {
      if (resourceType === 'container') handleContainerAction(name, 'rm');
      else if (resourceType === 'volume') executeCommand(`docker volume rm ${name}`);
    }
  };

  const handleCreateResource = (type: 'container' | 'volume' | 'network') => {
    setResourceCreationType(type);
    setResourceCreationModalOpen(true);
  };

  const handleResourceCreationConfirm = (data: ResourceCreationData) => {
    if (resourceCreationType === 'container') {
      createContainerInNetworks(data);
    } else if (resourceCreationType === 'volume') {
      // 볼륨 이름이 없으면 자동 생성
      const volumeName = (data.name && data.name.trim()) ? data.name.trim() : `volume_${Date.now()}`;
      const command = `docker volume create ${volumeName}`;
      executeCommand(command);
    } else if (resourceCreationType === 'network') {
      // 네트워크 이름이 없으면 자동 생성
      const networkName = (data.name && data.name.trim()) ? data.name.trim() : `network_${Date.now()}`;
      const command = `docker network create ${networkName}`;
      executeCommand(command);
    }
    setResourceCreationModalOpen(false);
  };

  const handleVolumeConnect = (volumeId: string, containerIds: string[], mountPath: string) => {
    const volume = volumes.find(v => v.id === volumeId);
    if (!volume) return;

    const updatedConnectedContainers = new Set(volume.connectedContainers || []);

    containerIds.forEach(containerId => {
      const container = containers.find(c => c.id === containerId);
      if (container) {
        const volumeForContainer: Volume = { ...volume, mountPath };
        const updatedContainerVolumes = [
          ...(container.volumes || []).filter(v => v.id !== volumeId),
          volumeForContainer
        ];
        updateContainer(container.id, { volumes: updatedContainerVolumes });
        updatedConnectedContainers.add(container.id);
        addMessage(`볼륨 "${volume.name}"이(가) 컨테이너 "${container.name}"에 연결되었습니다.`);
      }
    });

    updateVolume(volume.id, { connectedContainers: Array.from(updatedConnectedContainers) });
    setVolumeConnectModalOpen(false);
  };

  const handleNetworkConnect = () => {
    if (selectedNetworkId && selectedContainerId) {
      const network = networks.find(n => n.id === selectedNetworkId);
      const container = containers.find(c => c.id === selectedContainerId);
      if (network && container) {
        executeCommand(`docker network connect ${network.name} ${container.name}`);
        setSelectedNetworkId(null);
        setSelectedContainerId(null);
      }
    } else {
      showToast?.('네트워크와 컨테이너를 모두 선택해주세요.', 'error');
    }
  };

  return (
      <div className={`control-panel ${isCollapsed ? 'collapsed' : ''}`}>
        {!isCollapsed && (
            <div className="control-panel-content">
              <div className="tab-navigation">
                <button className={`tab-button ${activeTab === 'containers' ? 'active' : ''}`} onClick={() => setActiveTab('containers')}>📦 컨테이너 ({(containers || []).length})</button>
                <button className={`tab-button ${activeTab === 'volumes' ? 'active' : ''}`} onClick={() => setActiveTab('volumes')}>💾 볼륨 ({(volumes || []).length})</button>
                <button className={`tab-button ${activeTab === 'networks' ? 'active' : ''}`} onClick={() => setActiveTab('networks')}>🌐 네트워크 ({(networks || []).length})</button>
              </div>

              <div className="tab-content">
                {activeTab === 'containers' && (
                    <div className="resource-section">
                      <div className="section-header">
                        <h3>컨테이너 관리</h3>
                        <AddBtn onClick={() => handleCreateResource('container')} size="sm" />
                      </div>
                      <div className="resource-list">
                        {(containers || []).map(container => (
                            <div key={container.id} className="resource-item" onClick={() => onContainerClick(container)}>
                              <div className="resource-info">
                                <div className="resource-name">{container.name}</div>
                                <div className="resource-details">
                                  <span className={`status-badge ${container.status}`}>{container.status}</span>
                                  <span className="resource-image">{container.image}</span>
                                </div>
                              </div>
                              <div className="resource-actions">
                                {container.status === 'stopped' && <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleContainerAction(container.name, 'start'); }}>▶️</button>}
                                {container.status === 'running' && <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleContainerAction(container.name, 'stop'); }}>⏹️</button>}
                                {container.status === 'running' && <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleContainerAction(container.name, 'pause'); }}>⏸️</button>}
                                {container.status === 'paused' && <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleContainerAction(container.name, 'unpause'); }}>⏯️</button>}
                                <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleRemoveConfirm('container', container.name); }}>🗑️</button>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                )}

                {activeTab === 'volumes' && (
                    <div className="resource-section">
                      <div className="section-header">
                        <h3>볼륨 관리</h3>
                        <div className="header-actions">
                          <AddBtn onClick={() => handleCreateResource('volume')} size="sm" />
                          <NetworkConnectBtn onClick={() => setVolumeConnectModalOpen(true)} size="sm" />
                        </div>
                      </div>
                      <div className="resource-list">
                        {(volumes || []).map(volume => (
                            <div key={volume.id} className="resource-item" onClick={() => onVolumeClick(volume)}>
                              <div className="resource-info">
                                <div className="resource-name">{volume.name}</div>
                                <div className="resource-details">
                                  <span className="connected-count">{volume.connectedContainers.length}개 컨테이너에 연결됨</span>
                                </div>
                              </div>
                              <div className="resource-actions">
                                {(!volume.connectedContainers || volume.connectedContainers.length === 0) && (
                                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); executeCommand(`docker volume rm ${volume.name}`); }}>🗑️</button>
                                )}
                              </div>
                            </div>
                        ))}
                        {(volumes || []).length === 0 && <div className="empty-state"><p>볼륨이 없습니다</p></div>}
                      </div>
                    </div>
                )}

                {activeTab === 'networks' && (
                    <div className="resource-section">
                      <div className="section-header">
                        <h3>네트워크 관리</h3>
                        <AddBtn onClick={() => handleCreateResource('network')} size="sm" />
                      </div>
                      <div className="resource-list">
                        {(networks || []).map(network => {
                          const connectedContainers = containers.filter(c => c.network.includes(network.name));
                          return (
                              <div key={network.id} className="resource-item" onClick={() => onNetworkClick(network)}>
                                <div className="resource-info">
                                  <div className="resource-name">{network.name}</div>
                                </div>
                                <div className="resource-actions">
                                  {network.name !== 'bridge' && (
                                      <button className="action-btn" onClick={(e) => { e.stopPropagation(); onNetworkRemove(network.name); }}>🗑️</button>
                                  )}
                                </div>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                )}
              </div>
            </div>
        )}

        <VolumeConnectModal containers={containers || []} volumes={volumes || []} open={volumeConnectModalOpen} onConnect={handleVolumeConnect} onClose={() => setVolumeConnectModalOpen(false)} />
        <ResourceCreationModal
            type={resourceCreationType}
            networks={networks || []}
            open={resourceCreationModalOpen}
            onConfirm={handleResourceCreationConfirm}
            onClose={() => setResourceCreationModalOpen(false)}
        />
      </div>
  );
};

export default ControlPanel;