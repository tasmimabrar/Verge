import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  FiMoon, 
  FiSun, 
  FiZap, 
  FiBell, 
  FiEye, 
  FiUser, 
  FiLogOut,
  FiArrowLeft
} from 'react-icons/fi';
// Removed Card and Button - using custom layout
import { useAuth } from '@/shared/hooks/useAuth';
import { useTheme } from '@/shared/contexts';
import { updateUserSettings, getUserSettings } from '@/lib/firebase/firestore';
import type { UserSettings } from '@/shared/types';
import styles from './Settings.module.css';

type SettingsSection = 'profile' | 'appearance' | 'features' | 'notifications' | 'preferences';

/**
 * Settings Component
 * 
 * Comprehensive settings screen with sidebar navigation (ClickUp-style).
 * No AppLayout wrapper - standalone full-screen layout.
 */
export const Settings: FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  
  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    theme: theme as 'light' | 'dark',
    aiEnabled: true,
    collaborationEnabled: false,
    notifications: {
      deadlineReminders: true,
      dailySummary: false,
      conflictAlerts: true,
    },
    defaultView: 'dashboard',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  // Load user settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        const userSettings = await getUserSettings(user.uid);
        if (userSettings) {
          setSettings(userSettings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Debounced auto-save
  useEffect(() => {
    if (isLoading) return;

    const timeoutId = setTimeout(async () => {
      if (!user) return;

      setIsSaving(true);
      try {
        await updateUserSettings(user.uid, settings);
        // Removed toast to avoid spam
      } catch (error) {
        console.error('Failed to save settings:', error);
        toast.error('Failed to save settings');
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [settings, user, isLoading]);

  const handleThemeToggle = () => {
    toggleTheme();
    setSettings(prev => ({
      ...prev,
      theme: theme === 'light' ? 'dark' : 'light',
    }));
  };

  const handleToggle = (key: keyof Omit<UserSettings, 'notifications' | 'defaultView'>) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNotificationToggle = (key: keyof UserSettings['notifications']) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleDefaultViewChange = (view: UserSettings['defaultView']) => {
    setSettings(prev => ({
      ...prev,
      defaultView: view,
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className={styles.settingsContainer}>
        <div className={styles.loadingState}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      {/* Settings Sidebar */}
      <aside className={styles.settingsSidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.backButton} onClick={handleBackToDashboard}>
            <FiArrowLeft />
            <span>Back to Workspace</span>
          </button>
        </div>

        <div className={styles.sidebarSection}>
          <h3 className={styles.sidebarSectionTitle}>MY SETTINGS</h3>
          <nav className={styles.sidebarNav}>
            <button
              className={`${styles.sidebarNavItem} ${activeSection === 'profile' ? styles.active : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              <FiUser />
              <span>Profile</span>
            </button>
            <button
              className={`${styles.sidebarNavItem} ${activeSection === 'appearance' ? styles.active : ''}`}
              onClick={() => setActiveSection('appearance')}
            >
              {theme === 'light' ? <FiSun /> : <FiMoon />}
              <span>Appearance</span>
            </button>
            <button
              className={`${styles.sidebarNavItem} ${activeSection === 'features' ? styles.active : ''}`}
              onClick={() => setActiveSection('features')}
            >
              <FiZap />
              <span>Features</span>
            </button>
            <button
              className={`${styles.sidebarNavItem} ${activeSection === 'notifications' ? styles.active : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <FiBell />
              <span>Notifications</span>
            </button>
            <button
              className={`${styles.sidebarNavItem} ${activeSection === 'preferences' ? styles.active : ''}`}
              onClick={() => setActiveSection('preferences')}
            >
              <FiEye />
              <span>Preferences</span>
            </button>
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <FiLogOut />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Settings Content */}
      <main className={styles.settingsContent}>
        <div className={styles.contentHeader}>
          <div>
            <h1 className={styles.contentTitle}>
              {activeSection === 'profile' && 'Profile'}
              {activeSection === 'appearance' && 'Appearance'}
              {activeSection === 'features' && 'Features'}
              {activeSection === 'notifications' && 'Notification Settings'}
              {activeSection === 'preferences' && 'Preferences'}
            </h1>
            {activeSection === 'notifications' && (
              <p className={styles.contentSubtitle}>
                <a href="#" className={styles.learnMore}>Learn more</a> about customizing your notifications.
              </p>
            )}
          </div>
          {isSaving && <span className={styles.savingIndicator}>Saving...</span>}
        </div>

        <div className={styles.contentBody}>
          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className={styles.section}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="displayName" className={styles.label}>
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    className={styles.input}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    value={user?.email || ''}
                    disabled
                  />
                  <span className={styles.helpText}>Email cannot be changed</span>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <div className={styles.section}>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Theme</h3>
                  <p className={styles.settingDescription}>
                    Switch between light and dark mode
                  </p>
                </div>
                <button
                  className={`${styles.toggle} ${theme === 'dark' ? styles.toggleActive : ''}`}
                  onClick={handleThemeToggle}
                  aria-label="Toggle theme"
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>

              <div className={styles.themePreview}>
                Current theme: <strong>{theme === 'light' ? 'Light' : 'Dark'} Mode</strong>
              </div>
            </div>
          )}

          {/* Features Section */}
          {activeSection === 'features' && (
            <div className={styles.section}>
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>AI Assist</h3>
                  <p className={styles.settingDescription}>
                    Enable AI-powered task suggestions and priority recommendations
                  </p>
                </div>
                <button
                  className={`${styles.toggle} ${settings.aiEnabled ? styles.toggleActive : ''}`}
                  onClick={() => handleToggle('aiEnabled')}
                  aria-label="Toggle AI Assist"
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingLabel}>Collaboration Tools</h3>
                  <p className={styles.settingDescription}>
                    Show features for team collaboration and task assignment
                  </p>
                </div>
                <button
                  className={`${styles.toggle} ${settings.collaborationEnabled ? styles.toggleActive : ''}`}
                  onClick={() => handleToggle('collaborationEnabled')}
                  aria-label="Toggle Collaboration"
                >
                  <span className={styles.toggleSlider} />
                </button>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className={styles.section}>
              <div className={styles.notificationGroup}>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingLabel}>Deadline Reminders</h3>
                    <p className={styles.settingDescription}>
                      Get notified before task deadlines
                    </p>
                  </div>
                  <button
                    className={`${styles.toggle} ${settings.notifications.deadlineReminders ? styles.toggleActive : ''}`}
                    onClick={() => handleNotificationToggle('deadlineReminders')}
                    aria-label="Toggle Deadline Reminders"
                  >
                    <span className={styles.toggleSlider} />
                  </button>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingLabel}>Daily Summary</h3>
                    <p className={styles.settingDescription}>
                      Receive a summary of tasks and progress each day
                    </p>
                  </div>
                  <button
                    className={`${styles.toggle} ${settings.notifications.dailySummary ? styles.toggleActive : ''}`}
                    onClick={() => handleNotificationToggle('dailySummary')}
                    aria-label="Toggle Daily Summary"
                  >
                    <span className={styles.toggleSlider} />
                  </button>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h3 className={styles.settingLabel}>Conflict Alerts</h3>
                    <p className={styles.settingDescription}>
                      Get alerted about overlapping deadlines and scheduling conflicts
                    </p>
                  </div>
                  <button
                    className={`${styles.toggle} ${settings.notifications.conflictAlerts ? styles.toggleActive : ''}`}
                    onClick={() => handleNotificationToggle('conflictAlerts')}
                    aria-label="Toggle Conflict Alerts"
                  >
                    <span className={styles.toggleSlider} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Section */}
          {activeSection === 'preferences' && (
            <div className={styles.section}>
              <div className={styles.formGroup}>
                <label htmlFor="defaultView" className={styles.label}>
                  Default View
                </label>
                <p className={styles.settingDescription}>
                  Choose your default landing page
                </p>
                <select
                  id="defaultView"
                  className={styles.select}
                  value={settings.defaultView}
                  onChange={(e) => handleDefaultViewChange(e.target.value as UserSettings['defaultView'])}
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="tasks">Tasks List</option>
                  <option value="projects">Projects List</option>
                  <option value="calendar">Calendar</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
