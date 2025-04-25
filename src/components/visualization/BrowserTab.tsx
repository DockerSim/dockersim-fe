'use client';

import React from 'react';
import styles from './BrowserTab.module.css';

interface Props {
  name: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const BrowserTab: React.FC<Props> = ({ name, isActive, onClick, onClose }) => {
  return (
    <div 
      className={`${styles.tab} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <div className={styles.favicon}>
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path 
            fill="currentColor" 
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
          />
        </svg>
      </div>
      <span className={styles.name}>{name}</span>
      <button 
        className={styles.closeButton}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>
    </div>
  );
};

export default BrowserTab; 