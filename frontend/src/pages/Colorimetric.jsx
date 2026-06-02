import React, { useState } from 'react';
import { Droplet, Upload, ShieldAlert, CheckCircle, Image as ImageIcon } from 'lucide-react';
import useUiStore from '../app/store/uiStore';

const Colorimetric = () => {
  const addToast = useUiStore((state) => state.addToast);
  const [image, setImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        setResult(null); // Clear previous scans
        addToast('Test strip image uploaded successfully', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartScan = () => {
    if (!image) {
      addToast('Please upload a test-tube indicator image first.', 'warning');
      return;
    }

    setIsScanning(true);
    addToast('Scanning RGB chromatic profiles...', 'info');

    // Simulate digital pixel scanning
    setTimeout(() => {
      setIsScanning(false);
      
      const isPure = Math.random() > 0.5;
      if (isPure) {
        setResult({
          pure: true,
          score: 96,
          message: '✓ OPTIMAL PURITY: RGB color spectrum maps perfectly to pure raw organic milk. No synthetic dyes, urea, or starch traces found.',
          readings: [
            { label: 'Starch Indicator (Iodine)', status: 'Negative', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Urea Indicator (DMAB)', status: 'Negative', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Detergent Indicator (MB)', status: 'Negative', color: 'text-emerald-600', bg: 'bg-emerald-50' }
          ]
        });
        addToast('Chromatographic scan complete: pure sample.', 'success');
      } else {
        setResult({
          pure: false,
          score: 42,
          message: '⚠️ ANOMALY DETECTED: Yellow DMAB color shift indicates elevated urea concentrations. Starch iodine traces also detected.',
          readings: [
            { label: 'Starch Indicator (Iodine)', status: 'Positive (Elevated)', color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Urea Indicator (DMAB)', status: 'Positive (Critical)', color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Detergent Indicator (MB)', status: 'Negative', color: 'text-emerald-600', bg: 'bg-emerald-50' }
          ]
        });
        addToast('DANGER: Contaminated chemical traces detected!', 'error');
      }
    }, 2500);
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-dark-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-dark-text-primary flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Droplet className="w-6 h-6 text-[#047857]" />
            </div>
            COLORIMETRIC AUDIT
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1 font-medium">Image-based chemical analysis. Scan test tube indicators for synthetic adulterants.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Segment: Image upload and scan trigger (66% wide) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-between min-h-[400px]">
          
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4 mb-5">
            <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold tracking-widest text-gray-800 dark:text-dark-text-primary uppercase font-mono">IMAGE DISPATCH GATEWAY</h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-emerald-50/50 dark:bg-dark-bg border-2 border-dashed border-emerald-200 dark:border-dark-border rounded-xl relative overflow-hidden group">
            {image ? (
              <div className="relative w-full max-h-[300px] flex items-center justify-center">
                <img src={image} alt="Uploaded test strip" className="max-h-[250px] rounded-lg object-contain shadow-sm" />
                {isScanning && (
                  <div className="absolute inset-0 bg-white dark:bg-dark-surface bg-opacity-60 flex items-center justify-center backdrop-blur-sm rounded-lg">
                    {/* Scanner line animation */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_12px_#10B981] animate-[bounce_2s_infinite]" />
                    <span className="text-xs font-mono font-bold text-emerald-700 tracking-widest uppercase bg-emerald-100 px-4 py-2 rounded-lg border border-emerald-200 shadow-sm">
                      SCANNING CHROMAS...
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center space-y-4 py-12">
                <div className="p-5 rounded-full bg-white dark:bg-dark-surface border border-emerald-100 dark:border-dark-border text-emerald-400 dark:text-emerald-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 group-hover:border-emerald-300 dark:group-hover:border-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-dark-elevated transition-all duration-300 shadow-sm">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100 block mb-1">UPLOAD CHROMATIC STRIP IMAGE</span>
                  <span className="text-[11px] text-emerald-500/70 dark:text-emerald-400/70 font-mono">Accepts PNG, JPG, or JPEG logs</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          <button
            onClick={handleStartScan}
            disabled={!image || isScanning}
            className="w-full flex items-center justify-center gap-2 mt-6 px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#047857] to-emerald-500 hover:from-[#065f46] hover:to-emerald-600 text-white font-bold tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-emerald-500/20"
          >
            <Droplet className="w-4 h-4" />
            {isScanning ? 'ANALYZING CHROMAS...' : 'EXECUTE CHROMATIC SCAN'}
          </button>
        </div>

        {/* Right Segment: Scan Results (33% wide) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm flex flex-col">
          
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-4 mb-5">
            <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold tracking-widest text-gray-800 dark:text-dark-text-primary uppercase font-mono">SCAN DIAGNOSTICS</h3>
          </div>

          {result ? (
            <div className="flex-grow flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md ${
                    result.pure ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-500/30' : 'bg-gradient-to-br from-rose-400 to-rose-500 shadow-rose-500/30'
                  }`}>
                    {result.score}%
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-dark-text-muted font-bold font-mono uppercase tracking-wider">PURITY RATING</span>
                    <h4 className={`text-sm font-extrabold mt-0.5 uppercase tracking-wide ${result.pure ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {result.pure ? 'COMPLIANT ORGANIC' : 'CONTAMINATED SAMPLE'}
                    </h4>
                  </div>
                </div>

                <p className={`p-4 rounded-xl border leading-relaxed font-mono text-xs shadow-sm ${
                  result.pure ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-100' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50 text-rose-800 dark:text-rose-100'
                }`}>
                  {result.message}
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs mt-4">
                <span className="text-gray-500 dark:text-dark-text-muted font-bold block mb-3 text-[10px] tracking-wider uppercase">Specific Chromatic Indicators:</span>
                {result.readings.map((reading) => (
                  <div key={reading.label} className={`flex items-center justify-between p-3 border rounded-xl shadow-sm transition-colors ${reading.bg} dark:bg-dark-bg dark:border-dark-border ${reading.color.replace('text-', 'border-').replace('600', '200')}`}>
                    <span className="font-semibold text-[11px] text-gray-700 dark:text-dark-text-primary">{reading.label}</span>
                    <span className={`font-black uppercase tracking-wider text-[11px] ${reading.color}`}>
                      {reading.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center py-16 text-center font-mono text-xs bg-gray-50 dark:bg-dark-bg rounded-xl border border-dashed border-gray-200 dark:border-dark-border mt-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-elevated flex items-center justify-center mb-3">
                <Droplet className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-gray-500 dark:text-dark-text-muted font-medium">Awaiting color scans...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Colorimetric;
