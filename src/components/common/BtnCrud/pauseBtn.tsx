'use client';

import React from 'react';
import Button from './Button';

interface PauseBtnProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PauseBtn = ({ onClick, className = '', size = 'md' }: PauseBtnProps) => {
  return (
    <Button 
      onClick={onClick} 
      className={className}
      variant="secondary"
      size={size}
    >
      <i className="bi bi-pause-fill"></i>
    </Button>
  );
};

export default PauseBtn; 