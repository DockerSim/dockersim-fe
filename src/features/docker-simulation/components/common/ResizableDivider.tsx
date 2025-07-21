'use client';

import React, { useState, useCallback, useRef } from 'react';
import styles from './ResizableDivider.module.css';

interface ResizableDividerProps {
  /** 초기 좌측 패널 너비 (퍼센트) */
  initialLeftWidth?: number;
  /** 최소 좌측 패널 너비 (퍼센트) */
  minLeftWidth?: number;
  /** 최대 좌측 패널 너비 (퍼센트) */
  maxLeftWidth?: number;
  /** 좌측 패널 컨텐츠 */
  leftPanel: React.ReactNode;
  /** 우측 패널 컨텐츠 */
  rightPanel: React.ReactNode;
  /** 방향 (horizontal만 지원) */
  direction?: 'horizontal';
}

const ResizableDivider: React.FC<ResizableDividerProps> = ({
  initialLeftWidth = 40,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  leftPanel,
  rightPanel,
  direction = 'horizontal'
}) => {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // 최소/최대 너비 제한
      const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
      setLeftWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [minLeftWidth, maxLeftWidth]);

  const handleDoubleClick = useCallback(() => {
    // 더블클릭시 초기 너비로 리셋
    setLeftWidth(initialLeftWidth);
  }, [initialLeftWidth]);

  return (
    <div 
      ref={containerRef}
      className={`${styles.resizableContainer} ${isDragging ? styles.dragging : ''}`}
    >
      {/* 좌측 패널 */}
      <div 
        className={styles.leftPanel}
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* 드래그 핸들 */}
      <div 
        className={styles.divider}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className={styles.dividerHandle}>
          <div className={styles.dividerGrip}></div>
        </div>
      </div>

      {/* 우측 패널 */}
      <div 
        className={styles.rightPanel}
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

export default ResizableDivider; 