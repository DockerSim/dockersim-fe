import React from 'react'
import { Container } from '../types/docker'
import '../styles/ContainerCard.css'

interface ContainerCardProps {
  container: Container
  onClick: () => void
  isCreating?: boolean
}

export const ContainerCard: React.FC<ContainerCardProps> = ({ 
  container, 
  onClick, 
  isCreating = false 
}) => (
  <div 
    className={`container-card ${container.status === 'running' ? 'running' : 'stopped'} ${isCreating ? 'highlight' : ''}`} 
    onClick={onClick}
    data-container-id={container.id}
  >
    <div className="container-header">
      <span className="container-icon">📦</span>
      <h3 className="container-name">{container.name}</h3>
      <span className={`status-indicator ${container.status}`}></span>
    </div>
    <div className="container-image-tag">{container.image}</div>
    <div className="ports-list">
      {container.ports.map((port, index) => (
        <span key={index} className="port-badge">
          {port.hostPort}:{port.containerPort}
        </span>
      ))}
    </div>
    {container.volumes && container.volumes.length > 0 && (
      <div className="volume-connection">
        {container.volumes.map((volume, index) => (
          <span key={index} className="volume-badge">
            {volume.name}
          </span>
        ))}
      </div>
    )}
  </div>
) 