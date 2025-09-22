'use client';

import React from 'react';
import { Container, Volume } from '@/store/dockerStore';
import './ResourceDetailModal.css';

interface ResourceDetailModalProps {
  resource: Container | Volume | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'start' | 'stop' | 'remove', resourceId: string) => void;
}

const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({ resource, isOpen, onClose, onAction }) => {
  if (!isOpen || !resource) {
    return null;
  }

  const isContainer = 'status' in resource;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{resource.name}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p><strong>ID:</strong> {resource.id}</p>
          {isContainer && (
            <>
              <p><strong>Image:</strong> {(resource as Container).image}</p>
              <p><strong>Status:</strong> <span className={`status-badge status-${(resource as Container).status}`}>{(resource as Container).status}</span></p>
              <p><strong>Network:</strong> {(resource as Container).network}</p>
            </>
          )}
          {!isContainer && (
            <p><strong>Mount Path:</strong> {(resource as Volume).mountPath}</p>
          )}
        </div>
        <div className="modal-footer">
          {isContainer && (resource as Container).status !== 'running' && (
            <button className="action-btn btn-start" onClick={() => onAction('start', resource.id)}>Start</button>
          )}
          {isContainer && (resource as Container).status === 'running' && (
            <button className="action-btn btn-stop" onClick={() => onAction('stop', resource.id)}>Stop</button>
          )}
          <button className="action-btn btn-remove" onClick={() => onAction('remove', resource.id)}>Remove</button>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailModal;
