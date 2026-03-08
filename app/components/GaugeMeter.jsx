export default function GaugeMeter({ probability = 0, score = 0, bullish = 0, neutral = 0, bearish = 0 }) {
  const p = Math.max(0, Math.min(100, probability));
  // Semicircle: starts at 180deg (left), ends at 0deg (right)
  // 0% = far left, 100% = far right
  const R = 80;
  const CX = 110, CY = 110;
  const circumference = Math.PI * R; // half circle arc length

  // Stroke dashoffset: full offset = empty, 0 = full
  const dashOffset = circumference * (1 - p / 100);

  // Needle angle: -180deg at 0%, 0deg at 100%
  const needleAngleDeg = -180 + (p / 100) * 180;
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180;
  const needleLen = R - 16;
  const nx = CX + needleLen * Math.cos(needleAngleRad);
  const ny = CY + needleLen * Math.sin(needleAngleRad);

  const phase = p >= 65 ? 'ALTSEASON' : p >= 40 ? 'ROTATION' : 'BTC SEASON';
  const phaseColor = p >= 65 ? '#00ff88' : p >= 40 ? '#f5a623' : '#ff4560';

  // Tick marks at 0, 25, 50, 75, 100
  const ticks = [0, 25, 50, 75, 100].map(pct => {
    const deg = -180 + (pct / 100) * 180;
    const rad = (deg * Math.PI) / 180;
    return {
      pct,
      x1: CX + (R - 6) * Math.cos(rad),
      y1: CY + (R - 6) * Math.sin(rad),
      x2: CX + (R + 6) * Math.cos(rad),
      y2: CY + (R + 6) * Math.sin(rad),
      lx: CX + (R + 16) * Math.cos(rad),
      ly: CY + (R + 16) * Math.sin(rad),
    };
  });

  function arcPath(r) {
    // Semicircle from 180deg to 0deg (left to right)
    return `M ${CX - r} ${CY} A ${r} ${r} 0 0 1 ${CX + r} ${CY}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox="0 0 220 130" style={{ width: '100%', maxWidth: 340, overflow: 'visible' }}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff4560" />
            <stop offset="40%" stopColor="#f5a623" />
            <stop offset="100%" stopColor="#00ff88" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <path d={arcPath(R)} fill="none" stroke="#1a1f35" strokeWidth="14" strokeLinecap="round"/>

        {/* Colored fill arc */}
        <path
          d={arcPath(R)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />

        {/* Tick marks */}
        {ticks.map(t => (
          <g key={t.pct}>
            <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#2a3050" strokeWidth="1.5"/>
            <text x={t.lx} y={t.ly + 3} textAnchor="middle" fontSize="7"
              fill="#5a6478" fontFamily="Space Mono">{t.pct}</text>
          </g>
        ))}

        {/* Needle */}
        <line
          x1={CX} y1={CY}
          x2={nx} y2={ny}
          stroke={phaseColor} strokeWidth="2.5" strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: 'all 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <circle cx={CX} cy={CY} r="6" fill="#0f1120" stroke={phaseColor} strokeWidth="2"/>
        <circle cx={CX} cy={CY} r="2.5" fill={phaseColor}/>

        {/* Center score */}
        <text x={CX} y={CY - 18} textAnchor="middle"
          fontSize="26" fontWeight="900" fontFamily="Orbitron,sans-serif"
          fill={phaseColor} filter="url(#glow)"
          style={{ transition: 'fill 0.5s' }}>
          {p.toFixed(1)}%
        </text>
        <text x={CX} y={CY - 4} textAnchor="middle"
          fontSize="7" fontFamily="Space Mono" fill="#5a6478" letterSpacing="2">
          PROBABILITY
        </text>
      </svg>

      {/* Phase label */}
      <div style={{
        fontFamily: 'Orbitron,sans-serif', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.2em', color: phaseColor,
        textShadow: `0 0 14px ${phaseColor}66`, marginTop: 4,
        textTransform: 'uppercase'
      }}>
        {phase}
      </div>

      {/* Bullish / Neutral / Bearish counts */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        {[['bullish','#00ff88',bullish],['neutral','#f5a623',neutral],['bearish','#ff4560',bearish]].map(([k,c,v]) => (
          <div key={k} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <span style={{ fontFamily:'Space Mono', fontSize:18, fontWeight:700, color:c }}>{v}</span>
            <span style={{ fontFamily:'Space Mono', fontSize:8, color:'#5a6478', textTransform:'uppercase', letterSpacing:'0.15em' }}>{k}</span>
          </div>
        ))}
      </div>

      <div style={{ fontFamily:'Space Mono', fontSize:10, color:'#5a6478', marginTop:6 }}>
        Score: {score.toFixed(1)} / 7.0
      </div>
    </div>
  );
}
