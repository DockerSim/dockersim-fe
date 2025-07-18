'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useDockerStore } from '../store/dockerStore'
import '../styles/Terminal.css'

interface TerminalProps {
  isCollapsed?: boolean
  onCollapseToggle?: () => void
}

const Terminal: React.FC<TerminalProps> = ({ isCollapsed = false, onCollapseToggle }) => {
  const { 
    currentCommand, 
    terminalHistory, 
    setCurrentCommand, 
    executeCommand: storeExecuteCommand,
    clearTerminalHistory
  } = useDockerStore()
  
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  // 터미널 히스토리 자동 스크롤
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [terminalHistory])

  const executeCommand = (command: string) => {
    // Store의 executeCommand 함수 사용
    storeExecuteCommand(command)
    
    // 명령어 히스토리 업데이트
    setCommandHistory(prev => [...prev, command])
    setHistoryIndex(-1)
    setCurrentCommand('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (currentCommand.trim()) {
        executeCommand(currentCommand.trim())
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCurrentCommand('')
      }
    }
  }

  const toggleCollapse = () => {
    onCollapseToggle?.()
  }

  return (
    <div className={`terminal-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">💻</span>
          Terminal
        </div>
        <button className="collapse-btn" onClick={toggleCollapse}>
          {isCollapsed ? '↑' : '↓'}
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="terminal-output" ref={historyRef}>
            {terminalHistory.map((entry) => (
              <div key={entry.id} className="terminal-entry">
                <div className="command-line">
                  <span className="prompt">root@dockersim:~#</span>
                  <span className="command">{entry.command}</span>
                </div>
                <div className={`output ${entry.isError ? 'error' : ''}`}>
                  {entry.output}
                </div>
              </div>
            ))}
          </div>
          
          <div className="terminal-input-form">
            <div className="command-line">
              <span className="prompt">root@dockersim:~#</span>
              <input
                ref={inputRef}
                type="text"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                className="terminal-input"
                placeholder="Enter Docker command..."
                autoFocus
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Terminal 