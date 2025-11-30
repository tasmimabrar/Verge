import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FiGrid, 
  FiFolder, 
  FiCheckSquare, 
  FiCalendar, 
  FiSettings,
  FiPieChart
} from 'react-icons/fi';
import styles from './Sidebar.module.css';
import vergeLogoImg from '@/assets/verge_logo.png';

interface NavItem {
  to: string;
  icon: typeof FiGrid;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/projects', icon: FiFolder, label: 'Projects' },
  { to: '/tasks', icon: FiCheckSquare, label: 'Tasks' },
  { to: '/calendar', icon: FiCalendar, label: 'Calendar' },
  { to: '/analytics', icon: FiPieChart, label: 'Analytics' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
];

export const Sidebar: FC = () => {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <img src={vergeLogoImg} alt="Verge" className={styles.logo} />
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <item.icon className={styles.navIcon} />
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer section for future use (version, help, etc.) */}
      <div className={styles.footer}>
        <div className={styles.version}>Deployed Build</div>
      </div>
    </aside>
  );
};
