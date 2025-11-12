'use client'

import React from 'react';
import { useAuthStore } from '@/store/authStore'; // authStore 임포트
import '../styles/Sidebar.css';

interface SidebarProps {
  onControlPanelToggle: () => void;
  onTerminalToggle: () => void;
  onComposeFileClick: () => void;
  onImageClick: () => void;
  onDockerfileFeedbackClick: () => void;
  onMissionClick: () => void;
  onSave: () => void; // onSave prop 추가
  onShare: () => void; // onShare prop 추가
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onControlPanelToggle, 
  onTerminalToggle, 
  onComposeFileClick,
  onImageClick,
  onDockerfileFeedbackClick,
  onMissionClick,
  onSave, // onSave prop 받기
  onShare, // onShare prop 받기
}) => {
  const { isLoggedIn } = useAuthStore(); // 로그인 상태 가져오기

  return (
    <div className="sidebar">
      <div className="sidebar-menu">
        {isLoggedIn && (
          <>
            <button className="menu-item" onClick={onSave} title="시뮬레이션 저장">
              <span className="icon">💾</span>
              <span className="label">저장</span>
            </button>
            <button className="menu-item" onClick={onShare} title="공유 및 협업">
              <span className="icon">🤝</span>
              <span className="label">공유</span>
            </button>
          </>
        )}
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
        <button className="menu-item" onClick={onComposeFileClick} title="Docker Compose 파일 생성">
          <span className="icon">📄</span>
          <span className="label">Compose</span>
        </button>
        <button className="menu-item" onClick={onDockerfileFeedbackClick} title="Dockerfile AI 피드백">
          <span className="icon">🤖</span>
          <span className="label">Dockerfile</span>
        </button>
        <button className="menu-item" onClick={onMissionClick} title="미션">
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