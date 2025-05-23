'use client';

import React, { useState } from 'react';
import styles from './Modal.module.css';

interface Command {
  id: string;
  category: string;
  command: string;
  description: string;
  example: string;
  options?: string[];
}

const commands: Command[] = [
  {
    id: '1',
    category: '이미지',
    command: 'docker pull',
    description: '도커 이미지를 다운로드합니다.',
    example: 'docker pull nginx:latest',
    options: [
      '-a, --all-tags: 저장소의 모든 태그를 다운로드합니다.',
      '--disable-content-trust: 이미지 검증을 건너뜁니다. (기본값: true)'
    ]
  },
  {
    id: '2',
    category: '이미지',
    command: 'docker images',
    description: '로컬에 저장된 도커 이미지 목록을 확인합니다.',
    example: 'docker images',
    options: [
      '-a, --all: 모든 이미지를 보여줍니다. (중간 이미지 포함)',
      '--digests: 다이제스트를 보여줍니다.',
      '--no-trunc: 출력을 자르지 않습니다.'
    ]
  },
  {
    id: '3',
    category: '이미지',
    command: 'docker rmi',
    description: '하나 이상의 이미지를 삭제합니다.',
    example: 'docker rmi nginx:latest',
    options: [
      '-f, --force: 이미지를 강제로 삭제합니다.',
      '--no-prune: 태그되지 않은 상위 항목을 삭제하지 않습니다.'
    ]
  },
  {
    id: '4',
    category: '컨테이너',
    command: 'docker create',
    description: '새 컨테이너를 생성합니다.',
    example: 'docker create con1',
    options: [
      '--name: 컨테이너 이름을 지정합니다.',
      '-p, --publish: 호스트와 컨테이너 간의 포트 매핑을 설정합니다.',
      '-v, --volume: 볼륨을 마운트합니다.'
    ]
  },
  {
    id: '5',
    category: '컨테이너',
    command: 'docker run',
    description: '새로운 컨테이너를 생성하고 실행합니다.',
    example: 'docker run -d --name my-container nginx',
    options: [
      '-d, --detach: 백그라운드에서 컨테이너를 실행하고 컨테이너 ID를 출력합니다.',
      '--name: 컨테이너 이름을 지정합니다.',
      '-p, --publish: 호스트와 컨테이너 간의 포트 매핑을 설정합니다.'
    ]
  },
  {
    id: '6',
    category: '컨테이너',
    command: 'docker ps',
    description: '실행 중인 컨테이너 목록을 확인합니다.',
    example: 'docker ps',
    options: [
      '-a, --all: 모든 컨테이너를 보여줍니다. (기본값은 실행 중인 것만)',
      '-q, --quiet: 컨테이너 ID만 표시합니다.',
      '--no-trunc: 출력을 자르지 않습니다.'
    ]
  },
  {
    id: '7',
    category: '볼륨',
    command: 'docker volume create',
    description: '볼륨을 생성합니다.',
    example: 'docker volume create my-vol',
    options: [
      '--driver: 볼륨 드라이버 이름을 지정합니다.',
      '--label: 볼륨에 메타데이터를 설정합니다.',
      '--name: 볼륨 이름을 지정합니다.'
    ]
  },
  {
    id: '8',
    category: '볼륨',
    command: 'docker volume ls',
    description: '볼륨 목록을 표시합니다.',
    example: 'docker volume ls',
    options: [
      '-q, --quiet: 볼륨 이름만 표시합니다.',
      '--filter: 제공된 조건에 따라 출력을 필터링합니다.'
    ]
  },
  {
    id: '9',
    category: '네트워크',
    command: 'docker network create',
    description: '새 네트워크를 생성합니다.',
    example: 'docker network create my-net',
    options: [
      '--driver: 네트워크 드라이버를 지정합니다.',
      '--subnet: 서브넷을 CIDR 형식으로 지정합니다.',
      '--gateway: 게이트웨이를 지정합니다.'
    ]
  },
  {
    id: '10',
    category: '네트워크',
    command: 'docker network ls',
    description: '네트워크 목록을 표시합니다.',
    example: 'docker network ls',
    options: [
      '--filter: 제공된 조건에 따라 출력을 필터링합니다.',
      '-q, --quiet: 네트워크 ID만 표시합니다.'
    ]
  },
  {
    id: '11',
    category: '빌드',
    command: 'docker build',
    description: 'Dockerfile에서 이미지를 빌드합니다.',
    example: 'docker build -t my-image .',
    options: [
      '-t, --tag: 이미지 이름 및 태그를 지정합니다.',
      '--no-cache: 빌드 중 캐시를 사용하지 않습니다.',
      '--pull: 항상 최신 버전의 이미지를 가져옵니다.'
    ]
  },
  {
    id: '12',
    category: '시스템',
    command: 'docker info',
    description: '전체 시스템 정보를 표시합니다.',
    example: 'docker info',
    options: [
      '--format: Go 템플릿을 사용하여 출력 형식을 지정합니다.'
    ]
  },
  {
    id: '13',
    category: '시스템',
    command: 'docker stats',
    description: '실행 중인 컨테이너의 리소스 사용량 통계를 표시합니다.',
    example: 'docker stats',
    options: [
      '--all: 모든 컨테이너를 보여줍니다. (기본값은 실행 중인 것만)',
      '--format: Go 템플릿을 사용하여 출력 형식을 지정합니다.',
      '--no-stream: 첫 번째 결과만 표시하고 종료합니다.'
    ]
  },
  {
    id: '14',
    category: '구성',
    command: 'docker config create',
    description: '설정을 생성합니다.',
    example: 'docker config create my-config config.json',
    options: [
      '--label: 설정에 메타데이터를 설정합니다.'
    ]
  },
  {
    id: '15',
    category: '컨테이너',
    command: 'docker start',
    description: '중지된 컨테이너를 시작합니다.',
    example: 'docker start my-container',
    options: [
      '-a, --attach: 표준 출력/표준 오류를 연결합니다.',
      '-i, --interactive: 컨테이너의 표준 입력에 연결합니다.'
    ]
  },
  {
    id: '16',
    category: '컨테이너',
    command: 'docker stop',
    description: '실행 중인 컨테이너를 중지합니다.',
    example: 'docker stop my-container',
    options: [
      '-t, --time: 컨테이너가 종료되기 전 대기하는 시간(초)입니다. (기본값: 10)'
    ]
  },
  {
    id: '17',
    category: '컨테이너',
    command: 'docker restart',
    description: '컨테이너를 다시 시작합니다.',
    example: 'docker restart my-container',
    options: [
      '-t, --time: 컨테이너가 종료되기 전 대기하는 시간(초)입니다. (기본값: 10)'
    ]
  },
  {
    id: '18',
    category: '컨테이너',
    command: 'docker exec',
    description: '실행 중인 컨테이너에서 명령을 실행합니다.',
    example: 'docker exec -it my-container bash',
    options: [
      '-d, --detach: 백그라운드에서 명령을 실행합니다.',
      '-i, --interactive: 표준 입력을 열어둡니다.',
      '-t, --tty: 가상 TTY를 할당합니다.',
      '-w, --workdir: 컨테이너 내의 작업 디렉토리를 설정합니다.'
    ]
  },
  {
    id: '19',
    category: '컨테이너',
    command: 'docker rm',
    description: '하나 이상의 컨테이너를 제거합니다.',
    example: 'docker rm my-container',
    options: [
      '-f, --force: 실행 중인 컨테이너를 강제로 제거합니다.',
      '-v, --volumes: 컨테이너에 연결된 익명 볼륨을 제거합니다.'
    ]
  },
  {
    id: '20',
    category: '컨테이너',
    command: 'docker logs',
    description: '컨테이너의 로그를 가져옵니다.',
    example: 'docker logs my-container',
    options: [
      '-f, --follow: 로그 출력을 계속 따릅니다.',
      '--tail: 마지막 n개의 로그 라인을 표시합니다.',
      '--timestamps: 타임스탬프를 표시합니다.'
    ]
  },
  {
    id: '21',
    category: '네트워크',
    command: 'docker network connect',
    description: '컨테이너를 네트워크에 연결합니다.',
    example: 'docker network connect my-network my-container',
    options: [
      '--ip: IPv4 주소를 지정합니다.',
      '--alias: 네트워크 스코프 별칭을 추가합니다.'
    ]
  },
  {
    id: '22',
    category: '네트워크',
    command: 'docker network disconnect',
    description: '컨테이너를 네트워크에서 연결 해제합니다.',
    example: 'docker network disconnect my-network my-container',
    options: [
      '-f, --force: 컨테이너가 실행 중이 아니더라도 강제로 연결을 해제합니다.'
    ]
  },
  {
    id: '23',
    category: '네트워크',
    command: 'docker network inspect',
    description: '하나 이상의 네트워크에 대한 자세한 정보를 표시합니다.',
    example: 'docker network inspect my-network',
    options: [
      '--format: Go 템플릿을 사용하여 출력 형식을 지정합니다.'
    ]
  },
  {
    id: '24',
    category: '네트워크',
    command: 'docker network rm',
    description: '하나 이상의 네트워크를 제거합니다.',
    example: 'docker network rm my-network',
    options: []
  },
  {
    id: '25',
    category: '볼륨',
    command: 'docker volume rm',
    description: '하나 이상의 볼륨을 제거합니다.',
    example: 'docker volume rm my-volume',
    options: [
      '-f, --force: 볼륨을 강제로 제거합니다.'
    ]
  },
  {
    id: '26',
    category: '볼륨',
    command: 'docker volume inspect',
    description: '하나 이상의 볼륨에 대한 자세한 정보를 표시합니다.',
    example: 'docker volume inspect my-volume',
    options: [
      '--format: Go 템플릿을 사용하여 출력 형식을 지정합니다.'
    ]
  },
  {
    id: '27',
    category: '볼륨',
    command: 'docker volume prune',
    description: '사용되지 않는 모든 볼륨을 제거합니다.',
    example: 'docker volume prune',
    options: [
      '--filter: 제공된 조건에 따라 볼륨을 필터링합니다.',
      '-f, --force: 확인 프롬프트를 표시하지 않습니다.'
    ]
  },
  {
    id: '28',
    category: '이미지',
    command: 'docker search',
    description: 'Docker Hub에서 이미지를 검색합니다.',
    example: 'docker search nginx',
    options: [
      '--filter: 결과에 필터를 적용합니다.',
      '--limit: 결과의 최대 개수를 제한합니다. (기본값: 25)',
      '--no-trunc: 출력을 자르지 않습니다.'
    ]
  },
  {
    id: '29',
    category: '이미지',
    command: 'docker tag',
    description: '소스 이미지에 대상 이미지 태그를 생성합니다.',
    example: 'docker tag nginx:latest myregistry/nginx:v1',
    options: []
  },
  {
    id: '30',
    category: '시스템',
    command: 'docker system prune',
    description: '사용되지 않는 데이터를 정리합니다.',
    example: 'docker system prune',
    options: [
      '-a, --all: 사용되지 않는 이미지를 제거합니다.',
      '--volumes: 사용되지 않는 볼륨을 제거합니다.',
      '-f, --force: 확인 프롬프트를 표시하지 않습니다.'
    ]
  },
  {
    id: '31',
    category: '시스템',
    command: 'docker system df',
    description: '도커의 디스크 사용량을 표시합니다.',
    example: 'docker system df',
    options: [
      '-v, --verbose: 자세한 정보를 표시합니다.'
    ]
  },
  {
    id: '32',
    category: '시스템',
    command: 'docker inspect',
    description: '도커 객체에 대한 세부 정보를 표시합니다.',
    example: 'docker inspect my-container',
    options: [
      '-f, --format: Go 템플릿을 사용하여 출력 형식을 지정합니다.',
      '--type: 검사할 객체 유형을 지정합니다. (container|image|node|network|service|volume|task|plugin)'
    ]
  },
  {
    id: '33',
    category: '컴포즈',
    command: 'docker-compose up',
    description: '서비스를 생성하고 시작합니다.',
    example: 'docker-compose up -d',
    options: [
      '-d, --detach: 백그라운드에서 컨테이너를 실행합니다.',
      '--build: 서비스를 시작하기 전에 이미지를 빌드합니다.',
      '--no-deps: 연결된 서비스를 시작하지 않습니다.'
    ]
  },
  {
    id: '34',
    category: '컴포즈',
    command: 'docker-compose down',
    description: '서비스를 중지하고 제거합니다.',
    example: 'docker-compose down',
    options: [
      '--volumes: 선언된 볼륨을 제거합니다.',
      '--rmi: 이미지를 제거합니다. (all|local)',
      '-v, --volumes: 네임드 볼륨과 익명 볼륨을 제거합니다.'
    ]
  },
  {
    id: '35',
    category: '컴포즈',
    command: 'docker-compose logs',
    description: '서비스의 로그를 출력합니다.',
    example: 'docker-compose logs',
    options: [
      '-f, --follow: 로그 출력을 계속 따릅니다.',
      '--tail: 각 서비스의 마지막 n개의 로그 라인을 표시합니다.',
      '-t, --timestamps: 타임스탬프를 표시합니다.'
    ]
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CommandDictionaryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('컨테이너');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);
  
  // 카테고리 목록을 추출합니다
  const categories = [...new Set(commands.map(cmd => cmd.category))];
  
  // 선택된 카테고리에 해당하는 명령어를 필터링합니다
  const filteredCommands = commands.filter(cmd => cmd.category === selectedCategory);
  
  // 모달이 열려있지 않으면 렌더링하지 않습니다
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.commandDictionaryModal}`}>
        <div className={styles.modalHeader}>
          <h2>명령어 사전</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.commandDictionaryLayout}>
            {/* 왼쪽 카테고리 사이드바 */}
            <div className={styles.categorySidebar}>
              {categories.map(category => (
                <button
                  key={category}
                  className={`${styles.categoryButton} ${selectedCategory === category ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedCommand(null);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* 오른쪽 컨텐츠 영역 */}
            <div className={styles.commandContentArea}>
              {selectedCommand ? (
                // 선택된 명령어의 상세 정보
                <div className={styles.commandDetail}>
                  <h3>{selectedCommand.command}</h3>
                  <p className={styles.description}>{selectedCommand.description}</p>
                  
                  <div className={styles.exampleSection}>
                    <h4>실행</h4>
                    <div className={styles.example}>
                      <code>{selectedCommand.example}</code>
                      <button className={styles.copyButton} onClick={() => navigator.clipboard.writeText(selectedCommand.example)}>
                        {/* Copy 아이콘 */}
                        <span>복사</span>
                      </button>
                    </div>
                  </div>
                  
                  {selectedCommand.options && selectedCommand.options.length > 0 && (
                    <div className={styles.optionsSection}>
                      <h4>옵션</h4>
                      <ul className={styles.optionsList}>
                        {selectedCommand.options.map((option, index) => (
                          <li key={index}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <button 
                    className={styles.backButton}
                    onClick={() => setSelectedCommand(null)}
                  >
                    ← 명령어 목록으로 돌아가기
                  </button>
                </div>
              ) : (
                // 명령어 목록
                <div>
                  <h3>{selectedCategory}</h3>
                  <p>도커 {selectedCategory}를 생성합니다.</p>
                  
                  <div className={styles.commandList}>
                    {filteredCommands.map(cmd => (
                      <div 
                        key={cmd.id} 
                        className={styles.commandItem}
                        onClick={() => setSelectedCommand(cmd)}
                      >
                        <h3>{cmd.command}</h3>
                        <p className={styles.description}>{cmd.description}</p>
                        <div className={styles.example}>
                          <code>{cmd.example}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandDictionaryModal; 