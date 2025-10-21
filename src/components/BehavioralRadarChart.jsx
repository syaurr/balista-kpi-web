'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function BehavioralRadarChart({ scores }) {
  
  const colorMap = {
    red: { fill: 'rgba(220, 53, 69, 0.2)', border: 'rgba(220, 53, 69, 1)' },
    orange: { fill: 'rgba(253, 126, 20, 0.2)', border: 'rgba(253, 126, 20, 1)' },
    yellow: { fill: 'rgba(255, 193, 7, 0.2)', border: 'rgba(255, 193, 7, 1)' },
    blue: { fill: 'rgba(13, 110, 253, 0.2)', border: 'rgba(13, 110, 253, 1)' },
    green: { fill: 'rgba(25, 135, 84, 0.2)', border: 'rgba(25, 135, 84, 1)' },
  };

  const getScoreColor = (score) => {
    if (score <= 20) return colorMap.red.border;
    if (score <= 40) return colorMap.orange.border;
    if (score <= 60) return colorMap.yellow.border;
    if (score <= 80) return colorMap.blue.border;
    return colorMap.green.border;
  };
  
  const getDominantColor = (scores) => {
    if (!scores || scores.length === 0) return colorMap.blue; // Default
    const scoreColors = scores.map(item => {
      const score = item.final_score;
      if (score <= 20) return 'red';
      if (score <= 40) return 'orange';
      if (score <= 60) return 'yellow';
      if (score <= 80) return 'blue';
      return 'green';
    });
    const colorCounts = scoreColors.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
    }, {});
    let dominantColorName = 'blue';
    let maxCount = 0;
    for (const color in colorCounts) {
      if (colorCounts[color] > maxCount) {
        maxCount = colorCounts[color];
        dominantColorName = color;
      }
    }
    return colorMap[dominantColorName];
  };

  const dominantColor = useMemo(() => getDominantColor(scores), [scores]);
  const pointColors = useMemo(() => scores.map(item => getScoreColor(item.final_score)), [scores]);

  const data = {
    labels: scores.map(item => item.aspect_name),
    datasets: [
      {
        label: 'Skor Aspek',
        data: scores.map(item => item.final_score.toFixed(2)),
        fill: true,
        backgroundColor: dominantColor.fill,
        borderColor: dominantColor.border,
        borderWidth: 2,
        pointBackgroundColor: pointColors,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: pointColors,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
        grid: { color: 'rgba(0, 0, 0, 0.1)' },
        pointLabels: {
          font: { size: 12 }, // Ukuran font label aspek
          color: '#033f3f'
        },
        ticks: {
          backdropColor: 'white',
          color: 'grey',
          beginAtZero: true,
          min: 0,
          max: 100,
          stepSize: 25
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          labelColor: function(context) {
            const color = pointColors[context.dataIndex];
            return { borderColor: color, backgroundColor: color };
          }
        }
      }
    }
  };

  // Tampilkan pesan jika tidak ada data skor
  if (!scores || scores.length === 0) {
    return <div className="text-center italic text-gray-500 pt-16">Belum ada skor untuk ditampilkan.</div>;
  }

  return <Radar data={data} options={options} />;
}