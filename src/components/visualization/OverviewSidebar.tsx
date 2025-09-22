'use client';

import React from 'react';
import Link from 'next/link';
import './OverviewSidebar.css';

interface OverviewSidebarProps {
  onDownload: () => void;
  isControlPanelCollapsed: boolean;
  isTerminalCollapsed: boolean;
  onControlPanelToggle: () => void;
  onTerminalToggle: () => void;
}

const OverviewSidebar: React.FC<OverviewSidebarProps> = ({ 
  onDownload, 
  isControlPanelCollapsed, 
  isTerminalCollapsed, 
  onControlPanelToggle, 
  onTerminalToggle 
}) => {
  return (
    <div className="overview-sidebar visible">
      <div className="sidebar-icons">
        <Link href="/" className="sidebar-icon" title="메인으로 돌아가기">
          <span className="icon">↩️</span>
          <span className="label">돌아가기</span>
        </Link>
        
        <div className="sidebar-icon" onClick={onDownload} title="이미지로 다운로드">
          <span className="icon">💾</span>
          <span className="label">다운로드</span>
        </div>

        {/* 패널이 접혔을 때만 아이콘 표시 */}
        {isControlPanelCollapsed && (
          <div className="sidebar-icon" onClick={onControlPanelToggle} title="리소스 제어 패널 열기">
            <span className="icon">🎛️</span>
            <span className="label">리소스</span>
          </div>
        )}
        {isTerminalCollapsed && (
          <div className="sidebar-icon" onClick={onTerminalToggle} title="터미널 열기">
            <span className="icon">💻</span>
            <span className="label">터미널</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewSidebar;
