import React, { useEffect, useRef } from 'react';
import { Task } from '../types';

interface NotificationManagerProps {
  tasks: Task[];
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ tasks }) => {
  const notifiedTasks = useRef(new Set<string>());

  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      tasks.forEach(task => {
        // Only check pending tasks for today that haven't failed
        if (task.completed || task.failed || task.date !== today || notifiedTasks.current.has(task.id)) return;

        // Construct date object safely
        try {
            const taskDateTime = new Date(`${task.date}T${task.time}`);
            
            // Check if date is valid
            if (isNaN(taskDateTime.getTime())) return;

            const diffMs = taskDateTime.getTime() - now.getTime();
            const diffMinutes = Math.floor(diffMs / 60000);

            // Notify if within 10 minutes (0 to 10) or slightly late (-1 to 0)
            if ((diffMinutes <= 10 && diffMinutes >= 0) || (diffMinutes < 0 && diffMinutes >= -1)) {
            const title = `VANTAGE: ${task.category}`;
            const options = {
                body: diffMinutes <= 0 ? `HORA DE FAZER: ${task.text}` : `Faltam ${diffMinutes} min: "${task.text}"`,
                icon: 'https://i.imgur.com/kL00omR.png', // Using the icon from previous code
                tag: task.id,
                renotify: true,
                silent: false,
                vibrate: [200, 100, 200]
            };
            
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
                });
            } else {
                new Notification(title, options as any);
            }
            
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            notifiedTasks.current.add(task.id);
            }
        } catch (e) {
            console.error("Error processing task for notification:", e);
        }
      });
    };

    // Check immediately and then every minute
    checkReminders();
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [tasks]);

  return null;
};

export default NotificationManager;
