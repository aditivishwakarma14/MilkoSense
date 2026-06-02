import React, { useMemo } from 'react';
import useAnalyticsStore from '../../app/store/analyticsStore';
import { motion } from 'framer-motion';
import { Award, Zap, ShieldAlert, Sparkles } from 'lucide-react';

const QualityScoreCard = () => {
  const latestAnalysis = useAnalyticsStore((state) => state.latestAnalysis);

  const analysis = useMemo(() => {
    return latestAnalysis || {
      score: 94,
      qualityGrade: {
        grade: 'A',
        label: 'EXCELLENT PURITY',
        color: 'green',
        confidence: 0.95
      },
      adulterationRisk: {
        detected: false,
        riskLevel: 'low',
        risks: []
      },
      spoilagePrediction: {
        hours: 36,
        riskLevel: 'low',
        recommendation: 'Keep refrigerated'
      }
    };
  }, [latestAnalysis]);

  const scoreColor = () => {
    const score = analysis.score;
    if (score >= 80) return 'text-iot-green';
    if (score >= 60) return 'text-iot-yellow';
    return 'text-iot-red';
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel shadow-glass border border-gray-800 p-5">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-4 mb-5">
        <Award className="w-5 h-5 text-iot-cyan" />
        <h3 className="text-sm font-bold tracking-widest text-gray-200 uppercase font-mono">INTELLIGENCE SCOREBOARD</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 flex-1 items-center">
        {/* Animated Radial Score Dial */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Circle Track and Fill */}
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-gray-900 fill-none"
                strokeWidth="8"
              />
              <motion.circle
                cx="72"
                cy="72"
                r="64"
                className={`fill-none ${
                  analysis.score >= 80 ? 'stroke-iot-green' : analysis.score >= 60 ? 'stroke-iot-yellow' : 'stroke-iot-red'
                }`}
                strokeWidth="8"
                strokeDasharray="402"
                initial={{ strokeDashoffset: 402 }}
                animate={{ strokeDashoffset: 402 - (402 * analysis.score) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>

            {/* Absolute Centered Score Labels */}
            <div className="text-center">
              <span className={`text-4xl font-black font-mono tracking-tighter ${scoreColor()}`}>
                {analysis.score}
              </span>
              <p className="text-[10px] text-gray-500 dark:text-dark-text-muted font-mono tracking-widest uppercase">QUALITY SCORE</p>
            </div>
          </div>
        </div>

        {/* AI Diagnostics details list */}
        <div className="space-y-4">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-gray-500 dark:text-dark-text-muted font-mono uppercase">AI CLASSIFICATION</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="px-2.5 py-1 rounded bg-iot-green bg-opacity-10 border border-iot-green border-opacity-35 text-iot-green text-xs font-bold font-mono">
                GRADE {analysis.qualityGrade?.grade || 'A'}
              </div>
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                {analysis.qualityGrade?.label || 'EXCELLENT PURITY'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] font-bold tracking-widest text-gray-500 dark:text-dark-text-muted font-mono uppercase flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-iot-yellow" /> ADULTERANTS
              </span>
              <p className="text-xs font-semibold text-gray-200 mt-1 uppercase tracking-wide">
                {analysis.adulterationRisk?.detected ? 'DETECTED RISK' : 'CLEAN SAMPLE'}
              </p>
            </div>

            <div>
              <span className="text-[9px] font-bold tracking-widest text-gray-500 dark:text-dark-text-muted font-mono uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-iot-cyan" /> SHELF STABILITY
              </span>
              <p className="text-xs font-semibold text-gray-200 mt-1 uppercase tracking-wide">
                {analysis.spoilagePrediction?.hours || 36} HRS EXPECTED
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-900 border border-gray-800/80 text-[11px] text-gray-400 leading-relaxed font-mono">
            💡 {analysis.spoilagePrediction?.recommendation || 'Maintain refrigeration at <4.0°C to guarantee premium shelf life.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityScoreCard;
