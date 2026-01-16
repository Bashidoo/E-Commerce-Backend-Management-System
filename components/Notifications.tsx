import React from 'react';
import { useNotification, Notification } from '../contexts/NotificationContext';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { removeNotification } = useNotification();

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle2 className="text-green-500 dark:text-green-400" size={20} />;
      case 'error': return <AlertCircle className="text-red-500 dark:text-red-400" size={20} />;
      case 'warning': return <AlertTriangle className="text-amber-500 dark:text-amber-400" size={20} />;
      case 'info': return <Info className="text-blue-500 dark:text-blue-400" size={20} />;
    }
  };

  const getStyles = () => {
    switch (notification.type) {
      case 'success': return 'border-l-green-500 dark:border-l-green-400';
      case 'error': return 'border-l-red-500 dark:border-l-red-400';
      case 'warning': return 'border-l-amber-500 dark:border-l-amber-400';
      case 'info': return 'border-l-blue-500 dark:border-l-blue-400';
    }
  };

  return (
    <div className={`
      flex items-start gap-3 w-80 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border-l-4 
      transform transition-all duration-300 animate-in slide-in-from-right fade-in
      ${getStyles()}
    `}>
      <div className="shrink-0 pt-0.5">{getIcon()}</div>
      <p className="text-sm text-slate-700 dark:text-slate-200 flex-1 leading-tight">{notification.message}</p>
      <button 
        onClick={() => removeNotification(notification.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-3">
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>
    </div>
  );
};