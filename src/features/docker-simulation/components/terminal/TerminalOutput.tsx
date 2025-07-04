import React, { useRef, useEffect } from 'react';
import styles from './Terminal.module.css';

interface TerminalOutputProps {
  output: string[];
}

/**
 * TerminalOutput - 터미널 출력을 담당하는 컴포넌트
 * 
 * 책임:
 * - 명령어 출력 결과 렌더링  
 * - 자동 스크롤 처리
 * - 출력 스타일링 (에러, 성공 등)
 */
export const TerminalOutput: React.FC<TerminalOutputProps> = ({ output }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const formatLine = (line: string, index: number) => {
    // 명령어 라인 ($로 시작)
    if (line.startsWith('$ ')) {
      return (
        <div key={index} className={styles.commandPrompt}>
          <span className={styles.prompt}>$</span>
          <span className={styles.command}>{line.substring(2)}</span>
        </div>
      );
    }

    // 에러 라인
    if (line.toLowerCase().includes('error:') || line.toLowerCase().includes('failed')) {
      return (
        <div key={index} className={styles.errorLine}>
          {line}
        </div>
      );
    }

    // 성공 라인
    if (line.toLowerCase().includes('success') || line.toLowerCase().includes('completed')) {
      return (
        <div key={index} className={styles.successLine}>
          {line}
        </div>
      );
    }

    // 일반 라인
    return (
      <div key={index} className={styles.outputLine}>
        {line || '\u00A0'} {/* 빈 라인을 위한 non-breaking space */}
      </div>
    );
  };

  return (
    <div className={styles.output} ref={terminalRef}>
      {output.map((line, index) => formatLine(line, index))}
    </div>
  );
}; 