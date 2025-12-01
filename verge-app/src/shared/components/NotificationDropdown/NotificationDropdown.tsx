import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FiBell, 
  FiAlertCircle, 
  FiClock, 
  FiX,
  FiCheck,
  FiAlertTriangle
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

export const NotificationDropdown: FC<NotificationDropdownProps> = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: notifications = [], isLoading } = useNotifications(user?.uid || '');
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reminder':
        return <FiClock className={styles.iconReminder} />;
      case 'overdue':
        return <FiAlertCircle className={styles.iconOverdue} />;
      case 'conflict':
        return <FiAlertTriangle className={styles.iconConflict} />;
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
        {unreadCount > 0 && (
          <button
            className={styles.markAllButton}
            onClick={handleMarkAllAsRead}
          >
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <Loader variant="component" />
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <EmptyState
              title="No notifications"
              message="You're all caught up!"
              icon={<FiBell />}
            />
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((notification) => (
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
      {notifications.length > 0 && (
        <div className={styles.footer}>
          <span className={styles.footerText}>
            {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};
