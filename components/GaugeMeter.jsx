'use client';

export default function GaugeMeter({ score }) {
  // Calculate gauge position (0-100 mapped to 0-180 degrees)
  const angle = (score / 100) * 180;
  
  // Determine color based on score
  const getColor = (s) => {
    if (s >= 70) return '#00ff88'; // Bullish - green
    if (s >= 40) return '#f5a623'; // Neutral - amber
    return '#ff4560'; // Bearish - red
  };
  
  const color = getColor(score);
  
  // Calculate needle position
  const needleAngle = angle - 90; // Start from left side
  const needleRadians = (needleAngle * Math.PI) / 180;
  const needleX = 100 + 70 * Math.cos(needleRadians);
  const needleY = 100 + 70 * Math.sin(needleRadians);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-40 md:w-80 md:h-48">
        <svg viewBox="0 0 200 120" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="#1a1d2e"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Colored arc segments */}
          <path
            d="M 30 100 A 70 70 0 0 1 65 45"
            fill="none"
            stroke="#ff4560"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 65 45 A 70 70 0 0 1 135 45"
            fill="none"
            stroke="#f5a623"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 135 45 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="#00ff88"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Center pivot */}
          <circle cx="100" cy="100" r="6" fill={color} className="transition-colors duration-500" />
          
          {/* Ticks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const tickAngle = (tick / 100) * 180 - 90;
            const tickRadians = (tickAngle * Math.PI) / 180;
            const innerX = 100 + 55 * Math.cos(tickRadians);
            const innerY = 100 + 55 * Math.sin(tickRadians);
            const outerX = 100 + 65 * Math.cos(tickRadians);
            const outerY = 100 + 65 * Math.sin(tickRadians);
            const labelX = 100 + 40 * Math.cos(tickRadians);
            const labelY = 100 + 40 * Math.sin(tickRadians);
            
            return (
              <g key={tick}>
                <line
                  x1={innerX}
                  y1={innerY}
                  x2={outerX}
                  y2={outerY}
                  stroke="#4a4d5e"
                  strokeWidth="2"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#6a6d7e"
                  fontSize="8"
                  fontFamily="Space Mono, monospace"
                >
                  {tick}%
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* Score display */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
          <div 
            className="font-display text-4xl md:text-5xl font-bold transition-colors duration-500"
            style={{ color }}
          >
            {score}%
          </div>
          <div className="text-gray-400 text-xs md:text-sm font-mono mt-1">
            ALTSIGNAL PROBABILITY
          </div>
        </div>
      </div>
      
      {/* Signal label */}
      <div 
        className="mt-4 px-4 py-2 rounded-full text-sm font-mono font-bold tracking-wider"
        style={{ 
          backgroundColor: `${color}20`,
          color: color,
          border: `1px solid ${color}40`
        }}
      >
        {score >= 70 ? 'BULLISH' : score >= 40 ? 'NEUTRAL' : 'BEARISH'}
      </div>
    </div>
  );
}
