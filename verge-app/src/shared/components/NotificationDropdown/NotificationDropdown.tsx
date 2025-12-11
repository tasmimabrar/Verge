import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FiBell, 
  FiAlertCircle, 
  FiClock, 
  FiX,
  FiCheck
} from 'react-icons/fi';
import { useAuth } from '@/shared/hooks';
import { 
  useNotifications, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead,
  useDeleteNotification 
} from '@/shared/hooks';
import { Loader, EmptyState } from '@/shared/components';
import { toast } from 'sonner';
import styles from './NotificationDropdown.module.css';
import type { Notification } from '@/shared/types';

interface NotificationDropdownProps {
  onClose: () => void;
}

type NotificationFilter = 'all' | 'reminder' | 'overdue' | 'summary';

export const NotificationDropdown: FC<NotificationDropdownProps> = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  
  const { data: notifications = [], isLoading } = useNotifications(user?.uid || '');
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  
  // Filter notifications based on selected filter
  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reminder':
        return <FiClock className={styles.iconReminder} />;
      case 'overdue':
        return <FiAlertCircle className={styles.iconOverdue} />;
      case 'summary':
        return <FiBell className={styles.iconSummary} />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
    
    // Navigate to link if provided
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllAsRead.mutateAsync(user.uid);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    
    try {
      await deleteNotification.mutateAsync(notificationId);
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

  return (
    <div className={styles.dropdown}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <FiBell />
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount}</span>
          )}
        </div>
        {filteredUnreadCount > 0 && (
          <button
            className={styles.markAllButton}
            onClick={handleMarkAllAsRead}
          >
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All
          {unreadCount > 0 && <span className={styles.filterBadge}>{unreadCount}</span>}
        </button>
        <button
          className={`${styles.filterTab} ${filter === 'reminder' ? styles.active : ''}`}
          onClick={() => setFilter('reminder')}
        >
          <FiClock className={styles.filterIcon} />
          Reminders
        </button>
        <button
          className={`${styles.filterTab} ${filter === 'overdue' ? styles.active : ''}`}
          onClick={() => setFilter('overdue')}
        >
          <FiAlertCircle className={styles.filterIcon} />
          Overdue
        </button>
        <button
          className={`${styles.filterTab} ${filter === 'summary' ? styles.active : ''}`}
          onClick={() => setFilter('summary')}
        >
          <FiBell className={styles.filterIcon} />
          Summary
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <Loader variant="component" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={styles.empty}>
            <EmptyState
              title={filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
              message={filter === 'all' ? "You're all caught up!" : `No ${filter} notifications at the moment.`}
              icon={<FiBell />}
            />
          </div>
        ) : (
          <div className={styles.list}>
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.iconWrapper}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className={styles.notificationContent}>
                  <div className={styles.notificationHeader}>
                    <h4 className={styles.notificationTitle}>{notification.title}</h4>
                    {!notification.read && (
                      <div className={styles.unreadDot} />
                    )}
                  </div>
                  <p className={styles.notificationMessage}>{notification.message}</p>
                  <span className={styles.notificationTime}>
                    {format(notification.createdAt.toDate(), 'MMM dd, yyyy h:mm a')}
                  </span>
                </div>

                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleDelete(e, notification.id)}
                  aria-label="Delete notification"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className={styles.footer}>
          <span className={styles.footerText}>
            {filteredNotifications.length} {filter === 'all' ? 'total' : filter} notification{filteredNotifications.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};
