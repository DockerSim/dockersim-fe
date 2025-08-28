'use client'

import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import '../styles/Terminal.css';
import { useDockerStore } from '../store/dockerStore';

const TerminalComponent: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const currentLine = useRef('');
  
  // 1. 스토어에서 올바른 상태(terminalHistory)와 액션을 가져옵니다.
  const { terminalHistory, executeCommand } = useDockerStore();
  const lastRenderedCount = useRef(0);

  // 터미널 초기화 및 사용자 입력 처리
  useEffect(() => {
    if (terminalRef.current && !termInstance.current) {
      const term = new Terminal({
        cursorBlink: true,
        rows: 15,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
        },
        fontFamily: '"Cascadia Code", Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        convertEol: true,
      });
      
      termInstance.current = term;
      term.open(terminalRef.current);
      term.write('dockersim $ ');

      term.onData(data => {
        const term = termInstance.current;
        if (!term) return;

        switch (data) {
          case '\r': // Enter
            if (currentLine.current.trim()) {
              term.write('\r\n');
              executeCommand(currentLine.current);
            } else {
              term.write('\r\ndockersim $ ');
            }
            currentLine.current = '';
            break;
          case '\u007f': // Backspace
            if (currentLine.current.length > 0) {
              term.write('\b \b');
              currentLine.current = currentLine.current.slice(0, -1);
            }
            break;
          default:
            currentLine.current += data;
            term.write(data);
        }
      });
    }
  }, [executeCommand]);

  // 2. terminalHistory가 변경될 때마다 새로운 내용을 터미널에 출력합니다.
  useEffect(() => {
    const term = termInstance.current;
    if (!term) return;

    // 새로 추가된 히스토리만 출력하여 중복을 방지합니다.
    if (terminalHistory.length > lastRenderedCount.current) {
      const newEntries = terminalHistory.slice(lastRenderedCount.current);
      newEntries.forEach(entry => {
        // 사용자가 입력한 명령어는 onData에서 이미 처리되었으므로, 출력(output)만 표시합니다.
        if (entry.output) { 
            term.write('\r\n' + entry.output.replace(/\n/g, '\r\n'));
        }
      });
      term.write('\r\ndockersim $ ');
    }
    lastRenderedCount.current = terminalHistory.length;

  }, [terminalHistory]);

  return (
    <div className="terminal-section">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">💻</span>
          Terminal
        </div>
      </div>
      <div id="terminal-container" ref={terminalRef} />
    </div>
  );
};

export default TerminalComponent;