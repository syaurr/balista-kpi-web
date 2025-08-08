'use client';
import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import KpiDetailDialog from './KpiDetailDialog';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AreaDonutChart({ areaScores, userRole }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

  if (!areaScores || areaScores.length === 0) {
    return <p className="text-center text-gray-500 pt-16">Tidak ada data penilaian untuk ditampilkan.</p>;
  }

  const scores = [...areaScores].sort((a, b) => a.average_score - b.average_score);
  const smallest = scores[0];
  const sortedRest = scores.slice(1).sort((a, b) => b.average_score - a.average_score);
  
  const smallestColor = '#d6302a';
  const tealPalette = ['#022c2c', '#033f3f', '#4f7979', '#808b8b'];

  const backgroundColors = scores.map(score => {
    if (score.area === smallest.area) {
      return smallestColor;
    }
    const index = sortedRest.findIndex(item => item.area === score.area);
    return tealPalette[index % tealPalette.length];
  });

  const data = {
    labels: scores.map(item => item.area),
    datasets: [
      {
        label: 'Skor Rata-rata',
        data: scores.map(item => item.average_score),
        backgroundColor: backgroundColors,
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  // --- INI DIA PERBAIKANNYA ---
  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      // Ambil nama area dari array 'scores' yang sudah pasti ada
      const areaName = scores[elementIndex].area;
      setSelectedArea(areaName);
      setShowModal(true);
    }
  };
  // --- AKHIR PERBAIKAN ---

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'Poppins' } }
      },
      tooltip: {
        bodyFont: { family: 'Poppins' },
        titleFont: { family: 'Poppins' }
      }
    },
    cutout: '50%',
  };

  return (
    <>
      <Doughnut data={data} options={options} />
      {showModal && (
        <KpiDetailDialog 
          areaName={selectedArea}
          userRole={userRole}
          onClose={(didUpdate) => {
              setShowModal(false);
              if (didUpdate) {
                  window.location.reload();
              }
          }}
        />
      )}
    </>
  );
}