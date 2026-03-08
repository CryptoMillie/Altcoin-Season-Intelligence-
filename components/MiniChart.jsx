'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function MiniChart({ data, signal }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const getColor = (sig) => {
    switch (sig) {
      case 'bullish': return '#00ff88';
      case 'neutral': return '#f5a623';
      case 'bearish': return '#ff4560';
      default: return '#6a6d7e';
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    const color = getColor(signal);

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}00`);

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          data: data.map(d => d.value),
          borderColor: color,
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, signal]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
