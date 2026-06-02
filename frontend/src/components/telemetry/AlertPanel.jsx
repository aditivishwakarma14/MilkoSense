import React from 'react';
import useAlertStore from '../../app/store/alertStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const AlertPanel = () => {
  const alerts = useAlertStore((state) => state.alerts);
  const resolveAlert = useAlertStore((state) => state.resolveAlert);

  const activeAlerts = alerts.filter((a) => !a.resolved);

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel shadow-glass border border-gray-800 p-5">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-iot-red animate-pulse" />
          <h3 className="text-sm font-bold tracking-widest text-gray-200 uppercase font-mono">LIVE INCIDENT MATRIX</h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-iot-red bg-opacity-10 text-iot-red border border-iot-red border-opacity-25 text-[10px] font-bold font-mono">
          {activeAlerts.length} OPEN ISSUES
        </span>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 pr-1">
        <AnimatePresence>
          {activeAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <CheckCircle className="w-12 h-12 text-iot-green mb-3" />
              <p className="text-sm font-bold text-gray-200">SAFETY SHIELDS OPERATIONAL</p>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1 max-w-[200px]">All telemetry parameters are within optimal ranges.</p>
            </motion.div>
          ) : (
            activeAlerts.map((alert) => (
              <motion.div
                key={alert._id || alert.timestamp}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-start justify-between p-3.5 rounded-xl bg-gray-900 border border-gray-800/80 hover:border-iot-red/30 transition-all duration-150"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-iot-red bg-opacity-10 text-iot-red border border-iot-red border-opacity-20 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 tracking-wide">{alert.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{alert.message}</p>
                    <span className="text-[10px] text-gray-500 dark:text-dark-text-muted font-mono mt-2 block">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => resolveAlert(alert._id)}
                  className="px-2.5 py-1 text-[10px] font-bold text-iot-green hover:bg-iot-green hover:bg-opacity-10 border border-iot-green border-opacity-30 rounded-md transition-all duration-150"
                >
                  DISMISS
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertPanel;
