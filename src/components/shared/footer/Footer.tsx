import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.section}>
          <h3>Docker Simulator</h3>
          <p>Docker 학습을 위한 시뮬레이터</p>
        </div>
        
        <div className={styles.section}>
          <h4>링크</h4>
          <ul>
            <li><a href="/">홈</a></li>
            <li><a href="/community">커뮤니티</a></li>
            <li><a href="/settings">설정</a></li>
          </ul>
        </div>
        
        <div className={styles.section}>
          <h4>도움말</h4>
          <ul>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/docs">문서</a></li>
            <li><a href="/support">지원</a></li>
          </ul>
        </div>
      </div>
      
      <div className={styles.bottom}>
        <p>&copy; {currentYear} Docker Simulator. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 