import React from 'react';
import { Filter, Calendar, Users } from 'lucide-react';

const ReportFilters = ({ filters, onFilterChange }) => {
  const handleSelect = (key, val) => {
    onFilterChange({
      ...filters,
      [key]: val,
    });
  };

  return (
    <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl bg-white dark:bg-dark-surface shadow-sm border border-gray-100 mb-5 text-xs font-mono">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-[#047857]" />
        <span className="font-bold tracking-widest text-[#047857] uppercase">AUDIT MATRIX FILTER</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        {/* Timeframe Select */}
        <div className="flex items-center gap-2 w-full sm:w-auto bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
          <select
            value={filters.timeframe}
            onChange={(e) => handleSelect('timeframe', e.target.value)}
            className="bg-transparent text-gray-800 dark:text-dark-text-primary outline-none border-none text-xs cursor-pointer font-bold uppercase tracking-wider pr-4"
          >
            <option value="all">ALL RECORDS</option>
            <option value="last-24h">LAST 24 HOURS</option>
            <option value="last-7d">LAST 7 DAYS</option>
            <option value="last-30d">LAST 30 DAYS</option>
          </select>
        </div>

        {/* Cattle Type Select */}
        <div className="flex items-center gap-2 w-full sm:w-auto bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2">
          <Users className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
          <select
            value={filters.cattleType}
            onChange={(e) => handleSelect('cattleType', e.target.value)}
            className="bg-transparent text-gray-800 dark:text-dark-text-primary outline-none border-none text-xs cursor-pointer font-bold uppercase tracking-wider pr-4"
          >
            <option value="all">ALL CATTLE BREEDS</option>
            <option value="cow">COWS ONLY</option>
            <option value="buffalo">BUFFALO ONLY</option>
            <option value="goat">GOAT ONLY</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
