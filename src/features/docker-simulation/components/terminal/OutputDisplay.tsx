'use client';

import React, { useEffect, useRef } from 'react';

interface OutputDisplayProps {
  output: string[];
  isProcessing: boolean;
}

/**
 * OutputDisplay - 터미널 출력을 담당하는 Presentation 컴포넌트
 * 
 * 책임:
 * - 명령어 출력 결과 렌더링
 * - 자동 스크롤 처리
 * - 출력 스타일링 (에러, 성공 등)
 */
const OutputDisplay: React.FC<OutputDisplayProps> = ({
  output,
  isProcessing
}) => {
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
        <div key={index} className="command-line">
          <span className="prompt">$</span>
          <span className="command">{line.substring(2)}</span>
        </div>
      );
    }

    // 에러 라인
    if (line.toLowerCase().includes('error:') || line.toLowerCase().includes('failed')) {
      return (
        <div key={index} className="error-line">
          {line}
        </div>
      );
    }

    // 성공 라인
    if (line.toLowerCase().includes('success') || line.toLowerCase().includes('completed')) {
      return (
        <div key={index} className="success-line">
          {line}
        </div>
      );
    }

    // 일반 라인
    return (
      <div key={index} className="output-line">
        {line || '\u00A0'} {/* 빈 라인을 위한 non-breaking space */}
      </div>
    );
  };

  return (
    <div className="output-display" ref={terminalRef}>
      {output.map((line, index) => formatLine(line, index))}
      {isProcessing && (
        <div className="output-line processing">
          <span className="processing-indicator">처리 중...</span>
        </div>
      )}
      
      <style jsx>{`
        .output-display {
          flex: 1;
          padding: 16px;
          background: #0f0f23;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.4;
          overflow-y: auto;
          white-space: pre-wrap;
          max-height: 400px;
        }
        
        .command-line {
          display: flex;
          gap: 8px;
          margin: 4px 0;
          color: #00ff00;
        }
        
        .prompt {
          color: #00ff00;
          font-weight: bold;
        }
        
        .command {
          color: #ffffff;
        }
        
        .output-line {
          margin: 2px 0;
          color: #ffffff;
        }
        
        .error-line {
          margin: 2px 0;
          color: #ff6b6b;
        }
        
        .success-line {
          margin: 2px 0;
          color: #51cf66;
        }
        
        .processing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 8px 0;
          color: #ffd43b;
        }
        
        .loading-dots {
          animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
          0%, 20% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          80%, 100% {
            opacity: 1;
          }
        }
        
        /* 스크롤바 스타일링 */
        .output-display::-webkit-scrollbar {
          width: 8px;
        }
        
        .output-display::-webkit-scrollbar-track {
          background: #1a1a2e;
        }
        
        .output-display::-webkit-scrollbar-thumb {
          background: #16213e;
          border-radius: 4px;
        }
        
        .output-display::-webkit-scrollbar-thumb:hover {
          background: #0f3460;
        }
      `}</style>
    </div>
  );
};

export default OutputDisplay; 