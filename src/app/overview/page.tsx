'use client';

import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { useDockerStore, Container, Volume, Network } from '@/store/dockerStore';
import NetworkGraph from '@/components/visualization/NetworkGraph';
import OverviewSidebar from '@/components/visualization/OverviewSidebar';
import GraphLegend from '@/components/visualization/GraphLegend';
import ControlPanel from '@/components/ControlPanel';
import TerminalCommandPanel from '@/features/docker-simulation/components/terminal/TerminalCommandPanel';
import ResourceDetailModal from '@/components/modals/ResourceDetailModal';
import '@/styles/OverviewPage.css';

export default function OverviewPage() {
    const [isControlPanelCollapsed, setControlPanelCollapsed] = useState(false);
    const [isTerminalCollapsed, setTerminalCollapsed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<Container | Volume | Network | null>(null);

    const { containers, volumes, networks, executeCommand } = useDockerStore();

    // 임시 simulationId와 userId. 실제 값은 사용자 세션 또는 전역 상태에서 가져와야 합니다.
    const SIMULATION_ID = "test-simulation-id"; // TODO: 실제 simulationId로 교체 필요
    const USER_ID = 1; // TODO: 실제 userId로 교체 필요

    const handleDownload = () => {
        const captureElement = document.getElementById('capture-area');
        if (captureElement) {
            html2canvas(captureElement, { backgroundColor: '#ffffff', useCORS: true })
                .then(canvas => {
                    const image = canvas.toDataURL('image/png', 1.0);
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = 'docker-overview.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
        }
    };

    const handleResourceClick = (resource: Container | Volume | Network) => {
        setSelectedResource(resource);
        setIsModalOpen(true);
    };

    const handleModalAction = (action: 'start' | 'stop' | 'remove', resourceId: string) => {
        const resource = [...containers, ...volumes, ...networks].find(r => r.id === resourceId);
        if (!resource) return;

        let command = '';
        if (action === 'remove') {
            if ('image' in resource) command = `docker rm ${resource.name}`;
            else if ('mountPath' in resource) command = `docker volume rm ${resource.name}`;
            else if ('driver' in resource) command = `docker network rm ${resource.name}`;
        } else {
            command = `docker ${action} ${resource.name}`;
        }
        executeCommand(command, SIMULATION_ID, USER_ID); // SIMULATION_ID, USER_ID 추가
        setIsModalOpen(false);
    };

    return (
        <div className="overview-page-layout">
            <OverviewSidebar 
                onDownload={handleDownload} 
                isControlPanelCollapsed={isControlPanelCollapsed}
                isTerminalCollapsed={isTerminalCollapsed}
                onControlPanelToggle={() => setControlPanelCollapsed(prevState => !prevState)}
                onTerminalToggle={() => setTerminalCollapsed(prevState => !prevState)}
            />

            <div className="side-panels">
                {!isControlPanelCollapsed && 
                    <ControlPanel 
                        isCollapsed={isControlPanelCollapsed} 
                        onToggle={() => setControlPanelCollapsed(true)}
                        onContainerClick={handleResourceClick}
                        onVolumeClick={handleResourceClick}
                        onNetworkClick={handleResourceClick}
                    />
                }
                {!isTerminalCollapsed && 
                    <TerminalCommandPanel 
                        isCollapsed={isTerminalCollapsed} 
                        onToggle={() => setTerminalCollapsed(true)} 
                        showCommandButtons={false}
                    />
                }
            </div>

            <main id="capture-area" className="overview-main-content">
                <NetworkGraph onNodeClick={(nodeId) => {
                    const resource = [...containers, ...volumes, ...networks].find(r => r.id === nodeId);
                    if (resource) handleResourceClick(resource);
                }} />
                <GraphLegend />
            </main>

            <ResourceDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                resource={selectedResource}
                onAction={handleModalAction}
            />
        </div>
    );
}