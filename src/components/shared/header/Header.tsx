'use client'

import Link from 'next/link';
import { useState, useMemo } from 'react'; // useMemo 임포트
import { usePathname, useRouter } from 'next/navigation';
import { handleGithubLogin } from '../client/Login';
import { useAuthStore } from '@/store/authStore';
import styles from './Header.module.css';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { isLoggedIn, logout } = useAuthStore();

    // 기본 navItems 배열
    const baseNavItems = [
        { href: '/', label: '학습하기', icon: '🎓' },
        { href: '/community', label: '커뮤니티', icon: '💬' },
        { href: '/faq', label: 'FAQ', icon: '❓' },
        { href: '/settings', label: '내 정보', icon: '👤', requiresAuth: true }, // '내 정보'에 인증 필요 플래그 추가
    ];

    // 로그인 상태에 따라 동적으로 navItems 필터링
    const navItems = useMemo(() => {
        return baseNavItems.filter(item => !item.requiresAuth || isLoggedIn);
    }, [isLoggedIn]);

    const isActive = (path: string) => pathname === path;

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logoContainer}>
                    <div className={styles.logoContent}>
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
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className={styles.authSection}>
                    {isLoggedIn ? (
                        <button className={styles.authBtn} onClick={handleLogout}>로그아웃</button>
                    ) : (
                        <button className={styles.authBtn} onClick={handleGithubLogin}>로그인</button>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button className={styles.mobileMenuBtn} onClick={toggleMenu}>
          <span className={`${styles.hamburger} ${isMenuOpen ? styles.open : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
                </button>
            </div>

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
                                <button className={styles.mobileAuthBtn} onClick={handleLogout}>로그아웃</button>
                            ) : (
                                <button className={styles.mobileAuthBtn} onClick={handleGithubLogin}>로그인</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
