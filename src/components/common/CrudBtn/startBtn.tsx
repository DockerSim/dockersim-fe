'use client';

import React from 'react';
import Button from './Button';

interface StartBtnProps {
    onClick?: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const StartBtn = ({ onClick, className = '', size = 'md' }: StartBtnProps) => {
    return (
        <Button
            onClick={onClick}
            className={className}
            variant="success"
            size={size}
        >
            <i className="bi bi-caret-right-fill"></i>
        </Button>
    );
};

export default StartBtn;