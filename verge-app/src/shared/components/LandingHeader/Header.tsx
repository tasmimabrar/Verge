import type { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';
import { FiLogOut } from 'react-icons/fi';
import styles from './LandingHeader.module.css';
import vergeLogoImg from '@/assets/verge_logo.png';

export const LandingHeader: FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className={styles.logo}>
          <img src={vergeLogoImg} alt="Verge" className={styles.logoImage} />
        </Link>

        {/* CTA Buttons or User Info */}
        <div className={styles.actions}>
          {isAuthenticated ? (
            <>
              <span className={styles.userInfo}>
                {user?.displayName || user?.email}
              </span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                <FiLogOut />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.signIn}>Sign In</Link>
              <Link to="/login" className={styles.getStarted}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
