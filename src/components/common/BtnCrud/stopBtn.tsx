'use client';

import React from 'react';
import Button from './Button';

interface StopBtnProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const StopBtn = ({ onClick, className = '', size = 'md' }: StopBtnProps) => {
  return (
    <Button 
      onClick={onClick} 
      className={className}
      variant="danger"
      size={size}
    >
      <i className="bi bi-stop-fill"></i>
    </Button>
  );
};

export default StopBtn;