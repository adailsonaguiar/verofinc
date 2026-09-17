import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from 'chart.js';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale);

interface SparklineChartProps {
  data: number[];
  color: string;
  height?: number;
}

/** Minimal trend line used inside account / credit card cards. */
export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color,
  height = 70,
}) => (
  <div style={{ height }}>
    <Line
      data={{
        labels: data.map((_, index) => String(index)),
        datasets: [
          {
            data,
            borderColor: color,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.35,
            fill: false,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
      }}
    />
  </div>
);
