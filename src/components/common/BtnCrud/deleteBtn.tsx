'use client';

import React from 'react';
import Button from './Button';

interface DeleteBtnProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const DeleteBtn = ({ onClick, className = '', size = 'md' }: DeleteBtnProps) => {
  const buttonStyle = {
    borderRadius: '9999px', // 완전한 원형
  };
  
  return (
    <Button 
      onClick={onClick} 
      className={className}
      variant="danger"
      size={size}
      style={buttonStyle}
    >
      <i className="bi bi-dash-lg"></i>
    </Button>
  );
};

export default DeleteBtn;