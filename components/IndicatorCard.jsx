'use client';

import MiniChart from './MiniChart';

export default function IndicatorCard({ indicator }) {
  const getSignalBadge = (signal) => {
    const styles = {
      bullish: 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30',
      neutral: 'bg-[#f5a623]/20 text-[#f5a623] border-[#f5a623]/30',
      bearish: 'bg-[#ff4560]/20 text-[#ff4560] border-[#ff4560]/30',
    };
    
    const labels = {
      bullish: 'Bullish',
      neutral: 'Neutral',
      bearish: 'Bearish',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${styles[signal]}`}>
        {labels[signal]}
      </span>
    );
  };

  const getGlowClass = (signal) => {
    switch (signal) {
      case 'bullish':
        return 'glow-bullish';
      case 'neutral':
        return 'glow-neutral';
      case 'bearish':
        return 'glow-bearish';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-[#0f1120] rounded-xl p-4 border border-gray-800/50 ${getGlowClass(indicator.signal)}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-300 font-[var(--font-space-mono)]">
            {indicator.label}
          </h3>
          <p className="text-2xl font-bold mt-1 font-[var(--font-orbitron)]">
            {indicator.value}
          </p>
        </div>
        {getSignalBadge(indicator.signal)}
      </div>
      
      {indicator.history && indicator.history.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-800/50">
          <MiniChart history={indicator.history} signal={indicator.signal} />
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500 font-[var(--font-space-mono)]">
        Threshold: {indicator.threshold}
      </div>
    </div>
  );
}
