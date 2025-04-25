'use client';

import React from 'react';
import Header from '@/components/common/Header';
import Terminal from '@/components/terminal/Terminal';
import LevelSelectModal from '@/components/learn/LevelSelectModal';
import ContainerListModal from '@/components/learn/ContainerListModal';
import CommandDictionaryModal from '@/components/learn/CommandDictionaryModal';
import styles from './page.module.css';

export default function Home() {
  const [isLevelModalOpen, setIsLevelModalOpen] = React.useState(false);
  const [isContainerListModalOpen, setIsContainerListModalOpen] = React.useState(false);
  const [isCommandDictModalOpen, setIsCommandDictModalOpen] = React.useState(false);

  return (
    <div className={styles.container}>
      <Header />

      <LevelSelectModal 
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
      />
      <ContainerListModal 
        isOpen={isContainerListModalOpen}
        onClose={() => setIsContainerListModalOpen(false)}
      />
      <CommandDictionaryModal 
        isOpen={isCommandDictModalOpen}
        onClose={() => setIsCommandDictModalOpen(false)}
      />

      <main className={styles.main}>
        <Terminal />
      </main>
    </div>
  );
}
