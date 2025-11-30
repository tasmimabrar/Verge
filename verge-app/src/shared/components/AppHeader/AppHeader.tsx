import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiBell, 
  FiUser, 
  FiLogOut,
  FiSettings
} from 'react-icons/fi';
import { useAuth } from '@/shared/hooks';
import styles from './AppHeader.module.css';

export const AppHeader: FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className={styles.appHeader}>
      <div className={styles.container}>
        {/* Search Bar */}
        <div className={styles.searchSection}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search tasks, projects..." 
            className={styles.searchInput}
          />
        </div>

        {/* Right Actions */}
        <div className={styles.actions}>
          {/* Notifications */}
          <button className={styles.iconButton}>
            <FiBell />
            <span className={styles.badge}>3</span>
          </button>

          {/* User Menu */}
          <div className={styles.userMenu}>
            <button className={styles.userButton}>
              <FiUser className={styles.userIcon} />
              <span className={styles.userName}>
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
            </button>

            {/* Dropdown (will be enhanced later) */}
            <div className={styles.dropdown}>
              <button className={styles.dropdownItem}>
                <FiSettings />
                <span>Settings</span>
              </button>
              <button className={styles.dropdownItem} onClick={handleLogout}>
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
