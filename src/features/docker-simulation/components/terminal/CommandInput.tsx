'use client';

import React from 'react';

interface CommandInputProps {
  command: string;
  onCommandChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isProcessing: boolean;
  placeholder?: string;
}

/**
 * CommandInput - 명령어 입력을 담당하는 Presentation 컴포넌트
 * 
 * 책임:
 * - 명령어 입력 UI 렌더링
 * - 사용자 입력 이벤트 전달
 * - 프로세싱 상태에 따른 UI 제어
 */
const CommandInput: React.FC<CommandInputProps> = ({
  command,
  onCommandChange,
  onSubmit,
  isProcessing,
  placeholder = "Docker 명령어를 입력하세요..."
}) => {
  return (
    <form onSubmit={onSubmit} className="command-input-form">
      <div className="command-prompt">
        <span className="prompt-symbol">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => onCommandChange(e.target.value)}
          placeholder={placeholder}
          disabled={isProcessing}
          className="command-input"
          autoFocus
        />
      </div>
      <button 
        type="submit" 
        disabled={!command.trim() || isProcessing}
        className="submit-button"
      >
        {isProcessing ? '처리 중...' : '실행'}
      </button>
    </form>
  );
};

export default CommandInput; 