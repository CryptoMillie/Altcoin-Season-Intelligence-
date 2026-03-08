'use client';

export default function GaugeMeter({ score }) {
  const size = 200;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 70) return '#00ff88';
    if (s >= 40) return '#f5a235';
    return '#ff4560';
  };

  const color = getColor(score);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background arc */}
        <circle
          className="text-gray-700"
          strokeWidth={strokeWidth}
          fill="none"
          stroke="currentColor"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress arc */}
        <circle
          className="transition-all duration-100 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          stroke={color}

          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-bold font-[var(--font-orbitron)]">{score}%</div>
        <div className="text-sm text-gray-400 font-[var(--font-space-mono)]">Probability
</div>
      </div>
    </div>
  );
}