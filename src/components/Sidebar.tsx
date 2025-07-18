'use client'

import React from 'react'
import '../styles/Sidebar.css'

interface SidebarProps {
  isControlPanelCollapsed: boolean
  isTerminalCollapsed: boolean
  onControlPanelToggle: () => void
  onTerminalToggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isControlPanelCollapsed, 
  isTerminalCollapsed, 
  onControlPanelToggle, 
  onTerminalToggle 
}) => {
  const shouldShow = isControlPanelCollapsed || isTerminalCollapsed
  
  return (
    <div className={`sidebar ${shouldShow ? 'visible' : ''}`}>
      <div className="sidebar-icons">
        {isControlPanelCollapsed && (
          <div className="sidebar-icon" onClick={onControlPanelToggle} title="리소스 제어 패널 열기">
            <span className="icon">🎛️</span>
            <span className="label">리소스</span>
          </div>
        )}
        {isTerminalCollapsed && (
          <div className="sidebar-icon" onClick={onTerminalToggle} title="터미널 열기">
            <span className="icon">💻</span>
            <span className="label">터미널</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar 