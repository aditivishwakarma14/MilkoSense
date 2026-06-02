import React from 'react';
import StatusBadge from '../ui/StatusBadge';
import Loader from '../ui/Loader';
import { FileText, Eye } from 'lucide-react';

const ReportTable = ({ reports = [], isLoading = false, onViewDetails }) => {
  if (isLoading) {
    return <Loader message="Accessing database reports ledger..." />;
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white dark:bg-dark-surface shadow-sm border border-gray-200 dark:border-dark-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          {/* Header Row */}
          <thead>
            <tr className="border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-[10px] tracking-widest text-gray-600 dark:text-dark-text-secondary uppercase font-bold">
              <th className="px-5 py-4">TIMESTAMP</th>
              <th className="px-5 py-4">CATTLE/BREED</th>
              <th className="px-5 py-4">pH VALUE</th>
              <th className="px-5 py-4">TEMP (°C)</th>
              <th className="px-5 py-4">TURBIDITY (NTU)</th>
              <th className="px-5 py-4">TDS (PPM)</th>
              <th className="px-5 py-4">GAS (PPM)</th>
              <th className="px-5 py-4">AI GRADE</th>
              <th className="px-5 py-4 text-center">ACTION</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 text-gray-600 dark:text-dark-text-secondary">
            {reports.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-5 py-12 text-center text-gray-400 text-sm">
                  <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  No matching telemetry records found.
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const reading = report.sensorReading || report || {};
                const timestamp = report.timestamp || reading.timestamp || new Date().toISOString();
                
                return (
                  <tr key={report._id} className="hover:bg-gray-50 dark:bg-dark-bg transition-colors duration-150">
                    <td className="px-5 py-4 text-gray-500 dark:text-dark-text-muted">
                      {new Date(timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 dark:text-dark-text-primary capitalize">
                      {reading.cattleType || 'Cow'}
                    </td>
                    <td className="px-5 py-4 font-bold text-[#047857]">
                      {reading.ph?.toFixed(2) || '6.60'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {reading.temperature?.toFixed(1) || '20.0'}°C
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {reading.turbidity?.toFixed(1) || '15.0'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {reading.tds?.toFixed(0) || '950'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {reading.gas?.toFixed(0) || '110'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={report.qualityGrade?.grade || 'A'} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => onViewDetails(report)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#047857] text-white hover:bg-[#065f46] transition-all duration-150 font-semibold shadow-sm w-full sm:w-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        AUDIT
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportTable;
