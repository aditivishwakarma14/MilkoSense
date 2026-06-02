import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle, MapPin, Phone } from 'lucide-react';
import useUiStore from '../app/store/uiStore';

const Contact = () => {
  const addToast = useUiStore((state) => state.addToast);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    addToast('Message dispatched to operations center', 'success');
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-dark-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-dark-text-primary flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Mail className="w-6 h-6 text-[#047857]" />
            </div>
            GET IN TOUCH
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted mt-1 font-medium">
            Reach our engineering team for hardware support, calibration queries, or platform feedback.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Info cards */}
        <div className="lg:col-span-1 space-y-4">
          {[
            {
              icon: <MapPin className="w-5 h-5 text-emerald-600" />,
              label: 'OPERATIONS ROOM',
              value: 'Sector 12, Cyber City, India',
            },
            {
              icon: <Phone className="w-5 h-5 text-emerald-600" />,
              label: 'SUPPORT HOTLINE',
              value: '1800-MILK-SENSE (Toll Free)',
            },
            {
              icon: <Mail className="w-5 h-5 text-emerald-600" />,
              label: 'TECH TEAM EMAIL',
              value: 'support@milkosense.com',
            },
          ].map((info) => (
            <div
              key={info.label}
              className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 shrink-0">
                {info.icon}
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-dark-text-muted uppercase tracking-widest font-mono">
                  {info.label}
                </span>
                <p className="text-sm text-gray-900 dark:text-dark-text-primary font-semibold mt-1">{info.value}</p>
              </div>
            </div>
          ))}

          {/* Support hours notice */}
          <div className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm font-mono text-xs text-gray-500 dark:text-dark-text-muted">
            <span className="text-emerald-600 font-bold">⏱ RESPONSE TIME:</span>
            <p className="mt-1 leading-relaxed">
              Our engineering support team responds within <strong className="text-gray-900 dark:text-dark-text-primary">2–4 hours</strong> on weekdays.
              Critical hardware issues are escalated within 30 minutes.
            </p>
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm flex flex-col">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-5">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold tracking-widest text-gray-800 dark:text-dark-text-primary uppercase font-mono">
              DISPATCH A QUERY
            </h3>
          </div>

          {submitted ? (
            <div className="text-center py-20 space-y-4 flex-1 flex flex-col justify-center">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-dark-text-primary uppercase tracking-widest">
                MESSAGE DISPATCHED
              </h3>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted max-w-[280px] mx-auto leading-relaxed">
                Your query has been logged. An operator will contact you within 2–4 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}
                className="mt-4 px-5 py-2 text-xs font-bold text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-all mx-auto block"
              >
                SEND ANOTHER QUERY
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 dark:text-dark-text-secondary font-bold block mb-1.5">OPERATOR NAME</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3.5 py-2.5 text-gray-900 dark:text-dark-text-primary outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="text-gray-600 dark:text-dark-text-secondary font-bold block mb-1.5">AUDIT REGISTER EMAIL</label>
                  <input
                    required
                    type="email"
                    placeholder="operator@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3.5 py-2.5 text-gray-900 dark:text-dark-text-primary outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-600 dark:text-dark-text-secondary font-bold block mb-1.5">QUERY OR DETAILS</label>
                <textarea
                  required
                  rows="6"
                  placeholder="Brief description of your hardware, calibration, or platform issue..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3.5 py-2.5 text-gray-900 dark:text-dark-text-primary outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none placeholder-gray-400"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase transition-all duration-200 shadow-sm"
              >
                <Send className="w-4 h-4" />
                DISPATCH MESSAGE
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
