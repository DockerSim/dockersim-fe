'use client'

import React from 'react';
import '../styles/Sidebar.css';

interface SidebarProps {
  onControlPanelToggle: () => void;
  onTerminalToggle: () => void;
  onComposeFileClick: () => void;
  onImageClick: () => void;
  onDockerfileFeedbackClick: () => void; // 피드백 버튼 핸들러 추가
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onControlPanelToggle, 
  onTerminalToggle, 
  onComposeFileClick,
  onImageClick,
  onDockerfileFeedbackClick // 핸들러 추가
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-menu">
        <button className="menu-item" onClick={onImageClick} title="이미지">
          <span className="icon">🗄️</span>
          <span className="label">이미지</span>
        </button>
        <button className="menu-item" onClick={onControlPanelToggle} title="리소스 제어">
          <span className="icon">🎛️</span>
          <span className="label">리소스</span>
        </button>
        <button className="menu-item" onClick={onTerminalToggle} title="터미널">
          <span className="icon">💻</span>
          <span className="label">터미널</span>
        </button>
        <button className="menu-item" onClick={onComposeFileClick} title="컴포즈 파일">
          <span className="icon">📄</span>
          <span className="label">컴포즈</span>
        </button>
        <button className="menu-item" onClick={onDockerfileFeedbackClick} title="도커 파일 피드백">
          <span className="icon">📝</span>
          <span className="label">피드백</span>
        </button>
        <button className="menu-item" onClick={onDockerfileFeedbackClick} title="미션">
          <span className="icon">🏆</span>
          <span className="label">미션</span>
        </button>
      </div>
      <div className="sidebar-footer">
        {/* 추가적인 아이콘이 필요하다면 여기에 */}
      </div>
    </div>
  );
};

export default Sidebar;