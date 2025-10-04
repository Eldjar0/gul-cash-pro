import { useEffect, useRef } from 'react';
import { useDailyReports } from './useDailyReports';
import { useCreateNotification } from './useNotifications';
import { useAuth } from './useAuth';
import { format, isToday } from 'date-fns';

export const useDailyReportReminder = () => {
  const { data: reports = [] } = useDailyReports();
  const createNotification = useCreateNotification();
  const { user } = useAuth();
  const hasCheckedTodayRef = useRef(false);

  useEffect(() => {
    if (!user || hasCheckedTodayRef.current) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayReport = reports.find((report) => 
      report.report_date === today
    );

    // Check if there's an open report (no closing_amount)
    if (todayReport && todayReport.closing_amount === null) {
      const now = new Date();
      const hour = now.getHours();

      // Remind to close the day after 6 PM (18:00)
      if (hour >= 18) {
        hasCheckedTodayRef.current = true;
        
        createNotification.mutate({
          user_id: user.id,
          title: '📊 Rappel: Clôture journée',
          message: 'N\'oubliez pas de clôturer la journée et faire le Rapport Z',
          type: 'info',
          action_url: '/',
        });
      }
    }

    // Reset the check at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      hasCheckedTodayRef.current = false;
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [reports, user, createNotification]);
};
