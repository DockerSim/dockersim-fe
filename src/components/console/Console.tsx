import { useState, useRef, useEffect } from 'react';
import styles from './Console.module.css';
import NetworkTabs from '../terminal/NetworkTabs';

interface DockerNetwork {
  id: string;
  name: string;
  created: Date;
  isActive: boolean;
}

type CommandOutput = {
  id: string;
  command: string;
  result: string;
  timestamp: Date;
  networkId?: string;
};

const Console = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [networks, setNetworks] = useState<DockerNetwork[]>([]);
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  const handleCommand = (command: string) => {
    let result = '';
    const timestamp = new Date();
    const commandId = Date.now().toString();

    if (command === 'help') {
      result = `사용 가능한 도커 명령어:
- docker network create <이름>: 새로운 네트워크 생성
- docker network ls: 네트워크 목록 조회
- docker network rm <이름>: 네트워크 삭제
- docker pull <이미지>: 도커 이미지 다운로드
- docker images: 이미지 목록 조회
- docker run <이미지>: 컨테이너 실행
- docker ps: 실행 중인 컨테이너 목록
- docker stop <컨테이너>: 컨테이너 중지
- clear: 콘솔 내용 지우기`;
    } else if (command === 'clear') {
      setHistory([]);
      return;
    } else if (command.startsWith('docker')) {
      if (command.startsWith('docker network create')) {
        const networkName = command.split(' ').pop() as string;
        const newNetwork: DockerNetwork = {
          id: commandId,
          name: networkName,
          created: timestamp,
          isActive: true
        };
        setNetworks(prev => [...prev, newNetwork]);
        setActiveNetwork(newNetwork.id);
        result = `네트워크 '${networkName}'가 생성되었습니다.`;
      } else if (command === 'docker network ls') {
        if (networks.length === 0) {
          result = '생성된 네트워크가 없습니다.';
        } else {
          result = 'NETWORK ID    NAME    CREATED\n' + 
            networks.map(net => 
              `${net.id.slice(0, 12)}    ${net.name}    ${net.created.toLocaleString()}`
            ).join('\n');
        }
      } else if (command.startsWith('docker network rm')) {
        const networkName = command.split(' ').pop() as string;
        const network = networks.find(n => n.name === networkName);
        if (network) {
          setNetworks(prev => prev.filter(n => n.name !== networkName));
          if (activeNetwork === network.id) {
            setActiveNetwork(null);
          }
          result = `네트워크 '${networkName}'가 삭제되었습니다.`;
        } else {
          result = `네트워크 '${networkName}'를 찾을 수 없습니다.`;
        }
      } else if (command.startsWith('docker pull')) {
        result = '이미지를 다운로드하는 중...';
      } else if (command === 'docker images') {
        result = `REPOSITORY          TAG          IMAGE ID          CREATED          SIZE
ubuntu             latest       1234567890ab      2 hours ago      72.8MB
nginx              latest       0987654321cd      3 days ago       142MB`;
      } else if (command.startsWith('docker run')) {
        const containerName = command.split(' ').pop();
        result = `컨테이너 ${containerName}를 실행하는 중...`;
      } else if (command === 'docker ps') {
        result = `CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS   NAMES
abcdef123456   ubuntu    "/bin/bash"   2 min    Up       80/tcp   my-container`;
      } else if (command.startsWith('docker stop')) {
        const containerName = command.split(' ').pop();
        result = `컨테이너 ${containerName}를 중지하는 중...`;
      } else {
        result = '지원하지 않는 도커 명령어입니다.';
      }
    } else {
      result = `명령어를 찾을 수 없습니다: ${command}\n도움말을 보려면 'help'를 입력하세요.`;
    }

    const historyEntry: CommandOutput = {
      id: commandId,
      command,
      result,
      timestamp,
      networkId: activeNetwork || undefined
    };
    setHistory(prev => [...prev, historyEntry]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleCommand(input.trim());
    setInput('');
  };

  const removeNetwork = (networkId: string) => {
    const network = networks.find(n => n.id === networkId);
    if (network) {
      handleCommand(`docker network rm ${network.name}`);
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [history]);

  const filteredHistory = history.filter(entry => 
    !activeNetwork || entry.networkId === activeNetwork
  );

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        {/* 콘솔 출력 영역 */}
        <div className={styles.consoleOutput} ref={consoleRef}>
          {filteredHistory.map((entry, idx) => (
            <div key={entry.id} className="mb-2">
              <div>$ {entry.command}</div>
              <div style={{ whiteSpace: 'pre-line' }}>{entry.result}</div>
            </div>
          ))}
        </div>

        {/* 명령어 입력 영역 */}
        <div className={styles.inputArea}>
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <span>$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.commandInput}
              placeholder="명령어를 입력하세요..."
            />
          </form>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <NetworkTabs
          networks={networks}
          activeNetwork={activeNetwork}
          onNetworkSelect={setActiveNetwork}
          onNetworkRemove={removeNetwork}
        />
      </div>
    </div>
  );
};

export default Console;
