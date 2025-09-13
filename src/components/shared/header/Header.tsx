'use client'

import styles from './Header.module.css';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { handleGithubLogin } from '../client/Login';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Zustand 스토어에서 로그인 상태와 로그아웃 함수를 가져옵니다.
    const { isLoggedIn, logout } = useAuthStore();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { href: '/', label: '학습하기', icon: '🎓' },
        { href: '/community', label: '커뮤니티', icon: '💬' },
        { href: '/faq', label: 'FAQ', icon: '❓' },
        { href: '/settings', label: '설정', icon: '⚙️' }
    ];

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // 로그아웃 핸들러
    const handleLogout = () => {
        logout();
        router.push('/'); // 로그아웃 후 홈으로 이동
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logoContainer}>
                    <div className={styles.logoContent}>
                        <div className={styles.logoIcon}>🐳</div>
                        <div className={styles.logoText}>
                            <span className={styles.logoTitle}>DOCKERSIM</span>
                            <span className={styles.logoSubtext}>Docker Learning Platform</span>
                        </div>
                    </div>
                </Link>

                <nav className={styles.navigation}>
                    <ul className={styles.navList}>
                        {navItems.map((item) => (
                            <li key={item.href} className={styles.navItem}>
                                <Link 
                                    href={item.href} 
                                    className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
                                >
                                    <span className={styles.navIcon}>{item.icon}</span>
                                    <span className={styles.navLabel}>{item.label}</span>
                                    {isActive(item.href) && <div className={styles.activeIndicator} />}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className={styles.authSection}>
                    {isLoggedIn ? (
                        <button className={styles.signupBtn} onClick={handleLogout}>
                            <span className={styles.btnIcon}>🚀</span>
                            <span>로그아웃</span>
                        </button>
                    ) : (
                        <button className={styles.signupBtn} onClick={handleGithubLogin}>
                            <span className={styles.btnIcon}>🚀</span>
                            <span>로그인</span>
                        </button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button 
                    className={styles.mobileMenuBtn}
                    onClick={toggleMenu}
                >
                    <span className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className={styles.mobileMenu}>
                    <div className={styles.mobileMenuContent}>
                        {navItems.map((item) => (
                            <Link 
                                key={item.href}
                                href={item.href} 
                                className={`${styles.mobileNavLink} ${isActive(item.href) ? styles.active : ''}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                        <div className={styles.mobileAuthSection}>
                            {isLoggedIn ? (
                                <button className={styles.mobileLoginBtn} onClick={handleLogout}>로그아웃</button>
                            ) : (
                                <button className={styles.mobileLoginBtn} onClick={handleGithubLogin}>로그인</button>
                            )}
                            <button className={styles.mobileSignupBtn}>시작하기</button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}