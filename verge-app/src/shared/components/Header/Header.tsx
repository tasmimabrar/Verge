import type { FC } from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';
import vergeLogoImg from '@/assets/verge_logo.png';

export const Header: FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <img src={vergeLogoImg} alt="Verge" className={styles.logoImage} />
        </Link>

        {/* CTA Buttons */}
        <div className={styles.actions}>
          <Link to="/login" className={styles.signIn}>Sign In</Link>
          <Link to="/login" className={styles.getStarted}>Get Started</Link>
        </div>
      </div>
    </header>
  );
};
