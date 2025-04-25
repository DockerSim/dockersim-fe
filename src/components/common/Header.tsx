'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/">
          DOCKERSIM
        </Link>
      </div>
      <nav className={styles.nav}>
        <Link 
          href="/" 
          className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
        >
          학습
        </Link>
        <Link 
          href="/workspace" 
          className={`${styles.navLink} ${isActive('/workspace') ? styles.active : ''}`}
        >
          작업
        </Link>
        <Link 
          href="/board" 
          className={`${styles.navLink} ${isActive('/board') ? styles.active : ''}`}
        >
          게시판
        </Link>
        <Link 
          href="/questions" 
          className={`${styles.navLink} ${isActive('/questions') ? styles.active : ''}`}
        >
          자주 묻는 질문
        </Link>
        <Link 
          href="/settings" 
          className={`${styles.navLink} ${isActive('/settings') ? styles.active : ''}`}
        >
          설정
        </Link>
      </nav>
    </header>
  );
};

export default Header; 