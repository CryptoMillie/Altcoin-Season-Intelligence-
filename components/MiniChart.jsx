'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

export default function MiniChart({ history, signal }) {
  if (!history || history.length === 0) {
    return <div className="h-16 bg-gray-800/30 rounded animate-pulse"></div>;
  }

  const getColor = (s) => {
    switch (s) {
      case 'bullish':
        return '#00ff88';
      case 'neutral':
        return '#f5a623';
      case 'bearish':
        return '#ff4560';
      default:
        return '#00d4ff';
    }
  };

  const color = getColor(signal);

  const data = {
    labels: history.map((_, i) => i),
    datasets: [
      {
        data: history,
        borderColor: color,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 64);
          gradient.addColorStop(0, color + '40');
          gradient.addColorStop(1, color + '00');
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div className="h-16 w-full">
      <Line data={data} options={options} />
    </div>
  );
}
