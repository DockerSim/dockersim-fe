'use client'

import React, { useState, useRef, useEffect } from 'react'
import '../styles/ResizablePanel.css'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultHeight?: number
  minHeight?: number
  maxHeight?: number
  isCollapsed?: boolean
  onCollapseToggle?: () => void
  direction?: 'horizontal' | 'vertical'
  className?: string
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  defaultHeight = 300,
  minHeight = 150,
  maxHeight = 600,
  isCollapsed = false,
  onCollapseToggle,
  direction = 'vertical',
  className = ''
}) => {
  const [height, setHeight] = useState(defaultHeight)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return

      const rect = panelRef.current.getBoundingClientRect()
      const newHeight = e.clientY - rect.top
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, minHeight, maxHeight])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleToggleCollapse = () => {
    onCollapseToggle?.()
  }

  return (
    <div 
      ref={panelRef}
      className={`resizable-panel ${className} ${isCollapsed ? 'collapsed' : ''}`}
      style={{ 
        height: isCollapsed ? '0px' : `${height}px`,
        display: isCollapsed ? 'none' : 'block'
      }}
    >
      <div className="panel-content">
        {children}
      </div>
      
      {!isCollapsed && (
        <div 
          ref={resizerRef}
          className="resizer"
          onMouseDown={handleMouseDown}
        >
          <div className="resizer-handle">
            <div className="resizer-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResizablePanel 