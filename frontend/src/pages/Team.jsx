import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Award, Mail, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const Team = () => {
  const members = [
    {
      name: 'Aditi Vishwakarma',
      role: 'Staff Fullstack + IoT Architect',
      details: 'Ingestion layer engineer, React developer, Mongoose systems designer, and Docker grid administrator.',
      email: 'aditi@milkosense.com'
    },
    {
      name: 'Dr. Ramesh Kumar',
      role: 'Academic Research Advisor',
      details: 'Dairy chemistry expert, neural adulterants research advisor, and predictive algorithm supervisor.',
      email: 'ramesh.kumar@university.edu'
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-4 font-sans text-left">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-iot-cyan" />
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-100 uppercase font-sans">PROJECT DIRECTORS</h1>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Meet the researchers, engineers, and supervisors behind the development of the MilkoSense IoT platform.
        </p>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
        {members.map((member, idx) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="p-5 rounded-2xl glass-panel border border-gray-800 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-iot-cyan/10 text-iot-cyan border border-iot-cyan/20 flex items-center justify-center font-bold text-lg">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-200 tracking-wide">{member.name}</h3>
                <span className="text-[10px] text-iot-cyan font-mono uppercase font-bold tracking-wider">{member.role}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted leading-relaxed">{member.details}</p>
            </div>

            <div className="border-t border-gray-800/80 pt-4 mt-6 flex items-center gap-2 text-xs font-mono text-gray-400">
              <Mail className="w-3.5 h-3.5" />
              <span className="text-[10px]">{member.email}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Team;
