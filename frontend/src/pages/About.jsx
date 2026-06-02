import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Cpu, ShieldCheck, Database, Layout } from 'lucide-react';

const About = () => {
  const items = [
    { title: 'Hardware Node', desc: 'Analog sensor clusters (pH, TDS, DS18B20 temp) reporting values over standard C++ Arduino setups.', icon: <Cpu className="w-5 h-5" /> },
    { title: 'Ingestion Layer', desc: 'Express controllers processing HTTP requests, executing schemas validations, and triggering WebSocket events.', icon: <Layout className="w-5 h-5" /> },
    { title: 'Persistance Grid', desc: 'MongoDB database cluster mapped using Mongoose schemas indexes to optimize rapid historical queries.', icon: <Database className="w-5 h-5" /> },
    { title: 'Compliance Audits', desc: 'Holt-Winters double exponential mathematical trajectories and neural spoilage screenings safeguarding quality.', icon: <ShieldCheck className="w-5 h-5" /> }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-4 font-sans text-left">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-iot-cyan" />
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-100 uppercase font-sans">ABOUT MILKOSENSE</h1>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          The MilkoSense system provides dairy farmers, analysts, and food audit centers with an integrated hardware and software framework designed to continuously assess milk safety.
        </p>
      </div>

      {/* Stack Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
        {items.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="p-5 rounded-2xl glass-panel border border-gray-800 flex gap-4"
          >
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 text-iot-cyan h-fit">
              {item.icon}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-200 tracking-wide">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default About;
