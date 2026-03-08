'use client';

import MiniChart from './MiniChart';

export default function IndicatorCard({ indicator }) {
  const { label, value, signal, history, threshold } = indicator;
  
  const getSignalStyles = (sig) => {
    switch (sig) {
      case 'bullish':
        return {
          bg: 'bg-signal-bullish/10',
          border: 'border-signal-bullish/30',
          text: 'text-signal-bullish',
          glow: 'glow-bullish',
          pulse: 'animate-pulse-bullish'
        };
      case 'neutral':
        return {
          bg: 'bg-signal-neutral/10',
          border: 'border-signal-neutral/30',
          text: 'text-signal-neutral',
          glow: 'glow-neutral',
          pulse: 'animate-pulse-neutral'
        };
      case 'bearish':
        return {
          bg: 'bg-signal-bearish/10',
          border: 'border-signal-bearish/30',
          text: 'text-signal-bearish',
          glow: 'glow-bearish',
          pulse: 'animate-pulse-bearish'
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          glow: '',
          pulse: ''
        };
    }
  };
  
  const styles = getSignalStyles(signal);

  return (
    <div 
      className={`
        relative bg-card rounded-lg p-4 md:p-5 
        border ${styles.border} ${styles.glow}
        card-hover overflow-hidden
      `}
    >
      {/* Signal indicator dot */}
      <div 
        className={`
          absolute top-3 right-3 w-3 h-3 rounded-full ${styles.pulse}
          ${signal === 'bullish' ? 'bg-signal-bullish' : 
            signal === 'neutral' ? 'bg-signal-neutral' : 'bg-signal-bearish'}
        `}
      />
      
      {/* Header */}
      <div className="mb-3 pr-6">
        <h3 className="font-display text-sm md:text-base font-semibold text-white tracking-wide">
          {label}
        </h3>
      </div>
      
      {/* Value */}
      <div className="mb-2">
        <span className={`font-mono text-2xl md:text-3xl font-bold ${styles.text}`}>
          {value}
        </span>
      </div>
      
      {/* Signal badge */}
      <div className="mb-3">
        <span 
          className={`
            inline-block px-2 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider
            ${styles.bg} ${styles.text}
          `}
        >
          {signal}
        </span>
      </div>
      
      {/* Chart */}
      <div className="h-16 md:h-20 mb-2">
        <MiniChart data={history} signal={signal} />
      </div>
      
      {/* Threshold */}
      <div className="text-xs text-gray-500 font-mono">
        Target: {threshold}
      </div>
    </div>
  );
}
