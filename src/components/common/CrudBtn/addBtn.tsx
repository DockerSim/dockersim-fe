'use client';

import React from 'react';
import Button from './Button';

interface AddBtnProps {
    onClick?: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const AddBtn = ({ onClick, className = '', size = 'md' }: AddBtnProps) => {
    const buttonStyle = {
        borderRadius: '9999px', // 완전한 원형
    };

    return (
        <Button
            onClick={onClick}
            className={className}
            variant="primary"
            size={size}
            style={buttonStyle}
        >
            <i className="bi bi-plus-lg"></i>
        </Button>
    );
};

export default AddBtn;