'use client';

import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { useDockerStore, Container, Volume } from '@/store/dockerStore';
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
    const [selectedResource, setSelectedResource] = useState<Container | Volume | null>(null);

    const { containers, volumes, executeCommand } = useDockerStore();

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

    return (
        <div className="overview-page-layout">
            <OverviewSidebar 
                onDownload={handleDownload} 
                isControlPanelCollapsed={isControlPanelCollapsed}
                isTerminalCollapsed={isTerminalCollapsed}
                onControlPanelToggle={() => setControlPanelCollapsed(prevState => !prevState)}
                onTerminalToggle={() => setTerminalCollapsed(prevState => !prevState)}
            />

            {/* 중간 패널: 컨트롤 패널 + 터미널 */}
            <div className="side-panels">
                {!isControlPanelCollapsed && <ControlPanel isCollapsed={isControlPanelCollapsed} onToggle={() => setControlPanelCollapsed(true)} />}
                {!isTerminalCollapsed && 
                    <TerminalCommandPanel 
                        isCollapsed={isTerminalCollapsed} 
                        onToggle={() => setTerminalCollapsed(true)} 
                        showCommandButtons={false}
                    />
                }
            </div>

            {/* 오른쪽 메인 영역: 그래프 */}
            <main id="capture-area" className="overview-main-content">
                <NetworkGraph onNodeClick={handleNodeClick} />
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
