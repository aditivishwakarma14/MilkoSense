import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ message = 'Accessing telemetry streams...', fullPage = false }) => {
  const containerClasses = fullPage
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-bg bg-opacity-90 backdrop-blur-md'
    : 'flex flex-col items-center justify-center py-12 w-full';

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing orb */}
        <motion.div
          className="absolute w-24 h-24 rounded-full bg-iot-cyan bg-opacity-10 border border-iot-cyan border-opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Inner rotating progress ring */}
        <motion.div
          className="w-16 h-16 rounded-full border-4 border-iot-blue border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Center glowing dot */}
        <div className="absolute w-4 h-4 rounded-full bg-iot-cyan shadow-[0_0_12px_#06B6D4]" />
      </div>

      <motion.p
        className="mt-6 text-sm font-semibold tracking-wider text-gray-400 uppercase"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {message}
      </motion.p>
    </div>
  );
};

export default Loader;
