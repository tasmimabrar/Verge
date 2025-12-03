import type { FC } from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';
import { useTasks, useProjects } from '@/shared/hooks';
import { Loader, Button } from '@/shared/components';
import { toDate } from '@/shared/utils/dateHelpers';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  subDays,
  isAfter,
} from 'date-fns';
import { FiTrendingUp, FiActivity, FiTarget, FiClock, FiAward, FiArrowLeft } from 'react-icons/fi';
import styles from './Analytics.module.css';

export const Analytics: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(user?.uid || '');
  const { data: projects = [], isLoading: projectsLoading } = useProjects(user?.uid || '');

  // Calculate analytics data
  const analytics = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const last7Days = subDays(now, 7);

    // Overall stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const overdueTasks = tasks.filter(
      t => t.status !== 'done' && t.dueDate && isAfter(now, toDate(t.dueDate))
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // This week's tasks
    const thisWeekTasks = tasks.filter(t =>
      t.dueDate && isWithinInterval(toDate(t.dueDate), { start: weekStart, end: weekEnd })
    );
    const thisWeekCompleted = thisWeekTasks.filter(t => t.status === 'done').length;

    // This month's tasks
    const thisMonthTasks = tasks.filter(t =>
      t.dueDate && isWithinInterval(toDate(t.dueDate), { start: monthStart, end: monthEnd })
    );
    const thisMonthCompleted = thisMonthTasks.filter(t => t.status === 'done').length;

    // Priority breakdown
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;

    // Status breakdown for pie chart
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const postponedTasks = tasks.filter(t => t.status === 'postponed').length;

    // Daily completion trend (last 7 days)
    const dailyTrend = eachDayOfInterval({ start: last7Days, end: now }).map(day => {
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));
      
      const completed = tasks.filter(t => 
        t.status === 'done' && 
        t.updatedAt && 
        isWithinInterval(toDate(t.updatedAt), { start: dayStart, end: dayEnd })
      ).length;

      const created = tasks.filter(t =>
        t.createdAt && 
        isWithinInterval(toDate(t.createdAt), { start: dayStart, end: dayEnd })
      ).length;

      return {
        date: format(day, 'EEE'),
        completed,
        created,
      };
    });

    // Weekly completion trend (last 4 weeks)
    const weeklyTrend = Array.from({ length: 4 }, (_, i) => {
      const weekEnd = subDays(now, i * 7);
      const weekStart = subDays(weekEnd, 6);
      
      const completed = tasks.filter(t =>
        t.status === 'done' &&
        t.updatedAt &&
        isWithinInterval(toDate(t.updatedAt), { start: weekStart, end: weekEnd })
      ).length;

      return {
        week: `Week ${4 - i}`,
        completed,
      };
    }).reverse();

    // Priority distribution over time
    const priorityTrend = eachDayOfInterval({ start: last7Days, end: now }).map(day => {
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));
      
      const tasksOnDay = tasks.filter(t =>
        t.dueDate && isWithinInterval(toDate(t.dueDate), { start: dayStart, end: dayEnd })
      );

      return {
        date: format(day, 'MM/dd'),
        high: tasksOnDay.filter(t => t.priority === 'high').length,
        medium: tasksOnDay.filter(t => t.priority === 'medium').length,
        low: tasksOnDay.filter(t => t.priority === 'low').length,
      };
    });

    // Project completion stats
    const projectStats = projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const completed = projectTasks.filter(t => t.status === 'done').length;
      const total = projectTasks.length;
      const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
        completion,
        total,
        completed,
      };
    }).slice(0, 5); // Top 5 projects

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      thisWeekTasks: thisWeekTasks.length,
      thisWeekCompleted,
      thisMonthTasks: thisMonthTasks.length,
      thisMonthCompleted,
      highPriority,
      mediumPriority,
      lowPriority,
      todoTasks,
      postponedTasks,
      dailyTrend,
      weeklyTrend,
      priorityTrend,
      projectStats,
    };
  }, [tasks, projects]);

  if (tasksLoading || projectsLoading) {
    return <Loader variant="screen" />;
  }

  if (!user) {
    return <Loader variant="screen" />;
  }

  const statusData = [
    { name: 'Completed', value: analytics.completedTasks, color: 'var(--color-success)' },
    { name: 'In Progress', value: analytics.inProgressTasks, color: '#eab308' },
    { name: 'To Do', value: analytics.todoTasks, color: 'var(--color-text-tertiary)' },
    { name: 'Postponed', value: analytics.postponedTasks, color: '#f97316' },
  ];

  const priorityData = [
    { name: 'High', value: analytics.highPriority, color: 'var(--color-error)' },
    { name: 'Medium', value: analytics.mediumPriority, color: '#ea580c' },
    { name: 'Low', value: analytics.lowPriority, color: 'var(--color-success)' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button 
            variant="secondary" 
            size="medium" 
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            <FiArrowLeft /> Back
          </Button>
          <div className={styles.headerText}>
            <h1 className={styles.title}>Analytics</h1>
            <p className={styles.subtitle}>Track your productivity and performance</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: 'var(--color-primary-light)' }}>
            <FiTarget />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Total Tasks</p>
            <p className={styles.metricValue}>{analytics.totalTasks}</p>
            <p className={styles.metricSubtext}>
              {analytics.completedTasks} completed
            </p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: '#dcfce7' }}>
            <FiAward style={{ color: 'var(--color-success)' }} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Completion Rate</p>
            <p className={styles.metricValue}>{analytics.completionRate}%</p>
            <p className={styles.metricSubtext}>
              {analytics.completedTasks}/{analytics.totalTasks} tasks
            </p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: '#fef3c7' }}>
            <FiActivity style={{ color: '#eab308' }} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>In Progress</p>
            <p className={styles.metricValue}>{analytics.inProgressTasks}</p>
            <p className={styles.metricSubtext}>
              Active tasks
            </p>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ backgroundColor: '#fee2e2' }}>
            <FiClock style={{ color: 'var(--color-error)' }} />
          </div>
          <div className={styles.metricContent}>
            <p className={styles.metricLabel}>Overdue</p>
            <p className={styles.metricValue}>{analytics.overdueTasks}</p>
            <p className={styles.metricSubtext}>
              Need attention
            </p>
          </div>
        </div>
      </div>

      {/* Period Stats */}
      <div className={styles.periodStats}>
        <div className={styles.periodCard}>
          <div className={styles.periodHeader}>
            <h3>This Week</h3>
            <FiTrendingUp className={styles.periodIcon} />
          </div>
          <p className={styles.periodValue}>{analytics.thisWeekCompleted}/{analytics.thisWeekTasks}</p>
          <p className={styles.periodLabel}>Tasks Completed</p>
        </div>

        <div className={styles.periodCard}>
          <div className={styles.periodHeader}>
            <h3>This Month</h3>
            <FiTrendingUp className={styles.periodIcon} />
          </div>
          <p className={styles.periodValue}>{analytics.thisMonthCompleted}/{analytics.thisMonthTasks}</p>
          <p className={styles.periodLabel}>Tasks Completed</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Daily Activity */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Daily Activity (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.dailyTrend}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="var(--color-success)"
                fillOpacity={1}
                fill="url(#colorCompleted)"
                name="Completed"
              />
              <Area
                type="monotone"
                dataKey="created"
                stroke="var(--color-primary)"
                fillOpacity={1}
                fill="url(#colorCreated)"
                name="Created"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Weekly Completion Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="week" 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-primary)', r: 5 }}
                activeDot={{ r: 7 }}
                name="Completed Tasks"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent ? `${name}: ${(percent * 100).toFixed(0)}%` : name}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent ? `${name}: ${(percent * 100).toFixed(0)}%` : name}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Workload Over Time */}
        <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
          <h3 className={styles.chartTitle}>Priority Workload (Next 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.priorityTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--color-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <Legend />
              <Bar dataKey="high" stackId="a" fill="var(--color-error)" name="High Priority" />
              <Bar dataKey="medium" stackId="a" fill="#ea580c" name="Medium Priority" />
              <Bar dataKey="low" stackId="a" fill="var(--color-success)" name="Low Priority" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Progress */}
        {analytics.projectStats.length > 0 && (
          <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
            <h3 className={styles.chartTitle}>Project Completion Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.projectStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  type="number"
                  domain={[0, 100]}
                  stroke="var(--color-text-secondary)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  width={120}
                  stroke="var(--color-text-secondary)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                  formatter={(value: number, name: string, props: { payload?: { completed: number; total: number } }) => {
                    if (name === 'completion' && props.payload) {
                      return [`${value}% (${props.payload.completed}/${props.payload.total} tasks)`, 'Completion'];
                    }
                    return [value, name];
                  }}
                />
                <Bar 
                  dataKey="completion" 
                  fill="var(--color-primary)"
                  radius={[0, 8, 8, 0]}
                  name="Completion Rate"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
