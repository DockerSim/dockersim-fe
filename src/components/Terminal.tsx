'use client'

import React, { useEffect, useRef } from 'react';
import { Terminal as XtermTerminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import '../styles/Terminal.css';
import { useDockerStore } from '../store/dockerStore';

interface TerminalProps {
  isCollapsed: boolean;
  onCollapseToggle: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ isCollapsed, onCollapseToggle }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<XtermTerminal | null>(null);
  const currentLine = useRef('');
  
  const { terminalHistory, executeCommand } = useDockerStore();
  const lastRenderedCount = useRef(0);

  useEffect(() => {
    if (terminalRef.current && !termInstance.current) {
      const term = new XtermTerminal({
        cursorBlink: true,
        rows: 15,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selection: 'rgba(255, 255, 255, 0.3)',
        },
        fontFamily: '"Cascadia Code", Menlo, Monaco, "Courier New", monospace',
        fontSize: 14,
        convertEol: true,
      });
      
      termInstance.current = term;
      term.open(terminalRef.current);
      term.write('\x1b[36mdockersim\x1b[0m $ ');

      term.onData(data => {
        const term = termInstance.current;
        if (!term) return;

        switch (data) {
          case '\r': // Enter
            if (currentLine.current.trim()) {
              term.write('\r\n');
              executeCommand(currentLine.current);
            } else {
              term.write('\r\n\x1b[36mdockersim\x1b[0m $ ');
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

  useEffect(() => {
    const term = termInstance.current;
    if (!term) return;

    if ((terminalHistory || []).length > lastRenderedCount.current) {
      const newEntries = (terminalHistory || []).slice(lastRenderedCount.current);
      newEntries.forEach(entry => {
        if (entry.output) { 
            const formattedOutput = entry.output.replace(/\n/g, '\r\n');
            if (entry.isError) {
                term.write(`\r\n\x1b[31m${formattedOutput}\x1b[0m`);
            } else {
                term.write(`\r\n${formattedOutput}`);
            }
        }
      });
      term.write('\r\n\x1b[36mdockersim\x1b[0m $ ');
    }
    lastRenderedCount.current = (terminalHistory || []).length;

  }, [terminalHistory]);

  return (
    <div className={`terminal-section ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="terminal-header" onClick={onCollapseToggle}>
        <div className="terminal-title">
          <span className="terminal-icon">💻</span>
          Terminal
        </div>
      </div>
      <div 
        className="terminal-content-wrapper" 
        style={{ display: isCollapsed ? 'none' : 'block' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div id="terminal-container" ref={terminalRef} style={{ height: '100%' }} />
      </div>
    </div>
  );
};

export default Terminal;