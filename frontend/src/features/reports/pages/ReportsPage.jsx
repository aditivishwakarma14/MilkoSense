import React, { useState, useEffect } from 'react';
import reportService from '../services/reportService';
import useUiStore from '../../../app/store/uiStore';
import useSensorStore from '../../../app/store/sensorStore';
import ReportFilters from '../../../components/reports/ReportFilters';
import ReportExporter from '../../../components/reports/ReportExporter';
import ReportTable from '../../../components/reports/ReportTable';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import { FileSpreadsheet, Eye, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ReportsPage = () => {
  const addToast = useUiStore((state) => state.addToast);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const latestSensorData = useSensorStore((state) => state.latestSensorData);

  useEffect(() => {
    if (latestSensorData) {
      setReports((prev) => {
        const id = latestSensorData._id || latestSensorData.id;
        if (prev.some(r => (r._id || r.id) === id)) {
          return prev;
        }
        return [latestSensorData, ...prev];
      });
    }
  }, [latestSensorData]);

  // Core filter states mapping to Express REST inputs
  const [filters, setFilters] = useState({
    timeframe: 'all',
    cattleType: 'all',
  });

  // Re-fetch ledger logs when filter options shift
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        setIsLoading(true);
        const data = await reportService.queryReports({
          timeframe: filters.timeframe,
          cattleType: filters.cattleType
        });
        setReports(Array.isArray(data) ? data : []);
      } catch (error) {
        addToast('Database connection failed. Displaying cached records.', 'warning');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLedger();
  }, [filters, addToast]);

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto text-left">
      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-dark-text-primary flex items-center gap-2.5">
            <div className="p-2 bg-green-50 dark:bg-brand-primary/10 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-[#047857] dark:text-brand-primary" />
            </div>
            Compliance Reports Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1">Audit ledger for logs, reports, data insights, and executive analytical reports.</p>
        </div>

        {/* Compile compliance spreadsheet files */}
        <ReportExporter reports={reports} />
      </div>

      {/* 1. Interactive filtering dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <ReportFilters filters={filters} onFilterChange={setFilters} />
      </motion.div>

      {/* 2. Main data logs list table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ReportTable
          reports={reports}
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
        />
      </motion.div>

      {/* 3. Detailed Audit Modals */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="AI QUALITY COMPLIANCE REPORT"
      >
        {selectedReport && (() => {
          const reading = selectedReport.sensorReading || selectedReport || {};
          return (
          <div className="space-y-5 font-mono text-xs">
            {/* Timestamp and Breed header */}
            <div className="grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-dark-border pb-4">
              <div>
                <span className="text-gray-500 dark:text-dark-text-muted font-bold">AUDIT TIMESTAMP:</span>
                <p className="text-gray-900 dark:text-dark-text-primary mt-0.5">{new Date(selectedReport.timestamp || reading.timestamp || new Date()).toLocaleString()}</p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-dark-text-muted font-bold">CATTLE CLASSIFICATION:</span>
                <p className="text-gray-900 dark:text-dark-text-primary mt-0.5 capitalize">{reading.cattleType || 'Cow'}</p>
              </div>
            </div>

            {/* Quality Score circular indicator */}
            <div className="flex items-center gap-4 py-2 bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-200 dark:border-dark-border">
              <div className="w-16 h-16 rounded-full border-4 border-[#047857] flex items-center justify-center text-lg font-black text-gray-900 dark:text-dark-text-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {selectedReport.score}%
              </div>
              <div>
                <span className="text-gray-500 dark:text-dark-text-muted font-bold">ASSESSMENT GRADE:</span>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedReport.qualityGrade?.grade || 'A'} />
                  <span className="text-xs font-bold text-gray-700 dark:text-dark-text-primary">
                    {selectedReport.qualityGrade?.label || 'EXCELLENT PURITY'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ingested raw readings details grid */}
            <div>
              <span className="text-gray-500 dark:text-dark-text-muted font-bold block mb-2 text-sm uppercase">RAW TELEMETRY AUDITING GAUGE:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Acidity (pH)', val: reading.ph?.toFixed(2) || '6.60', color: 'text-[#047857] dark:text-white' },
                  { label: 'Temperature', val: `${reading.temperature?.toFixed(1) || '20.0'}°C`, color: 'text-blue-600 dark:text-white' },
                  { label: 'Turbidity', val: `${reading.turbidity?.toFixed(1) || '15.0'} NTU`, color: 'text-green-600 dark:text-white' },
                  { label: 'Solids (TDS)', val: `${reading.tds?.toFixed(0) || '950'} ppm`, color: 'text-yellow-600 dark:text-white' },
                  { label: 'Methane PPM', val: reading.gas?.toFixed(0) || '110', color: 'text-indigo-600 dark:text-white' }
                ].map((stat) => (
                  <div key={stat.label} className="p-3 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-dark-text-muted font-bold">{stat.label}</span>
                    <p className={`text-base font-bold mt-1 ${stat.color}`}>{stat.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contaminants screening and predictions */}
            <div className="space-y-3.5 border-t border-gray-200 dark:border-dark-border pt-4">
              <div>
                <span className="text-gray-500 dark:text-dark-text-muted font-bold text-sm uppercase">NEURAL ADULTERATION SCRUTINY:</span>
                <p className="text-gray-800 dark:text-dark-text-primary mt-1 leading-relaxed text-sm">
                  {selectedReport.adulterationRisk?.detected
                    ? '⚠️ CRITICAL: Substandard chemical deviations mapped. Potential synthetic contaminants or starch compounds detected.'
                    : '✓ SAFE: No dilution markers or mineral adulterant deviations observed in physical telemetry profiles.'}
                </p>
              </div>

              <div>
                <span className="text-gray-500 dark:text-dark-text-muted font-bold text-sm uppercase">STABILITY INSIGHT:</span>
                <p className="text-gray-800 dark:text-dark-text-primary mt-1 leading-relaxed text-sm">
                  💡 {selectedReport.spoilagePrediction?.recommendation || 'Maintain refrigeration under 4.0°C to guarantee maximum shelf life.'}
                </p>
              </div>
            </div>
          </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default ReportsPage;
