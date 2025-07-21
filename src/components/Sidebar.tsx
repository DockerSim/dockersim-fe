'use client'

import React, { useState } from 'react'
import ImageModal from './modals/ImageModal'
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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  
  const handleImageClick = () => {
    setIsImageModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsImageModalOpen(false)
  }
  
  return (
    <>
      <div className="sidebar visible">
        <div className="sidebar-icons">
          <div className="sidebar-icon" onClick={handleImageClick} title="이미지 관리">
            <span className="icon">📦</span>
            <span className="label">이미지</span>
          </div>
          
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
      
      <ImageModal 
        isOpen={isImageModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}

export default Sidebar 