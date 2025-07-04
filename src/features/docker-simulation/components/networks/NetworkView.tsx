import React, { useState } from 'react';
import { Network, Container } from '../../types';
import { ContainerCard } from '../containers/ContainerCard';
import { ContainerModal } from '../modals/ContainerModal';
import styles from '../terminal/Terminal.module.css';

interface NetworkViewProps {
  network: Network;
  onContainerStart?: (id: string) => void;
  onContainerStop?: (id: string) => void;
  onContainerRemove?: (id: string) => void;
}

export const NetworkView: React.FC<NetworkViewProps> = ({ 
  network, 
  onContainerStart, 
  onContainerStop, 
  onContainerRemove 
}) => {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  return (
    <div className={styles.networkView}>
      <div className={styles.containersGrid}>
        {network.containers.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            onClick={() => setSelectedContainer(container)}
          />
        ))}
      </div>
      {selectedContainer && (
        <ContainerModal
          container={selectedContainer}
          onClose={() => setSelectedContainer(null)}
          onStart={onContainerStart}
          onStop={onContainerStop}
          onRemove={onContainerRemove}
        />
      )}
    </div>
  );
}; 