import React from 'react';
import { DownloadCloud } from 'lucide-react';
import useUiStore from '../../app/store/uiStore';

const ReportExporter = ({ reports = [] }) => {
  const addToast = useUiStore((state) => state.addToast);

  const handleExport = () => {
    if (reports.length === 0) {
      addToast('No audit records available to download.', 'warning');
      return;
    }

    try {
      // 1. Establish CSV headers matching the MERN structure
      const headers = [
        'Timestamp',
        'Cattle Breed',
        'pH Acidity',
        'Temperature (C)',
        'Turbidity (NTU)',
        'TDS (PPM)',
        'Gas PPM',
        'AI Quality Score',
        'Grade',
        'Adulteration Risk',
        'Prediction insight'
      ];

      // 2. Loop through JSON logs to construct row columns
      const rows = reports.map((report) => {
        const reading = report.sensorReading || {};
        return [
          new Date(report.timestamp || reading.timestamp).toISOString(),
          reading.cattleType || 'Cow',
          reading.ph || '6.6',
          reading.temperature || '20.0',
          reading.turbidity || '15.0',
          reading.tds || '950',
          reading.gas || '110',
          report.score || '92',
          report.qualityGrade?.grade || 'A',
          report.adulterationRisk?.detected ? 'High' : 'Low',
          report.spoilagePrediction?.recommendation || ''
        ];
      });

      // 3. Assemble CSV string with correct commas and quote escapes
      const csvContent = 
        'data:text/csv;charset=utf-8,' + 
        [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

      // 4. Mount anchor node, execute automated browser click, and clear node
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `MilkoSense_Quality_Audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast('CSV audit logs downloaded successfully', 'success');
    } catch (error) {
      console.error('[Exporter Boundary Failed]:', error);
      addToast('Failed to compile audit CSV files.', 'error');
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-iot-cyan hover:bg-opacity-90 text-white font-semibold text-xs tracking-wider uppercase shadow-lg shadow-cyan-900/30 hover:shadow-cyan-900/50 transition-all duration-200"
    >
      <DownloadCloud className="w-4 h-4" />
      EXPORT COMPLIANCE CSV
    </button>
  );
};

export default ReportExporter;
