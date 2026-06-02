import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-gray-800 bg-dark-bg py-4 px-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 dark:text-dark-text-muted font-mono">
      <div>
        <span>© {currentYear} MilkoSense Platform. All rights reserved.</span>
      </div>
      
      <div className="flex items-center gap-4 mt-2 md:mt-0">
        <span>GATEWAY LATENCY: &lt;14ms</span>
        <span className="hidden sm:inline">•</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-iot-green animate-pulse shadow-[0_0_8px_#10B981]" />
          ALL SENSOR CLUSTERS OPERATIONAL
        </span>
      </div>
    </footer>
  );
};

export default Footer;
