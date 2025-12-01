import type { FC } from 'react';
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { AppLayout, Button, Card, Loader, EmptyState, TaskCard } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useTasks } from '@/shared/hooks/useTasks';
import { toDate } from '@/shared/utils/dateHelpers';
import type { Task } from '@/shared/types';
import styles from './Calendar.module.css';

/**
 * Calendar Component
 * 
 * Monthly calendar view showing tasks as priority-colored dots.
 * Core HCI requirement - 80% of survey respondents valued calendar view.
 * 
 * Features:
 * - Monthly grid layout (7 columns x 5-6 rows)
 * - Tasks shown as colored dots (red=high, yellow=medium, green=low)
 * - Click date to view tasks in side panel
 * - Month navigation (prev/next arrows, today button)
 * - Click task to navigate to detail
 */
export const Calendar: FC = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch all user tasks
  const { data: allTasks, isLoading } = useTasks(user?.uid || '');

  // Get days to display in calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get all days in current month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate offset for first day of month (0=Sunday, 6=Saturday)
  const firstDayOffset = monthStart.getDay();
  
  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    if (!allTasks) return [];
    
    return allTasks.filter(task => {
      const taskDate = toDate(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  // Get tasks for selected date
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  // Navigate months
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCloseSidePanel = () => {
    setSelectedDate(null);
  };

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              <FiCalendar /> Calendar
            </h1>
            <p className={styles.subtitle}>
              {format(currentMonth, 'MMMM yyyy')}
            </p>
          </div>
          
          <div className={styles.headerActions}>
            <Button variant="secondary" size="small" onClick={handleToday}>
              Today
            </Button>
            <div className={styles.monthNav}>
              <button
                type="button"
                className={styles.navButton}
                onClick={handlePreviousMonth}
                aria-label="Previous month"
              >
                <FiChevronLeft />
              </button>
              <button
                type="button"
                className={styles.navButton}
                onClick={handleNextMonth}
                aria-label="Next month"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className={styles.calendarWrapper}>
          <Card variant="elevated" padding="large">
            {isLoading ? (
              <Loader variant="skeleton" count={5} />
            ) : (
              <div className={styles.calendar}>
                {/* Day headers */}
                <div className={styles.dayHeaders}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={styles.dayHeader}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className={styles.grid}>
                  {/* Empty cells for offset */}
                  {Array.from({ length: firstDayOffset }).map((_, index) => (
                    <div key={`empty-${index}`} className={styles.dayCell} />
                  ))}

                  {/* Days with tasks */}
                  {daysInMonth.map(date => {
                    const tasks = getTasksForDate(date);
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const isTodayDate = isToday(date);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        className={`
                          ${styles.dayCell}
                          ${!isCurrentMonth ? styles.otherMonth : ''}
                          ${isTodayDate ? styles.today : ''}
                          ${isSelected ? styles.selected : ''}
                          ${tasks.length > 0 ? styles.hasTasks : ''}
                        `}
                        onClick={() => handleDateClick(date)}
                      >
                        <span className={styles.dayNumber}>
                          {format(date, 'd')}
                        </span>
                        
                        {/* Task indicators */}
                        {tasks.length > 0 && (
                          <div className={styles.taskIndicators}>
                            {tasks.slice(0, 3).map(task => (
                              <span
                                key={task.id}
                                className={`${styles.taskDot} ${styles[`priority-${task.priority}`]}`}
                                title={task.title}
                              />
                            ))}
                            {tasks.length > 3 && (
                              <span className={styles.moreTasks}>
                                +{tasks.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Side Panel for Selected Date */}
        {selectedDate && (
          <div className={styles.sidePanel}>
            <Card variant="elevated" padding="large" className={styles.sidePanelCard}>
              <div className={styles.sidePanelHeader}>
                <h2 className={styles.sidePanelTitle}>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h2>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={handleCloseSidePanel}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className={styles.sidePanelContent}>
                {selectedDateTasks.length === 0 ? (
                  <EmptyState
                    title="No tasks"
                    message="No tasks scheduled for this date."
                    icon={<FiCalendar />}
                  />
                ) : (
                  <div className={styles.tasksList}>
                    <p className={styles.tasksCount}>
                      {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
                    </p>
                    {selectedDateTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        variant="preview"
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
