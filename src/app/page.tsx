'use client'

import React, { useState, useCallback } from 'react'
import ControlPanel from '../components/ControlPanel'
import Terminal from '../components/Terminal'
import Visualizer from '../components/Visualizer'
import Sidebar from '../components/Sidebar'
import ResizablePanel from '../components/ResizablePanel'
import '../styles/HomePage.css'
import { ToastContainer, ToastProps } from '../components/common/Toast';
import { ProcessStep } from '../components/ProcessVisualization';
import { useNetworkSync } from '../hooks/useNetworkSync';

export default function HomePage() {
  const [isControlPanelCollapsed, setIsControlPanelCollapsed] = useState(false)
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false)
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([])
  const [processes, setProcesses] = useState<ProcessStep[]>([]);
  
  // 네트워크 동기화 훅 사용
  useNetworkSync();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // 말풍선/이모티콘 띄우기 함수
  const showProcessBubble = (
    type: ProcessStep['type'],
    message: string,
    containerId: string
  ) => {
    console.log('showProcessBubble called:', { type, message, containerId });
    const id = Date.now().toString() + Math.random();
    setProcesses(prev => {
      const newProcesses = [...prev, { id, type, message, containerId }];
      console.log('Updated processes:', newProcesses);
      return newProcesses;
    });
    setTimeout(() => {
      setProcesses(prev => {
        const filtered = prev.filter(p => p.id !== id);
        console.log('Removed process, remaining:', filtered);
        return filtered;
      });
    }, 1500);
  };

  const toggleControlPanel = () => {
    setIsControlPanelCollapsed(!isControlPanelCollapsed)
  }

  const toggleTerminal = () => {
    setIsTerminalCollapsed(!isTerminalCollapsed)
  }

  const bothCollapsed = isControlPanelCollapsed && isTerminalCollapsed

  return (
    <div className="home-layout">
      <Sidebar 
        isControlPanelCollapsed={isControlPanelCollapsed}
        isTerminalCollapsed={isTerminalCollapsed}
        onControlPanelToggle={toggleControlPanel}
        onTerminalToggle={toggleTerminal}
      />
      
      <div className={`main-content sidebar-visible ${bothCollapsed ? 'both-collapsed' : ''}`}>
        <div className="sidebar-content">
          <ResizablePanel 
            isCollapsed={isControlPanelCollapsed}
            onCollapseToggle={toggleControlPanel}
            defaultHeight={350}
            minHeight={200}
            maxHeight={600}
            className="control-panel-container"
          >
            <ControlPanel 
              isCollapsed={isControlPanelCollapsed}
              onCollapseToggle={toggleControlPanel}
              showToast={showToast} // Toast 함수 전달
              showProcessBubble={showProcessBubble}
            />
          </ResizablePanel>
          
          <ResizablePanel 
            isCollapsed={isTerminalCollapsed}
            onCollapseToggle={toggleTerminal}
            defaultHeight={300}
            minHeight={150}
            maxHeight={500}
            className="terminal-container"
          >
            <Terminal 
              isCollapsed={isTerminalCollapsed}
              onCollapseToggle={toggleTerminal}
            />
          </ResizablePanel>
        </div>
        
        <div className={`visualizer ${bothCollapsed ? 'expanded' : ''}`}>
          <Visualizer processes={processes} />
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
