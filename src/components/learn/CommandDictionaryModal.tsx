'use client';

import React from 'react';
import styles from './Modal.module.css';

interface Command {
  id: string;
  category: string;
  command: string;
  description: string;
  example: string;
}

const commands: Command[] = [
  {
    id: '1',
    category: '이미지',
    command: 'docker pull',
    description: '도커 이미지를 다운로드합니다.',
    example: 'docker pull nginx:latest'
  },
  {
    id: '2',
    category: '이미지',
    command: 'docker images',
    description: '로컬에 저장된 도커 이미지 목록을 확인합니다.',
    example: 'docker images'
  },
  {
    id: '3',
    category: '컨테이너',
    command: 'docker run',
    description: '새로운 컨테이너를 생성하고 실행합니다.',
    example: 'docker run -d --name my-nginx -p 80:80 nginx'
  },
  {
    id: '4',
    category: '컨테이너',
    command: 'docker ps',
    description: '실행 중인 컨테이너 목록을 확인합니다.',
    example: 'docker ps'
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CommandDictionaryModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('전체');
  const categories = ['전체', ...new Set(commands.map(cmd => cmd.category))];

  const filteredCommands = selectedCategory === '전체'
    ? commands
    : commands.filter(cmd => cmd.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>명령어 사전</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.categoryList}>
            {categories.map(category => (
              <button
                key={category}
                className={`${styles.categoryButton} ${selectedCategory === category ? styles.selected : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className={styles.commandList}>
            {filteredCommands.map(cmd => (
              <div key={cmd.id} className={styles.commandItem}>
                <h3>{cmd.command}</h3>
                <p className={styles.description}>{cmd.description}</p>
                <div className={styles.example}>
                  <strong>예시:</strong>
                  <code>{cmd.example}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandDictionaryModal; 