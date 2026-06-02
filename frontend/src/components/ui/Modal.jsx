import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Glass Dimmer Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-65 backdrop-blur-sm"
          />

          {/* Modal Panel Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-dark-surface shadow-xl border border-gray-200 dark:border-dark-border p-6 flex flex-col"
          >
            {/* Header section */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-border pb-4 mb-4">
              <h3 className="text-lg font-bold tracking-wide text-gray-900 dark:text-dark-text-primary">{title}</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 hover:bg-gray-100 dark:bg-dark-elevated transition-all duration-150"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content section */}
            <div className="flex-1 text-sm text-gray-700 leading-relaxed">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
