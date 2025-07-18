'use client'

import React, { useState, useCallback } from 'react'
import ControlPanel from '../components/ControlPanel'
import Terminal from '../components/Terminal'
import Visualizer from '../components/Visualizer'
import Sidebar from '../components/Sidebar'
import ResizablePanel from '../components/ResizablePanel'
import '../styles/HomePage.css'

export default function HomePage() {
  const [isControlPanelCollapsed, setIsControlPanelCollapsed] = useState(false)
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false)

  const toggleControlPanel = () => {
    setIsControlPanelCollapsed(!isControlPanelCollapsed)
  }

  const toggleTerminal = () => {
    setIsTerminalCollapsed(!isTerminalCollapsed)
  }

  const bothCollapsed = isControlPanelCollapsed && isTerminalCollapsed
  const sidebarVisible = isControlPanelCollapsed || isTerminalCollapsed

  return (
    <div className="home-layout">
      <Sidebar 
        isControlPanelCollapsed={isControlPanelCollapsed}
        isTerminalCollapsed={isTerminalCollapsed}
        onControlPanelToggle={toggleControlPanel}
        onTerminalToggle={toggleTerminal}
      />
      
      <div className={`main-content ${bothCollapsed ? 'both-collapsed' : ''} ${sidebarVisible ? 'sidebar-visible' : ''}`}>
        <div className="sidebar-content">
          <ResizablePanel 
            isCollapsed={isControlPanelCollapsed}
            defaultHeight={350}
            minHeight={200}
            maxHeight={600}
            className="control-panel-container"
          >
            <ControlPanel isCollapsed={isControlPanelCollapsed} onCollapseToggle={toggleControlPanel} />
          </ResizablePanel>
          
          <ResizablePanel 
            isCollapsed={isTerminalCollapsed}
            defaultHeight={300}
            minHeight={150}
            maxHeight={500}
            className="terminal-container"
          >
            <Terminal isCollapsed={isTerminalCollapsed} onCollapseToggle={toggleTerminal} />
          </ResizablePanel>
        </div>

        <div className={`visualizer ${bothCollapsed ? 'expanded' : ''}`}>
          <Visualizer />
        </div>
      </div>
    </div>
  )
}
