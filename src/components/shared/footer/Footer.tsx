'use client'

import styles from './Footer.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Footer() {
    const pathname = usePathname();
    
    // 게시판, FAQ, 설정 페이지에만 푸터 표시
    const showFooter = 
        pathname.includes('/src/features/board') || 
        pathname.includes('/src/features/faq') || 
        pathname.includes('/src/features/settings');
    
    if (!showFooter) return null;
    
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                
                <div className={styles.footerContent}>
                    <div className={styles.footerSection}>
                        <h4 className={styles.footerTitle}>DockerSim</h4>
                        <p className={styles.footerText}>DockerSim 튜토리얼을 통해 쉽고 빠르게 학습하세요.</p>
                        <p className={styles.footerText}>DockerSim 시뮬레이션을 통해 실무 적용 전 쉽고 빠르게 연습해 보세요.</p>
                    </div>
                    
                    <div className={styles.footerSection}>
                        <p className={styles.footerDescription}>다양한 환경에서 인프라 설계를 위한 정형화된 방법을 제공하고, 가상 시뮬레이션을 통해 이론과 실습 경험을 쌓을 수 있도록 지원합니다.</p>
                    </div>
                </div>
                
                <div className={styles.footerBottom}>
                    <p className={styles.copyright}>© 2025 DockerSim. All rights reserved.</p>
                    <div className={styles.socialLinks}>
                        <a href="#" className={styles.socialLink} aria-label="GitHub">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                            </svg>
                        </a>
                        <a href="#" className={styles.socialLink} aria-label="Twitter">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
} 