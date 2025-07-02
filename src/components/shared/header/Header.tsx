'use client'

import styles from './Header.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react'; // 설정(로그인/비로그인)을 위한 상태

export default function Header() {

/*    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const handleSettingClick = () => {
        if (isLoggedIn) {
            window.location.href = '/src/features/settings';
        } else {
            alert('GitHub 로그인 페이지로 이동합니다.');
            window.location.href = 'https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID&scope=user';
        }
    };*/

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logoContainer}>
                    <Image
                        src="/images/dockersim_1.png"
                        width={150}
                        height={40}
                        alt="dockersim Logo"
                        priority
                    />
                </Link>

                <nav className={styles.navigation}>
                    <ul className={styles.navList}>
                        <li className={styles.navItem}>
                            <Link href="/tutorial" className={styles.navLink}>학습하기</Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link href="/simulation" className={styles.navLink}>작업하기</Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link href="/src/features/board" className={styles.navLink}>커뮤니티</Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link href="/src/features/faq" className={styles.navLink}>자주 묻는 질문</Link>
                        </li>
                        <li className={styles.navItem}>
                            <Link href="/src/features/settings" className={styles.navLink}>설정</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}