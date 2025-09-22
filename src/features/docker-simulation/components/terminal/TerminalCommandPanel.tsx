import React, { useState } from 'react';
import AddBtn from '@/components/common/BtnCrud/addBtn';
import DeleteBtn from '@/components/common/BtnCrud/deleteBtn';
import StartBtn from '@/components/common/BtnCrud/startBtn';
import StopBtn from '@/components/common/BtnCrud/stopBtn';
import Terminal from '@/components/Terminal';

interface TerminalCommandPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  showCommandButtons?: boolean; // 버튼 표시 여부를 제어하는 prop 추가
}

const TerminalCommandPanel: React.FC<TerminalCommandPanelProps> = ({ 
  isCollapsed, 
  onToggle, 
  showCommandButtons = true // 기본값은 true로 설정하여 기존 코드에 영향 없도록 함
}) => {
  const [command, setCommand] = useState('');

  const handleCommand = (newCommand: string) => {
    setCommand(newCommand);
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="terminal-command-panel">
      {showCommandButtons && (
        <div className="command-buttons">
          <AddBtn onCommand={handleCommand} />
          <DeleteBtn onCommand={handleCommand} />
          <StartBtn onCommand={handleCommand} />
          <StopBtn onCommand={handleCommand} />
        </div>
      )}
      <Terminal initialCommand={command} />
      <button onClick={onToggle} className="panel-toggle-btn">숨기기</button>
    </div>
  );
};

export default TerminalCommandPanel;
