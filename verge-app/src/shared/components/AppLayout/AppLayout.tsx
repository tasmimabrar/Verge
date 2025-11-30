import type { FC, ReactNode } from 'react';
import { Sidebar } from '../Sidebar';
import { AppHeader } from '../AppHeader';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className={styles.appLayout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <AppHeader />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};
