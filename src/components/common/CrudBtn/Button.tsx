'use client';

import React, { ReactNode, CSSProperties } from 'react';

interface ButtonProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    style?: CSSProperties;
}

const Button = ({
                    children,
                    onClick,
                    className = '',
                    type = 'button',
                    disabled = false,
                    variant = 'primary',
                    size = 'md',
                    style = {},
                }: ButtonProps) => {
    // 기본 스타일
    const baseStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0.375rem',
        fontWeight: '500',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? '0.5' : '1',
    };

    // 크기별 스타일
    const sizeStyles = {
        sm: {
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
        },
        md: {
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
        },
        lg: {
            padding: '0.625rem 1rem',
            fontSize: '1rem',
        },
    };

    // 색상 스타일
    const variantStyles = {
        primary: {
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
        },
        secondary: {
            backgroundColor: '#F3F4F6',
            color: '#1F2937',
            border: '1px solid #D1D5DB',
        },
        danger: {
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            border: 'none',
        },
        success: {
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            border: 'none',
        },
    };

    // 호버
    const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled) {
            const button = e.currentTarget;
            switch(variant) {
                case 'primary':
                    button.style.backgroundColor = '#2563EB';
                    break;
                case 'secondary':
                    button.style.backgroundColor = '#E5E7EB';
                    break;
                case 'danger':
                    button.style.backgroundColor = '#DC2626';
                    break;
                case 'success':
                    button.style.backgroundColor = '#059669';
                    break;
            }
        }
    };

    const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled) {
            const button = e.currentTarget;
            switch(variant) {
                case 'primary':
                    button.style.backgroundColor = '#3B82F6';
                    break;
                case 'secondary':
                    button.style.backgroundColor = '#F3F4F6';
                    break;
                case 'danger':
                    button.style.backgroundColor = '#EF4444';
                    break;
                case 'success':
                    button.style.backgroundColor = '#10B981';
                    break;
            }
        }
    };

    // 클릭 효과
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled) {
            const button = e.currentTarget;
            button.style.transform = 'scale(0.98)';
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!disabled) {
            const button = e.currentTarget;
            button.style.transform = 'scale(1)';
        }
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={className}
            style={{
                ...baseStyles,
                ...sizeStyles[size],
                ...variantStyles[variant],
                ...style,
            }}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            {children}
        </button>
    );
};

export default Button;