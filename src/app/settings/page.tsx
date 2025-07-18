'use client'

import React, { useState } from 'react'
import '../../styles/Settings.css'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'ko',
    autoSave: true,
    notifications: true,
    dockerTimeout: 30,
    maxContainers: 10,
    defaultNetwork: 'bridge',
    logLevel: 'info'
  })

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = () => {
    localStorage.setItem('dockersim_settings', JSON.stringify(settings))
    alert('설정이 저장되었습니다!')
  }

  const handleReset = () => {
    if (confirm('모든 설정을 초기화하시겠습니까?')) {
      setSettings({
        theme: 'light',
        language: 'ko',
        autoSave: true,
        notifications: true,
        dockerTimeout: 30,
        maxContainers: 10,
        defaultNetwork: 'bridge',
        logLevel: 'info'
      })
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>⚙️ 설정</h1>
          <p>Docker 시뮬레이터의 환경설정을 관리하세요</p>
        </div>

        <div className="settings-content">
          {/* 일반 설정 */}
          <div className="settings-section">
            <h2>일반 설정</h2>
            <div className="setting-group">
              <div className="setting-item">
                <label>테마</label>
                <select 
                  value={settings.theme} 
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <option value="light">라이트</option>
                  <option value="dark">다크</option>
                  <option value="auto">자동</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>언어</label>
                <select 
                  value={settings.language} 
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>자동 저장</label>
                <input 
                  type="checkbox" 
                  checked={settings.autoSave}
                  onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                />
              </div>
              
              <div className="setting-item">
                <label>알림</label>
                <input 
                  type="checkbox" 
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* Docker 설정 */}
          <div className="settings-section">
            <h2>Docker 설정</h2>
            <div className="setting-group">
              <div className="setting-item">
                <label>명령어 타임아웃 (초)</label>
                <input 
                  type="number" 
                  value={settings.dockerTimeout}
                  onChange={(e) => handleSettingChange('dockerTimeout', parseInt(e.target.value))}
                  min="1"
                  max="300"
                />
              </div>
              
              <div className="setting-item">
                <label>최대 컨테이너 수</label>
                <input 
                  type="number" 
                  value={settings.maxContainers}
                  onChange={(e) => handleSettingChange('maxContainers', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
              
              <div className="setting-item">
                <label>기본 네트워크</label>
                <select 
                  value={settings.defaultNetwork} 
                  onChange={(e) => handleSettingChange('defaultNetwork', e.target.value)}
                >
                  <option value="bridge">bridge</option>
                  <option value="host">host</option>
                  <option value="none">none</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>로그 레벨</label>
                <select 
                  value={settings.logLevel} 
                  onChange={(e) => handleSettingChange('logLevel', e.target.value)}
                >
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
            </div>
          </div>

          {/* 시각화 설정 */}
          <div className="settings-section">
            <h2>시각화 설정</h2>
            <div className="setting-group">
              <div className="setting-item">
                <label>애니메이션 효과</label>
                <input 
                  type="checkbox" 
                  checked={true}
                  onChange={() => {}}
                />
              </div>
              
              <div className="setting-item">
                <label>네트워크 연결 라인</label>
                <input 
                  type="checkbox" 
                  checked={true}
                  onChange={() => {}}
                />
              </div>
              
              <div className="setting-item">
                <label>컨테이너 상태 표시</label>
                <input 
                  type="checkbox" 
                  checked={true}
                  onChange={() => {}}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={handleReset}>
            초기화
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  )
} 