import React from 'react';
import styles from './Terminal.module.css';

interface TerminalInputProps {
  command: string;
  isProcessing: boolean;
  onCommandChange: (value: string) => void;
  onCommandSubmit: (e: React.FormEvent) => void;
}

/**
 * TerminalInput - 터미널 입력을 담당하는 컴포넌트
 * 
 * 책임:
 * - 명령어 입력 처리
 * - 프롬프트 표시
 * - 명령어 제출 처리
 */
export const TerminalInput: React.FC<TerminalInputProps> = ({
  command,
  isProcessing,
  onCommandChange,
  onCommandSubmit,
}) => {
  return (
    <form className={styles.inputForm} onSubmit={onCommandSubmit}>
      <div className={styles.commandLine}>
        <span className={styles.prompt}>$</span>
        <input
          type="text"
          className={styles.input}
          value={command}
          onChange={(e) => onCommandChange(e.target.value)}
          placeholder="명령어를 입력하세요..."
          spellCheck={false}
          autoComplete="off"
          disabled={isProcessing}
        />
      </div>
    </form>
  );
}; 