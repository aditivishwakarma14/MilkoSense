import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useUiStore from '../../app/store/uiStore';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-iot-green" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-iot-red animate-pulse" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-iot-yellow" />;
      default:
        return <Info className="w-5 h-5 text-iot-cyan" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success': return 'border-iot-green border-opacity-35';
      case 'error': return 'border-iot-red border-opacity-35';
      case 'warning': return 'border-iot-yellow border-opacity-35';
      default: return 'border-iot-cyan border-opacity-35';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 80, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border bg-white dark:bg-dark-surface shadow-lg ${getBorderColor(toast.type)}`}
          >
            <div className="flex items-center gap-3">
              {getIcon(toast.type)}
              <span className="text-sm font-semibold tracking-wide text-gray-800 dark:text-dark-text-primary">{toast.message}</span>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 p-1 text-gray-400 hover:text-gray-600 dark:text-dark-text-secondary transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
