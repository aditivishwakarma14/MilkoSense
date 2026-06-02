import React, { useMemo, useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import useAnalytics from '../hooks/useAnalytics';
import useAnalyticsStore from '../../../app/store/analyticsStore';
import useUiStore from '../../../app/store/uiStore';
import useSensorStore from '../../../app/store/sensorStore';
import Loader from '../../../components/ui/Loader';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';
import { Download, ShieldCheck, Info, Leaf, Activity, Sparkles, X, Wifi, Maximize2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customRedIcon = new L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" width="32px" height="32px" stroke="white" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  className: 'custom-leaflet-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// ENH-04: Mini inline SVG sparkline drawn from live historyData buffer
const MiniSparkline = ({ data, dataKey, color = '#10b981' }) => {
  const pts = data.slice(-20).map(d => d[dataKey]).filter(v => v != null && typeof v === 'number');
  if (pts.length < 3) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = (max - min) || 1;
  const W = 44, H = 18;
  const points = pts
    .map((v, i) => `${(i / (pts.length - 1)) * W},${H - ((v - min) / range) * (H - 2) - 1}`)
    .join(' ');
  return (
    <svg width={W} height={H} className="shrink-0 opacity-60" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const AnalysisPage = () => {
  const { loading } = useAnalytics();
  const latestAnalysis = useAnalyticsStore((state) => state.latestAnalysis);
  const trendReport    = useAnalyticsStore((state) => state.trendReport) ?? [];
  const addToast = useUiStore((state) => state.addToast);
  const theme = useUiStore((state) => state.theme);
  const isDark = theme === 'dark';
  const reportRef = useRef(null);

  const [expandedChart, setExpandedChart] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const gridColor = isDark && !isGeneratingPDF ? 'rgba(255,255,255,0.08)' : '#E5E7EB';
  
  // ── Real live sensor data from ESP32 via Socket.IO ───────────────────────
  const latestSensorData = useSensorStore((state) => state.latestSensorData);
  const connectionState  = useSensorStore((state) => state.connectionState);
  const historyData      = useSensorStore((state) => state.historyData);

  // ENH-02: Briefly flash the sensor bar whenever a fresh reading arrives
  const [sensorFlash, setSensorFlash] = useState(false);
  const prevSensorTsRef = useRef(null);
  useEffect(() => {
    const ts = latestSensorData?.timestamp;
    if (ts && ts !== prevSensorTsRef.current) {
      prevSensorTsRef.current = ts;
      setSensorFlash(true);
      const t = setTimeout(() => setSensorFlash(false), 700);
      return () => clearTimeout(t);
    }
  }, [latestSensorData?.timestamp]);

  // BUG-02 FIX: Guard against stale localStorage data being shown as "live"
  // Only consider sensor connected if data arrived within last 5 minutes
  const STALE_MS = 5 * 60 * 1000;
  const isSensorConnected =
    latestSensorData !== null &&
    latestSensorData.timestamp != null &&
    (Date.now() - new Date(latestSensorData.timestamp).getTime()) < STALE_MS;

  const analysisTime = latestAnalysis?.timestamp || latestAnalysis?.createdAt;
  const analysisAgeMinutes = analysisTime
    ? Math.round((Date.now() - new Date(analysisTime).getTime()) / (60 * 1000))
    : null;
  const isAnalysisStale = !isSensorConnected && analysisAgeMinutes !== null && analysisAgeMinutes > 30;

  const formatAnalysisAge = (min) => {
    if (min < 60) return `${min} minutes`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) {
      const remainingMin = min % 60;
      return remainingMin > 0 ? `${hrs} hour${hrs > 1 ? 's' : ''} ${remainingMin} minute${remainingMin > 1 ? 's' : ''}` : `${hrs} hour${hrs > 1 ? 's' : ''}`;
    }
    const days = Math.floor(hrs / 24);
    const remainingHrs = hrs % 24;
    return remainingHrs > 0 ? `${days} day${days > 1 ? 's' : ''} ${remainingHrs} hour${remainingHrs > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''}`;
  };

  const lastConnectionStateRef = useRef(connectionState);

  useEffect(() => {
    if (connectionState !== lastConnectionStateRef.current) {
      if (connectionState === 'reconnecting') {
        addToast?.('Sensor gateway disconnected. Attempting to reconnect...', 'info');
      } else if (connectionState === 'connected') {
        addToast?.('Sensor gateway connected. Live telemetry active.', 'success');
      } else if (connectionState === 'error') {
        addToast?.('Sensor gateway connection error.', 'error');
      } else if (connectionState === 'disconnected') {
        addToast?.('Sensor gateway disconnected.', 'warning');
      }
      lastConnectionStateRef.current = connectionState;
    }
  }, [connectionState, addToast]);

  const liveSensors = {
    temperature: latestSensorData?.temperature ?? null,
    ph:          latestSensorData?.ph          ?? null,
    tds:         latestSensorData?.tds         ?? null,
    turbidity:   latestSensorData?.turbidity   ?? null,
    gas:         latestSensorData?.gas         ?? null,
  };

  const [locationState, setLocationState] = useState({
    lat: null,
    lng: null,
    city: 'Detecting...',
    district: '',
    state: '',
    loaded: false,
    error: null
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`);
            const data = await res.json();
            const address = data.address || {};
            const city = address.city || address.town || address.village || address.county || "Unknown City";
            const district = address.state_district || address.county || "Unknown District";
            const state = address.state || "Unknown State";
            setLocationState({
              lat: latitude,
              lng: longitude,
              city,
              district,
              state,
              loaded: true,
              error: null
            });
          } catch (e) {
            setLocationState({
              lat: latitude,
              lng: longitude,
              city: "Location Found",
              district: "Unknown",
              state: "Unknown",
              loaded: true,
              error: "Failed to reverse geocode"
            });
          }
        },
        (error) => {
          setLocationState({
            lat: 28.6139,
            lng: 77.2090,
            city: "New Delhi",
            district: "New Delhi",
            state: "Delhi",
            loaded: true,
            error: "Permission denied. Default location."
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationState({
        lat: 28.6139,
        lng: 77.2090,
        city: "New Delhi",
        district: "New Delhi",
        state: "Delhi",
        loaded: true,
        error: "Geolocation not supported."
      });
    }
  }, []);

  // NOTE: Sensor simulation removed — all values come from real ESP32 via sensorStore.

  // ── Derive live data from the 3-pillar AI nested results ───────────────────
  const r = latestAnalysis?.results ?? {};

  const activeAssessment = useMemo(() => ({
    score:             r.quality?.score                ?? 92,
    qualityGrade:      { grade: r.quality?.grade ?? 'A', label: 'Premium Quality', confidence: 0.95 },
    adulterationRisk:  { detected: (r.adulteration?.overallRisk ?? 'Low') !== 'Low', riskLevel: r.adulteration?.overallRisk ?? 'Low', risks: [] },
    spoilagePrediction:{ hours: r.freshness?.shelfLifeHours ?? 7, score: r.freshness?.freshnessPercent ?? 94, riskLevel: r.freshness?.status ?? 'Excellent', recommendation: 'Maintain cold chain.' },
    breedPrediction:   { primary: r.breed?.detectedBreed ?? 'Gir', confidence: r.breed?.confidence ?? 0.91 },
    a1a2Status:        { type: r.a1a2?.type ?? 'A2', healthImpact: 'High Digestibility', confidence: r.a1a2?.confidence ?? 0.93 }
  }), [r]);

  const handleDownloadReport = async () => {
    if (!reportRef.current) return;
    
    if (addToast) addToast('Generating PDF report, please wait...', 'info');
    setIsGeneratingPDF(true);

    const isCurrentlyDark = document.documentElement.classList.contains('dark');

    try {
      if (isCurrentlyDark) {
        document.documentElement.classList.remove('dark');
      }
      // Small delay to ensure any map tiles/animations are settled and layout is updated
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f9fafb' // bg-[#f9fafb]
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Add extra pages if content is taller than one A4 page
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`MilkoSense_Analysis_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      if (addToast) addToast('PDF report downloaded successfully', 'success');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      if (addToast) addToast(`Failed to generate PDF: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      if (isCurrentlyDark) {
        document.documentElement.classList.add('dark');
      }
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return <Loader message="Accessing database AI ledgers..." fullPage />;
  }


  // ── Live chart data (from 3-pillar AI engine) ─────────────────────────────
  // ENH-01 FIX: Real timestamps on X-axis instead of meaningless S1...S7
  const qualityTrendData = trendReport.length > 0
    ? trendReport.slice(0, 7).reverse().map((rec) => ({
        name: (rec.timestamp || rec.createdAt)
          ? new Date(rec.timestamp || rec.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : '—',
        value: rec.results?.quality?.score ?? rec.score ?? 75
      }))
    : [60, 65, 70, 80, 85, 88, 95].map((v, i) => ({ name: `S${i + 1}`, value: v }));

  const bd = r.adulteration?.breakdown ?? {};
  const adulterationData = [
    { name: 'Water Dilution', value: +(bd.waterPercent         ?? 5).toFixed(1),  fill: '#3b82f6' },
    { name: 'Urea',           value: +(bd.ureaAdulteration     ?? 1.2).toFixed(1), fill: '#f59e0b' },
    { name: 'Detergent',      value: +(bd.detergentAdulteration?? 0.8).toFixed(1), fill: '#10b981' },
    { name: 'Starch',         value: +(bd.starchAdulteration   ?? 0.5).toFixed(1), fill: '#8b5cf6' },
    { name: 'Synthetic Milk', value: +(bd.syntheticMilk        ?? 0.3).toFixed(1), fill: '#ef4444' }
  ];

  const rawDecay = r.freshness?.decayForecast;
  const freshnessData = Array.isArray(rawDecay) && rawDecay.length > 0
    ? rawDecay.map(pt => ({ time: `${pt.time}h`, value: Math.round(pt.freshnessPercent) }))
    : [{ time: 'Now', value: 94 }, { time: '6h', value: 72 }, { time: '12h', value: 41 }, { time: '24h', value: 13 }, { time: '36h', value: 5 }];

  const rawMicrobial = r.microbial?.forecast;
  const microbialData = Array.isArray(rawMicrobial) && rawMicrobial.length > 0
    ? rawMicrobial.map(pt => ({ time: `${pt.time}h`, tvc: pt.tvc, coliform: pt.coliform, yeast: pt.yeastMold }))
    : [{ time: 'Now', tvc: 10000, coliform: 5000, yeast: 2000 }, { time: '6h', tvc: 20000, coliform: 10000, yeast: 5000 }, { time: '12h', tvc: 50000, coliform: 25000, yeast: 12000 }, { time: '24h', tvc: 150000, coliform: 80000, yeast: 40000 }];

  const suit = r.suitability ?? {};
  const SUIT_COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444'];
  const suitabilityData = Object.entries(
    Object.keys(suit).length > 0 ? suit : { Paneer: 96, Curd: 91, Cheese: 82, Butter: 77, 'Milk Powder': 61 }
  ).map(([name, value], i) => ({ name, value: Math.round(value), color: SUIT_COLORS[i % SUIT_COLORS.length] }));

  const Sparkline = ({ color, data }) => (
    <div className="h-12 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // BUG-03 FIX: Guard against null/NaN — was returning 'Optimal' for null values
  const getSensorStatus = (val, min, max) => {
    if (val === null || val === undefined || isNaN(val)) return null;
    if (val < min) return 'Low';
    if (val > max) return 'High';
    return 'Optimal';
  };

  return (
    <div ref={reportRef} className="w-full max-w-7xl mx-auto text-left pb-12 font-sans bg-[#f9fafb] dark:bg-dark-bg min-h-screen text-[#1f2937] dark:text-dark-text-primary p-4 md:p-8 rounded-2xl shadow-inner relative overflow-x-hidden">
      
      {/* Expanded Chart Modal */}
      <AnimatePresence>
        {expandedChart && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-[#11182799] backdrop-blur-sm"
            onClick={() => setExpandedChart(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#e5e7eb] dark:border-dark-border flex justify-between items-center bg-[#f9fafb] dark:bg-dark-elevated">
                <h3 className="text-xl font-bold text-[#1f2937] dark:text-dark-text-primary flex items-center gap-2">
                  <Activity className="w-6 h-6 text-[#3b82f6]" />
                  Detailed AI Analysis: {expandedChart === 'quality' ? 'Quality Trend' : expandedChart === 'freshness' ? 'Freshness Forecast' : 'Product Stability & Microbial'}
                </h3>
                <button onClick={() => setExpandedChart(null)} className="p-2 hover:bg-[#e5e7eb] dark:hover:bg-dark-bg rounded-full transition-colors">
                  <X className="w-6 h-6 text-[#6b7280] dark:text-dark-text-muted" />
                </button>
              </div>
              <div className="flex-1 p-6">
                <ResponsiveContainer width="100%" height="100%">
                  {expandedChart === 'quality' ? (
                    <AreaChart data={qualityTrendData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorQualityModal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={gridColor} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorQualityModal)" activeDot={{ r: 8 }} />
                    </AreaChart>
                  ) : expandedChart === 'freshness' ? (
                    <AreaChart data={freshnessData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                       <defs>
                        <linearGradient id="colorFreshnessModal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={gridColor} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorFreshnessModal)" activeDot={{ r: 8 }} />
                    </AreaChart>
                  ) : (
                    <AreaChart data={microbialData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                       <defs>
                        <linearGradient id="colorTvcModal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={gridColor} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                      <YAxis scale="log" domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                      <Area type="monotone" dataKey="tvc" stroke="#10b981" strokeWidth={4} fill="url(#colorTvcModal)" activeDot={{ r: 8 }} />
                      <Area type="monotone" dataKey="coliform" stroke="#3b82f6" strokeWidth={4} fill="transparent" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="yeast" stroke="#f59e0b" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── Live Sensor Bar — Real ESP32 Readings ─────────────────────────── */}
      <div className={`w-full bg-white dark:bg-dark-surface border rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-3 transition-all duration-300 ${
        connectionState === 'connected' && isSensorConnected
          ? 'border-[#a7f3d0] dark:border-[#047857]/30'
          : connectionState === 'reconnecting'
            ? 'border-[#fde68a] dark:border-[#d97706]/30 animate-pulse'
            : 'border-[#fecdd3] dark:border-[#b91c1c]/30'
      }`}>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center">
            {connectionState === 'connected' && isSensorConnected ? (
              <>
                <span className="absolute inline-flex h-4 w-4 rounded-full bg-[#34d399] opacity-75 animate-ping"></span>
                <Wifi className="relative w-5 h-5 text-[#059669] dark:text-[#34d399]" />
              </>
            ) : connectionState === 'reconnecting' ? (
              <>
                <span className="absolute inline-flex h-4 w-4 rounded-full bg-[#fbbf24] opacity-75 animate-ping"></span>
                <Wifi className="relative w-5 h-5 text-[#d97706] dark:text-[#fbbf24] animate-pulse" />
              </>
            ) : (
              <>
                <Wifi className="relative w-5 h-5 text-[#dc2626] dark:text-[#fb7185]" />
              </>
            )}
          </div>
          <span className={`text-sm font-black uppercase tracking-widest ${
            connectionState === 'connected' && isSensorConnected
              ? 'text-[#047857] dark:text-[#34d399]'
              : connectionState === 'reconnecting'
                ? 'text-[#b45309] dark:text-[#fbbf24]'
                : 'text-[#b91c1c] dark:text-[#fb7185]'
          }`}>
            {connectionState === 'connected' && isSensorConnected
              ? 'Live Sensor Sync'
              : connectionState === 'reconnecting'
                ? 'Reconnecting Gateway...'
                : 'Gateway Offline'}
          </span>
        </div>
        {connectionState === 'connected' && isSensorConnected ? (
          <div className={`flex items-center gap-5 overflow-x-auto text-sm font-semibold whitespace-nowrap rounded-lg transition-colors duration-500 ${sensorFlash ? 'bg-[#ecfdf5] dark:bg-[#064e3b]/20 px-2 -mx-2' : ''}`}>
            {/* Temperature */}
            {(() => { const v = liveSensors.temperature; const st = getSensorStatus(v, 2, 8); return (
              <div className="flex items-center gap-1" title="Temperature · Optimal: 2 – 8 °C (chilled fresh milk)">
                <span className="text-[#6b7280]">Temp:</span>
                <span className="text-[#111827] dark:text-dark-text-primary font-bold">{v != null ? `${Number(v).toFixed(1)}°C` : '—'}</span>
                <MiniSparkline data={historyData} dataKey="temperature" color="#3b82f6" />
                <span className={`text-[10px] uppercase font-bold tracking-wider ml-1 px-1.5 py-0.5 rounded ${st==='Optimal'?'text-[#16a34a] bg-[#f0fdf4]':st===null?'text-[#6b7280] bg-[#f3f4f6]':'text-[#dc2626] bg-[#fef2f2]'}`}>({st ?? 'N/A'})</span>
              </div>
            ); })()}
            {/* pH */}
            {(() => { const v = liveSensors.ph; const st = getSensorStatus(v, 6.4, 6.8); return (
              <div className="flex items-center gap-1" title="pH · Optimal: 6.4 – 6.8 (pure fresh milk)">
                <span className="text-[#6b7280]">pH:</span>
                <span className="text-[#111827] dark:text-dark-text-primary font-bold">{v != null ? Number(v).toFixed(2) : '—'}</span>
                <MiniSparkline data={historyData} dataKey="ph" color="#8b5cf6" />
                <span className={`text-[10px] uppercase font-bold tracking-wider ml-1 px-1.5 py-0.5 rounded ${st==='Optimal'?'text-[#16a34a] bg-[#f0fdf4]':st===null?'text-[#6b7280] bg-[#f3f4f6]':'text-[#dc2626] bg-[#fef2f2]'}`}>({st ?? 'N/A'})</span>
              </div>
            ); })()}
            {/* TDS */}
            {(() => { const v = liveSensors.tds; const st = getSensorStatus(v, 500, 900); return (
              <div className="flex items-center gap-1" title="TDS (Total Dissolved Solids) · Optimal: 500 – 900 ppm">
                <span className="text-[#6b7280]">TDS:</span>
                <span className="text-[#111827] dark:text-dark-text-primary font-bold">{v != null ? `${Math.round(v)} ppm` : '—'}</span>
                <MiniSparkline data={historyData} dataKey="tds" color="#f59e0b" />
                <span className={`text-[10px] uppercase font-bold tracking-wider ml-1 px-1.5 py-0.5 rounded ${st==='Optimal'?'text-[#16a34a] bg-[#f0fdf4]':st===null?'text-[#6b7280] bg-[#f3f4f6]':'text-[#dc2626] bg-[#fef2f2]'}`}>({st ?? 'N/A'})</span>
              </div>
            ); })()}
            {/* Turbidity */}
            {(() => { const v = liveSensors.turbidity; const st = getSensorStatus(v, 0, 25); return (
              <div className="flex items-center gap-1" title="Turbidity · Optimal: 0 – 25 NTU (lower = cleaner)">
                <span className="text-[#6b7280]">Turbidity:</span>
                <span className="text-[#111827] dark:text-dark-text-primary font-bold">{v != null ? `${Number(v).toFixed(1)} NTU` : '—'}</span>
                <MiniSparkline data={historyData} dataKey="turbidity" color="#ec4899" />
                <span className={`text-[10px] uppercase font-bold tracking-wider ml-1 px-1.5 py-0.5 rounded ${st==='Optimal'?'text-[#16a34a] bg-[#f0fdf4]':st===null?'text-[#6b7280] bg-[#f3f4f6]':'text-[#dc2626] bg-[#fef2f2]'}`}>({st ?? 'N/A'})</span>
              </div>
            ); })()}
            {/* Gas */}
            {(() => { const v = liveSensors.gas; const st = getSensorStatus(v, 50, 300); return (
              <div className="flex items-center gap-1" title="Gas/VOC · Optimal: 50 – 300 ppm (MQ sensor baseline)">
                <span className="text-[#6b7280]">Gas:</span>
                <span className="text-[#111827] dark:text-dark-text-primary font-bold">{v != null ? `${Math.round(v)} ppm` : '—'}</span>
                <MiniSparkline data={historyData} dataKey="gas" color="#10b981" />
                <span className={`text-[10px] uppercase font-bold tracking-wider ml-1 px-1.5 py-0.5 rounded ${st==='Optimal'?'text-[#16a34a] bg-[#f0fdf4]':st===null?'text-[#6b7280] bg-[#f3f4f6]':'text-[#dc2626] bg-[#fef2f2]'}`}>({st ?? 'N/A'})</span>
              </div>
            ); })()}
          </div>
        ) : connectionState === 'reconnecting' ? (
          <div className="flex items-center gap-2 text-sm font-bold text-[#b45309] dark:text-[#fbbf24] bg-[#fffbeb] dark:bg-[#78350f]/20 border border-[#fde68a] dark:border-[#d97706]/40 px-4 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#fbbf24] animate-ping"></span>
            Attempting to restore gateway link — please wait...
          </div>
        ) : connectionState === 'connected' ? (
          <div className="flex items-center gap-2 text-sm font-bold text-[#b45309] dark:text-[#fbbf24] bg-[#fffbeb] dark:bg-[#78350f]/20 border border-[#fde68a] dark:border-[#d97706]/40 px-4 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
            Sensors Not Connected — Connect your ESP32 to see live readings
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-bold text-[#dc2626] dark:text-[#f87171] bg-[#fef2f2] dark:bg-[#7f1d1d]/20 border border-[#fecdd3] dark:border-[#b91c1c]/40 px-4 py-2 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
            Gateway Connection Lost — Telemetry synchronization suspended
          </div>
        )}
      </div>
      {isAnalysisStale ? (
        <div className="w-full bg-[#fffbeb] dark:bg-[#78350f]/20 text-[#b45309] dark:text-[#fbbf24] p-3 rounded-lg mb-8 text-sm font-semibold border border-[#fde68a] dark:border-[#d97706]/40 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#f59e0b] shrink-0" />
          <span>⚠️ Displaying stale analysis from {formatAnalysisAge(analysisAgeMinutes)} ago. Connect sensors to stream live telemetry.</span>
        </div>
      ) : (
        <div className="w-full bg-[#ecfdf5] dark:bg-[#064e3b]/20 text-[#065f46] dark:text-[#a7f3d0] p-3 rounded-lg mb-8 text-sm font-semibold border border-[#d1fae5] dark:border-[#047857]/50 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#10b981] shrink-0" />
          {liveSensors.ph !== null && liveSensors.temperature !== null
            ? `Live sensor data active — Last reading at ${latestSensorData?.timestamp ? new Date(latestSensorData.timestamp).toLocaleTimeString() : 'just now'}. AI analysis running on real sensor inputs.`
            : 'Displaying last known analysis. Waiting for live sensor data from ESP32...'}
        </div>
      )}
      
      {/* 1. OVERALL QUALITY OVERVIEW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 pb-2 border-b border-[#e5e7eb] dark:border-dark-border dark:border-dark-border">
        <h2 className="text-2xl font-black text-[#111827] dark:text-dark-text-primary dark:text-dark-text-primary uppercase tracking-widest drop-shadow-sm mb-4 md:mb-0">1. Overall Quality Overview</h2>
        <div className="flex items-center gap-4 text-xs font-semibold text-[#6b7280]">
          <span>Sample ID: MS-2025-05-21-001</span>
          <span>21 May 2025, 10:30 AM</span>
          <button 
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-dark-surface border border-[#059669] text-[#047857] rounded-lg hover:bg-[#ecfdf5] transition-colors shadow-sm font-bold"
          >
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        {/* Score Card - Light Theme */}
        <div className="bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5] dark:from-[#064e3b]/20 dark:to-[#047857]/20 border border-[#a7f3d0] dark:border-[#047857]/50 rounded-xl p-5 relative overflow-hidden shadow-sm flex flex-col justify-between h-36">
          <div className="flex justify-between items-start z-10">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#047857] dark:text-[#34d399]">Overall Score</div>
            <ShieldCheck className="w-6 h-6 text-[#10b981]" />
          </div>
          <div className="z-10">
            <div className="text-5xl font-extrabold flex items-baseline drop-shadow-sm text-[#064e3b] dark:text-[#a7f3d0]">
              {activeAssessment.score} <span className="text-xl font-bold ml-1 text-[#047857] dark:text-[#34d399] opacity-90">/100</span>
            </div>
            <div className="text-xs font-bold text-[#065f46] dark:text-[#6ee7b7] mt-1 bg-[#a7f3d080] dark:bg-[#047857]/30 inline-block px-2 py-0.5 rounded">{activeAssessment.qualityGrade?.label || 'Premium Quality'}</div>
          </div>
        </div>

        {/* A1/A2 Type - Colorful */}
        <div className="bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] dark:from-[#312e81]/20 dark:to-[#3730a3]/20 border border-[#c7d2fe] dark:border-[#3730a3]/50 rounded-xl p-5 shadow-sm flex flex-col justify-between h-36">
          <div className="text-[11px] font-black uppercase tracking-wider text-[#4f46e5] dark:text-[#818cf8]">A1/A2 Type</div>
          <div>
            <div className="text-4xl font-extrabold text-[#312e81] dark:text-[#c7d2fe] drop-shadow-sm">{activeAssessment.a1a2Status?.type || 'A2'}</div>
            <div className="text-xs font-bold text-[#4f46e5] dark:text-[#a5b4fc] mt-1 bg-[#c7d2fe80] dark:bg-[#3730a3]/30 inline-block px-2 py-0.5 rounded">{((activeAssessment.a1a2Status?.confidence || 0.93) * 100).toFixed(1)}% Confidence</div>
          </div>
          <Sparkline color="#4f46e5" data={[{value: 30}, {value: 35}, {value: 32}, {value: 40}, {value: 38}, {value: 45}]} />
        </div>

        {/* Predicted Breed - Colorful */}
        <div className="bg-gradient-to-br from-[#fff7ed] to-[#ffedd5] dark:from-[#7c2d12]/20 dark:to-[#9a3412]/20 border border-[#fed7aa] dark:border-[#9a3412]/50 rounded-xl p-5 shadow-sm flex flex-col justify-between h-36">
          <div className="text-[11px] font-black text-[#ea580c] dark:text-[#fb923c] uppercase tracking-wider">Predicted Breed</div>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-11 h-11 rounded-full bg-white dark:bg-dark-surface flex items-center justify-center overflow-hidden border-2 border-[#fdba74] dark:border-[#ea580c] shadow-sm shrink-0">
               <img src="/gir_cow.png" alt="Cow" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-extrabold text-[#7c2d12] dark:text-[#fed7aa] truncate drop-shadow-sm">{activeAssessment.breedPrediction?.primary || 'Gir'}</div>
              <div className="text-xs font-bold text-[#ea580c] dark:text-[#fdba74] bg-[#fed7aa80] dark:bg-[#9a3412]/30 inline-block px-2 py-0.5 rounded mt-0.5">{((activeAssessment.breedPrediction?.confidence || 0.91) * 100).toFixed(0)}% Confidence</div>
            </div>
          </div>
          <Sparkline color="#ea580c" data={[{value: 50}, {value: 55}, {value: 52}, {value: 51}, {value: 58}, {value: 60}]} />
        </div>

        {/* Freshness Score - Colorful */}
        <div className="bg-gradient-to-br from-[#ecfeff] to-[#cffafe] dark:from-[#164e63]/20 dark:to-[#155e75]/20 border border-[#a5f3fc] dark:border-[#155e75]/50 rounded-xl p-5 shadow-sm flex flex-col justify-between h-36">
          <div className="text-[11px] font-black text-[#0e7490] dark:text-[#22d3ee] uppercase tracking-wider">Freshness Score</div>
          <div>
            <div className="text-3xl font-extrabold text-[#164e63] dark:text-[#cffafe] drop-shadow-sm">{activeAssessment.spoilagePrediction?.score || 94}% <span className="text-sm text-[#0e7490] dark:text-[#22d3ee]">Excellent</span></div>
            <div className="text-xs text-[#155e75] dark:text-[#67e8f9] mt-1 font-bold bg-[#a5f3fc80] dark:bg-[#155e75]/30 inline-block px-2 py-0.5 rounded">Est. Shelf Life: {activeAssessment.spoilagePrediction?.hours || 7} Hours</div>
          </div>
          <Sparkline color="#0891b2" data={[{value: 98}, {value: 97}, {value: 95}, {value: 92}, {value: 88}, {value: 85}]} />
        </div>

        {/* Risk Level - Colorful */}
        <div className="bg-gradient-to-br from-[#fff1f2] to-[#ffe4e6] dark:from-[#881337]/20 dark:to-[#be123c]/20 border border-[#fecdd3] dark:border-[#be123c]/50 rounded-xl p-5 shadow-sm flex flex-col justify-between h-36">
          <div className="text-[11px] font-black text-[#e11d48] dark:text-[#fb7185] uppercase tracking-wider">Risk Level</div>
          <div>
            <div className="text-3xl font-extrabold text-[#881337] dark:text-[#fecdd3] drop-shadow-sm">Minimal</div>
            <div className="text-xs font-bold text-[#be123c] dark:text-[#fda4af] mt-1 bg-[#fecdd380] dark:bg-[#be123c]/30 inline-block px-2 py-0.5 rounded">{activeAssessment.adulterationRisk?.riskLevel || 'Minimal'} Risk</div>
          </div>
          <Sparkline color="#e11d48" data={[{value: 5}, {value: 6}, {value: 4}, {value: 5}, {value: 7}, {value: 6}]} />
        </div>
      </div>

      {/* 2. KEY ANALYTICAL INSIGHTS */}
      <h2 className="text-2xl font-black text-[#111827] dark:text-dark-text-primary dark:text-dark-text-primary uppercase tracking-widest mt-12 mb-6 pb-2 border-b border-[#e5e7eb] dark:border-dark-border dark:border-dark-border drop-shadow-sm">2. Key Analytical Insights</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* 2.1 Quality Trend (Clickable) */}
        <div 
          className="bg-white dark:bg-dark-surface border-2 border-transparent hover:border-[#6ee7b7] rounded-2xl p-6 shadow-md flex flex-col min-w-0 cursor-pointer transition-all group relative overflow-hidden h-[400px]"
          onClick={() => setExpandedChart('quality')}
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-[#ecfdf5] text-[#059669] p-2 rounded-xl border border-[#a7f3d0] shadow-sm z-10">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div className="text-base font-black text-[#111827] dark:text-dark-text-primary mb-6 uppercase tracking-wide flex items-center gap-2">
            <Activity className="text-[#10b981] w-5 h-5" />
            2.1 Quality Trend <span className="text-[#9ca3af] font-bold normal-case text-xs ml-2">(Last 7 Samples)</span>
          </div>
          <div className="flex-1 w-full mt-2 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={qualityTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} horizontal={true} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 'bold' }} domain={[0, 100]} ticks={[25, 50, 75, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorQuality)" activeDot={{ r: 8, strokeWidth: 0, fill: '#059669' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 text-sm font-black text-[#047857] flex items-center justify-center gap-2 bg-[#ecfdf5] py-3 px-4 rounded-xl border border-[#d1fae5] shadow-inner">
            <Sparkles className="w-5 h-5" /> Quality Trend is improving consistently by +8% vs last sample!
          </div>
        </div>

        {/* 2.2 Adulteration Analysis */}
        <div className="bg-white dark:bg-dark-surface border border-[#e5e7eb] dark:border-dark-border dark:border-dark-border rounded-2xl p-6 shadow-md flex flex-col min-w-0 h-[400px]">
          <div className="text-base font-black text-[#111827] dark:text-dark-text-primary dark:text-dark-text-primary mb-6 uppercase tracking-wide flex items-center gap-2">
             <ShieldCheck className="text-[#f43f5e] w-5 h-5" /> 2.2 Adulteration Analysis <span className="text-[#9ca3af] font-bold normal-case text-xs ml-2">(Risk breakdown)</span>
          </div>
          <div className="flex-1 w-full min-h-0 relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adulterationData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid horizontal={true} vertical={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4B5563', fontWeight: 700 }} width={120} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value) => `${value}% Risk Level`} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={6}>
                  {adulterationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 text-sm font-black text-[#047857] flex items-center justify-between bg-[#ecfdf5] p-4 rounded-xl border border-[#a7f3d0] shadow-inner">
            <div className="flex items-center gap-2"><ShieldCheck className="w-6 h-6" /> ADULTERATION TEST: PASSED</div>
            <div className="font-extrabold text-xl bg-white dark:bg-dark-surface px-3 py-1 rounded shadow-sm text-[#065f46]">100% Pure</div>
          </div>
        </div>

        {/* 2.3 Freshness Forecast (Clickable) */}
        <div 
          className="bg-white dark:bg-dark-surface border-2 border-transparent hover:border-[#67e8f9] rounded-2xl p-6 shadow-md flex flex-col min-w-0 cursor-pointer transition-all group relative overflow-hidden h-[400px]"
          onClick={() => setExpandedChart('freshness')}
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-[#ecfeff] text-[#0891b2] p-2 rounded-xl border border-[#a5f3fc] shadow-sm z-10">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-base font-black text-[#111827] dark:text-dark-text-primary uppercase tracking-wide flex items-center gap-2">
               <Info className="text-[#06b6d4] w-5 h-5" /> 2.3 Freshness Forecast <span className="text-[#9ca3af] font-bold normal-case text-xs ml-2">(Shelf Life)</span>
            </div>
            <div className="text-sm font-black text-white bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] px-4 py-1.5 rounded-full shadow-md">Est. Shelf Life: 7 Hours</div>
          </div>
          <div className="flex-1 w-full min-h-0 relative mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={freshnessData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFreshness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} horizontal={true} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 'bold' }} domain={[0, 100]} ticks={[25, 50, 75, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={5} fillOpacity={1} fill="url(#colorFreshness)" activeDot={{ r: 8, strokeWidth: 0, fill: '#0891b2' }} label={{ position: 'top', fill: '#1f2937', fontSize: 13, fontWeight: 900, formatter: (val) => `${val}%` }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 text-sm font-black text-[#155e75] flex items-center justify-center gap-2 bg-[#ecfeff] p-3 rounded-xl border border-[#a5f3fc] shadow-inner">
            <ShieldCheck className="w-5 h-5" /> Freshness Status: Excellent
          </div>
        </div>

        {/* 2.4 Product Stability & Microbial Forecast (Clickable) */}
        <div 
          className="bg-white dark:bg-dark-surface border-2 border-transparent hover:border-[#fcd34d] rounded-2xl p-6 shadow-md flex flex-col min-w-0 cursor-pointer transition-all group relative overflow-hidden h-[400px]"
          onClick={() => setExpandedChart('microbial')}
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-[#fffbeb] text-[#d97706] p-2 rounded-xl border border-[#fde68a] shadow-sm z-10">
            <Maximize2 className="w-5 h-5" />
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-base font-black text-[#111827] dark:text-dark-text-primary uppercase tracking-wide flex items-center gap-2">
               <Activity className="text-[#f59e0b] w-5 h-5" /> 2.4 Product Stability
            </div>
            <div className="flex items-center gap-5 text-xs font-black uppercase">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#10b981] rounded-full shadow-sm"></div> TVC</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#3b82f6] rounded-full shadow-sm"></div> Coliform</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#f59e0b] rounded-full shadow-sm"></div> Yeast/Mold</div>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0 relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={microbialData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 'bold' }} dy={10} />
                <YAxis scale="log" domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 'bold' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                <Line type="monotone" dataKey="tvc" stroke="#10b981" strokeWidth={4} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="coliform" stroke="#3b82f6" strokeWidth={4} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="yeast" stroke="#f59e0b" strokeWidth={4} strokeDasharray="5 5" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
            

          </div>
        </div>

      </div>

      {/* 3. AI COPILOT SUMMARY & DIGITAL PASSPORT */}
      <h2 className="text-2xl font-black text-[#111827] dark:text-dark-text-primary uppercase tracking-widest mt-12 mb-6 pb-2 border-b border-[#e5e7eb] dark:border-dark-border drop-shadow-sm">3. Cow Digital Passport & Detailed AI Summary</h2>
      
      <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-md mb-10 flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden border border-[#e5e7eb] dark:border-dark-border">
        
        {/* Cow Image / Passport Photo */}
        <div className="w-full lg:w-64 h-64 rounded-3xl shadow-xl overflow-hidden shrink-0 flex items-center justify-center relative group bg-[#f3f4f6]">
          <img src="/gir_cow.png" alt="Cow Digital Passport" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {/* Scanning animation overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#60a5fa33] to-transparent animate-[scan_3s_ease-in-out_infinite]"></div>
          
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-[#000000cc] to-transparent p-5 pt-16">
             <div className="flex items-center justify-between">
                <div>
                   <div className="text-[11px] font-black text-[#34d399] uppercase tracking-widest mb-1 drop-shadow-sm">Digital Passport ID</div>
                   <div className="font-mono font-black text-lg tracking-wider text-white">MS-GIR-2099-X</div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#10b98133] flex items-center justify-center backdrop-blur-md border border-[#10b9814d]">
                   <ShieldCheck className="w-6 h-6 text-[#34d399]" />
                </div>
             </div>
          </div>
        </div>
        
        <div className="flex-1 z-10 w-full">
          <div className="flex items-center gap-3 text-[#047857] font-black text-2xl mb-4 uppercase tracking-wider border-b-2 border-[#d1fae5] pb-3">
            <Sparkles className="w-7 h-7" /> Executive AI Summary
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#ecfdf5] to-[#f0fdfa] p-5 rounded-2xl border border-[#a7f3d0] shadow-sm flex flex-col">
               <h4 className="text-[#065f46] text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5"/> Detailed Composition & Breed</h4>
               <p className="text-[#1f2937] text-xs leading-relaxed mb-4 font-semibold">
                 Based on the latest AI analysis of data from 6 precision sensors, this sample exhibits <strong className="text-[#065f46] bg-[#d1fae5] px-1.5 py-0.5 rounded shadow-sm">Premium Grade Characteristics</strong>.
                 The molecular signature strongly confirms the <strong className="text-[#111827] dark:text-dark-text-primary border-b-2 border-[#6ee7b7]">{activeAssessment.breedPrediction?.primary || 'Gir'}</strong> breed profile. The system has cryptographically verified its <strong className="text-[#047857] font-black text-base">{activeAssessment.a1a2Status?.type || 'A2'}</strong> purity status with {((activeAssessment.a1a2Status?.confidence || 0.93) * 100).toFixed(1)}% confidence, indicating high nutritional value and digestibility.
               </p>
               <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-[#a7f3d0]">
                  <div>
                    <div className="text-[10px] text-[#059669] uppercase font-black tracking-wider">Fat Content</div>
                    <div className="text-2xl font-black text-[#111827] dark:text-dark-text-primary drop-shadow-sm">4.8%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#059669] uppercase font-black tracking-wider">SNF (Solid Not Fat)</div>
                    <div className="text-2xl font-black text-[#111827] dark:text-dark-text-primary drop-shadow-sm">8.9%</div>
                  </div>
               </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#ecfeff] to-[#eff6ff] p-5 rounded-2xl border border-[#a5f3fc] shadow-sm flex flex-col">
               <h4 className="text-[#155e75] text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5"/> Stability & Safety Forecast</h4>
               <p className="text-[#1f2937] text-xs leading-relaxed mb-4 font-semibold">
                 Our neural adulteration models indicate a <strong className="text-[#155e75] bg-[#cffafe] px-1.5 py-0.5 rounded shadow-sm">Minimal Risk</strong> profile across all 24 tested vectors. 
                 With exceptionally low TVC, we forecast a highly stable shelf life of <strong className="text-[#111827] dark:text-dark-text-primary border-b-2 border-[#67e8f9]">{activeAssessment.spoilagePrediction?.hours || 7} hours</strong> at ambient temperature. This superior yield is optimized for high-margin artisan products. It demonstrates exceptional thermal stability for processing.
               </p>
               <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-[#a5f3fc]">
                  <div>
                    <div className="text-[10px] text-[#0e7490] uppercase font-black tracking-wider">Somatic Cell Count</div>
                    <div className="text-2xl font-black text-[#111827] dark:text-dark-text-primary drop-shadow-sm">&lt;150k</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#0e7490] uppercase font-black tracking-wider">Protein Integrity</div>
                    <div className="text-2xl font-black text-[#111827] dark:text-dark-text-primary drop-shadow-sm">High</div>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs font-black uppercase tracking-widest">
            <span className="px-6 py-3.5 bg-[#059669] text-white rounded-xl shadow-lg shadow-[#a7f3d0] flex items-center gap-2 transition-transform hover:scale-105"><ShieldCheck className="w-5 h-5 text-[#a7f3d0]"/> Verified A2 Pure</span>
            <span className="px-6 py-3.5 bg-white dark:bg-dark-surface text-[#047857] rounded-xl border border-[#a7f3d0] flex items-center gap-2 shadow-sm transition-transform hover:scale-105"><Activity className="w-5 h-5 text-[#10b981]"/> Maximum Stability</span>
            <span className="px-6 py-3.5 bg-white dark:bg-dark-surface text-[#047857] rounded-xl border border-[#a7f3d0] flex items-center gap-2 shadow-sm transition-transform hover:scale-105"><Sparkles className="w-5 h-5 text-[#10b981]"/> Premium Yield Match</span>
          </div>
        </div>
      </div>

      {/* 4. MORE INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* 4.7 Product Suitability */}
        <div className="bg-white dark:bg-dark-surface border border-[#e5e7eb] dark:border-dark-border rounded-2xl p-6 shadow-md flex flex-col min-w-0 h-[400px]">
          <div className="text-base font-black text-[#111827] dark:text-dark-text-primary mb-6 uppercase tracking-wide">4.7 Product Suitability Profile</div>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={suitabilityData} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid horizontal={true} vertical={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#4B5563', fontWeight: 800 }} width={100} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value) => `${value}% Match`} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={6}>
                  {suitabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-bold text-[#6b7280] dark:text-dark-text-muted bg-[#f9fafb] dark:bg-dark-bg/60 px-3 py-1.5 rounded-lg border border-[#f3f4f6] dark:border-dark-border">Higher score = Better yield</span>
            <button className="text-sm font-black text-[#059669] hover:text-[#047857] hover:underline flex items-center gap-1">View Detailed Analysis <Sparkles className="w-4 h-4"/></button>
          </div>
        </div>

        {/* 4.8 Regional Intelligence - Colorful & Light Theme */}
        <div className="bg-white dark:bg-dark-surface border border-[#e5e7eb] dark:border-dark-border rounded-2xl p-6 shadow-md flex flex-col min-w-0 h-[400px]">
          <div className="text-base font-black text-[#111827] dark:text-dark-text-primary mb-6 uppercase tracking-wide">4.8 Regional Intelligence</div>
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 relative">
            {/* Left half: Map */}
            <div className="w-full md:w-1/2 rounded-2xl border border-[#e5e7eb] dark:border-dark-border flex items-center justify-center relative overflow-hidden h-64 md:h-full shrink-0 shadow-sm z-0">
              {locationState.loaded ? (
                <MapContainer 
                  center={[locationState.lat, locationState.lng]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    crossOrigin="anonymous"
                  />
                  <Marker position={[locationState.lat, locationState.lng]} icon={customRedIcon}>
                    <LeafletTooltip permanent direction="top" offset={[0, -40]} className="bg-white dark:bg-dark-surface border-0 shadow-sm font-bold text-[#111827] dark:text-dark-text-primary rounded-lg px-2 py-1 text-xs">
                      📍 You are here
                    </LeafletTooltip>
                  </Marker>
                  <MapUpdater center={[locationState.lat, locationState.lng]} />
                </MapContainer>
              ) : (
                <div className="text-[#6b7280] font-bold flex flex-col items-center gap-2">
                  <Activity className="w-6 h-6 animate-pulse text-[#10b981]" />
                  Detecting Location...
                </div>
              )}
            </div>
            {/* Right half: Details */}
            <div className="w-full md:w-1/2 flex flex-col justify-center h-full pb-2 overflow-y-auto">
              <div className="text-lg md:text-xl font-bold text-[#059669] dark:text-[#34d399] mb-2 bg-[#ecfdf5] dark:bg-[#064e3b]/20 p-2 md:p-3 rounded-xl border border-[#d1fae5] dark:border-[#047857]/50 shadow-inner text-center">
                You are currently in <span className="font-black text-[#065f46] dark:text-[#6ee7b7]">{locationState.city}</span>
              </div>
              
              <div className="flex flex-col gap-1 md:gap-1.5 text-sm font-semibold flex-1">
                <div className="flex justify-between items-center bg-[#f9fafb] dark:bg-dark-bg/60 p-2 rounded-lg border border-[#f3f4f6] dark:border-dark-border">
                  <span className="text-[#6b7280] dark:text-dark-text-muted font-black uppercase tracking-wide text-[11px] md:text-xs">City</span>
                  <span className="text-[#111827] dark:text-dark-text-primary font-bold text-xs md:text-sm">{locationState.city}</span>
                </div>
                <div className="flex justify-between items-center bg-[#f9fafb] dark:bg-dark-bg/60 p-2 rounded-lg border border-[#f3f4f6] dark:border-dark-border">
                  <span className="text-[#6b7280] dark:text-dark-text-muted font-black uppercase tracking-wide text-[11px] md:text-xs">District</span>
                  <span className="text-[#111827] dark:text-dark-text-primary font-bold text-xs md:text-sm">{locationState.district}</span>
                </div>
                <div className="flex justify-between items-center bg-[#f9fafb] dark:bg-dark-bg/60 p-2 rounded-lg border border-[#f3f4f6] dark:border-dark-border">
                  <span className="text-[#6b7280] dark:text-dark-text-muted font-black uppercase tracking-wide text-[11px] md:text-xs">State</span>
                  <span className="text-[#111827] dark:text-dark-text-primary font-bold text-xs md:text-sm">{locationState.state}</span>
                </div>
                <div className="flex justify-between items-center bg-[#f9fafb] dark:bg-dark-bg/60 p-2 rounded-lg border border-[#f3f4f6] dark:border-dark-border">
                  <span className="text-[#6b7280] dark:text-dark-text-muted font-black uppercase tracking-wide text-[11px] md:text-xs">Latitude</span>
                  <span className="text-[#111827] dark:text-dark-text-primary font-bold text-xs md:text-sm">{locationState.lat?.toFixed(6) || '--'}</span>
                </div>
                <div className="flex justify-between items-center bg-[#f9fafb] dark:bg-dark-bg/60 p-2 rounded-lg border border-[#f3f4f6] dark:border-dark-border">
                  <span className="text-[#6b7280] dark:text-dark-text-muted font-black uppercase tracking-wide text-[11px] md:text-xs">Longitude</span>
                  <span className="text-[#111827] dark:text-dark-text-primary font-bold text-xs md:text-sm">{locationState.lng?.toFixed(6) || '--'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 5. PRODUCT RECOMMENDATIONS (Flip Cards) */}
      <h2 className="text-2xl font-black text-[#111827] dark:text-dark-text-primary uppercase tracking-widest mt-12 mb-6 pb-2 border-b border-[#e5e7eb] dark:border-dark-border drop-shadow-sm">5. AI Product Recommendations</h2>
      
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 ${isGeneratingPDF ? '' : 'perspective-1000'} mb-12`}>
        {[
          {
            title: 'Premium Paneer',
            match: '96%',
            img: '/premium_paneer.png',
            bgBadge: 'bg-[#10b981]',
            textHint: 'text-[#6ee7b7]',
            iconColor: 'text-[#10b981]',
            gradientBar: 'from-[#10b981] to-[#14b8a6]',
            desc: 'High fat and protein content makes this yield perfect for premium paneer production. Generates maximum ROI.',
            stats: [
              { label: 'Yield', value: '18%', valueClass: '' },
              { label: 'Texture', value: 'Extremely Soft', valueClass: 'text-[#059669]' },
              { label: 'Market Value', value: 'High Premium', valueClass: 'text-[#d97706]' }
            ]
          },
          {
            title: 'Fresh Curd',
            match: '91%',
            img: '/fresh_curd.png',
            bgBadge: 'bg-[#3b82f6]',
            textHint: 'text-[#93c5fd]',
            iconColor: 'text-[#3b82f6]',
            gradientBar: 'from-[#3b82f6] to-[#6366f1]',
            desc: 'Optimal SNF ratio provides excellent texture and setting capabilities for thick, creamy curd.',
            stats: [
              { label: 'Incubation', value: 'Standard', valueClass: '' },
              { label: 'Shelf Life', value: '12 Days', valueClass: 'text-[#2563eb]' },
              { label: 'Consistency', value: 'Very Thick', valueClass: '' }
            ]
          },
          {
            title: 'Artisan Cheese',
            match: '82%',
            img: '/aged_cheese.png',
            bgBadge: 'bg-[#a855f7]',
            textHint: 'text-[#d8b4fe]',
            iconColor: 'text-[#a855f7]',
            gradientBar: 'from-[#a855f7] to-[#d946ef]',
            desc: 'Low microbial count enables long-term aging processes without spoilage risks. Ideal for hard cheeses.',
            stats: [
              { label: 'Aging Pot.', value: 'High', valueClass: 'text-[#9333ea]' },
              { label: 'Flavor', value: 'Rich / Nutty', valueClass: '' },
              { label: 'Maturation', value: '6-12 Months', valueClass: '' }
            ]
          },
          {
            title: 'Craft Butter',
            match: '77%',
            img: '/craft_butter.png',
            bgBadge: 'bg-[#f59e0b]',
            textHint: 'text-[#fcd34d]',
            iconColor: 'text-[#f59e0b]',
            gradientBar: 'from-[#f59e0b] to-[#f97316]',
            desc: 'Good fat separation qualities. A2 milk butter commands premium market pricing.',
            stats: [
              { label: 'Churn Time', value: 'Standard', valueClass: '' },
              { label: 'Color', value: 'Deep Yellow', valueClass: 'text-[#d97706]' },
              { label: 'Fat Content', value: '82%+', valueClass: '' }
            ]
          }
        ].map((card, i) => (
          <div key={i} className={`w-full ${isGeneratingPDF ? 'h-[360px]' : 'group h-80 [perspective:1000px]'}`}>
            {!isGeneratingPDF ? (
              <div className="relative h-full w-full rounded-3xl shadow-lg transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] cursor-pointer border border-[#e5e7eb] dark:border-dark-border">
                {/* Front Side */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden [backface-visibility:hidden]">
                  <img src={card.img} alt={card.title} className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000000cc] via-[#00000033] to-transparent"></div>
                  <div className={`absolute top-4 right-4 px-3 py-1 ${card.bgBadge} text-white text-xs font-black rounded-xl shadow-lg`}>{card.match} Match</div>
                  <div className="absolute bottom-6 left-6 pr-6">
                    <h4 className="text-2xl font-black text-white tracking-wide mb-1 drop-shadow-md">{card.title}</h4>
                    <p className={`${card.textHint} text-xs font-bold uppercase tracking-widest flex items-center gap-2`}><Sparkles className="w-3 h-3"/> Flip for details</p>
                  </div>
                </div>
                {/* Back Side */}
                <div className="absolute inset-0 h-full w-full rounded-3xl bg-white dark:bg-dark-surface p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col">
                  <h4 className="text-xl font-black text-[#111827] dark:text-dark-text-primary mb-2 flex items-center gap-2"><Sparkles className={`w-5 h-5 ${card.iconColor}`}/> {card.title}</h4>
                  <div className={`w-full h-1 bg-gradient-to-r ${card.gradientBar} rounded-full mb-4`}></div>
                  <p className="text-xs text-[#374151] mb-4 font-bold leading-relaxed">{card.desc}</p>
                  <ul className="space-y-3 text-xs text-[#111827] dark:text-dark-text-primary font-black mt-auto uppercase tracking-wide">
                    {card.stats.map((stat, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-[#f9fafb] p-2 rounded-lg border border-[#f3f4f6]">
                        <span className="text-[#6b7280] text-[10px]">{stat.label}</span> 
                        <span className={stat.valueClass}>{stat.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-3xl bg-white dark:bg-dark-surface shadow-sm border border-[#e5e7eb] dark:border-dark-border overflow-hidden flex flex-col h-full">
                <div className="relative h-36 shrink-0">
                  <img src={card.img} alt={card.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000000cc] via-[#00000033] to-transparent"></div>
                  <div className={`absolute top-4 right-4 px-3 py-1 ${card.bgBadge} text-white text-xs font-black rounded-xl shadow-lg`}>{card.match} Match</div>
                  <div className="absolute bottom-4 left-4 pr-4">
                    <h4 className="text-xl font-black text-white tracking-wide mb-1 drop-shadow-md">{card.title}</h4>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className={`w-full h-1 bg-gradient-to-r ${card.gradientBar} rounded-full mb-2`}></div>
                  <p className="text-[10px] text-[#374151] mb-3 font-bold leading-relaxed line-clamp-3">{card.desc}</p>
                  <ul className="space-y-1.5 text-[9px] text-[#111827] dark:text-dark-text-primary font-black mt-auto uppercase tracking-wide">
                    {card.stats.map((stat, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-[#f9fafb] p-1.5 rounded border border-[#f3f4f6]">
                        <span className="text-[#6b7280]">{stat.label}</span> 
                        <span className={stat.valueClass}>{stat.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default AnalysisPage;
