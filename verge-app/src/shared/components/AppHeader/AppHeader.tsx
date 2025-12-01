import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiBell, 
  FiUser, 
  FiLogOut,
  FiSettings,
  FiMoon,
  FiSun,
  FiZap
} from 'react-icons/fi';
import { useAuth } from '@/shared/hooks';
import { useTheme } from '@/shared/contexts';
import { Dropdown, ViewToggle, SearchModal } from '@/shared/components';
import { QuickActions } from '@/features/dashboard/components/QuickActions';
import styles from './AppHeader.module.css';

export const AppHeader: FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className={styles.appHeader}>
      <div className={styles.container}>
        {/* Search Bar */}
        <div className={styles.searchSection} onClick={() => setIsSearchOpen(true)}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search tasks, projects..." 
            className={styles.searchInput}
            readOnly
          />
        </div>

        {/* Search Modal */}
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        {/* View Toggle */}
        <ViewToggle />

        {/* Right Actions */}
        <div className={styles.actions}>
          {/* Quick Actions */}
          <div className={styles.quickActionsWrapper}>
            <button 
              className={`${styles.quickActionsButton} ${isQuickActionsOpen ? styles.active : ''}`}
              onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
              aria-label="Quick Actions"
            >
              <FiZap />
            </button>
            <Dropdown
              isOpen={isQuickActionsOpen}
              onClose={() => setIsQuickActionsOpen(false)}
              align="right"
            >
              <QuickActions onActionClick={() => setIsQuickActionsOpen(false)} />
            </Dropdown>
          </div>

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

            {/* Dropdown */}
            <div className={styles.dropdown}>
              <button className={styles.dropdownItem} onClick={toggleTheme}>
                {theme === 'dark' ? <FiSun /> : <FiMoon />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button className={styles.dropdownItem} onClick={handleSettingsClick}>
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
