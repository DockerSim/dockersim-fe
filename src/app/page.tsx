'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
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
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const isResizing = useRef(false);

  useNetworkSync();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showProcessBubble = (
      type: ProcessStep['type'],
      message: string,
      containerId: string
  ) => {
    const id = Date.now().toString() + Math.random();
    setProcesses(prev => [...prev, { id, type, message, containerId }]);
    setTimeout(() => {
      setProcesses(prev => prev.filter(p => p.id !== id));
    }, 1500);
  };

  const toggleControlPanel = () => {
    setIsControlPanelCollapsed(!isControlPanelCollapsed)
  }

  const toggleTerminal = () => {
    setIsTerminalCollapsed(!isTerminalCollapsed)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = Math.min(Math.max(e.clientX, 250), window.innerWidth - 300);
      setSidebarWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  const bothCollapsed = isControlPanelCollapsed && isTerminalCollapsed

  return (
      <div className="home-layout">
        <Sidebar
            isControlPanelCollapsed={isControlPanelCollapsed}
            isTerminalCollapsed={isTerminalCollapsed}
            onControlPanelToggle={toggleControlPanel}
            onTerminalToggle={toggleTerminal}
        />

        <div
            className={`main-content sidebar-visible ${bothCollapsed ? 'both-collapsed' : ''}`}
            style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
        >
          <div className="sidebar-content">
            <ResizablePanel
                isCollapsed={isControlPanelCollapsed}
                onCollapseToggle={toggleControlPanel}
                defaultHeight={350}
                minHeight={200}
                maxHeight={600}
                className="control-panel-container"
                title="리소스 제어"
            >
              <ControlPanel
                  isCollapsed={isControlPanelCollapsed}
                  showToast={showToast}
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
                title="터미널"
            >
              <Terminal />
            </ResizablePanel>
          </div>

          <div className="resizer" onMouseDown={handleMouseDown} />

          <div className={`visualizer ${bothCollapsed ? 'expanded' : ''}`}>
            <Visualizer processes={processes} />
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
  )
}
