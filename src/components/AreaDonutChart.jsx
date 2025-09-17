// app/components/AreaDonutChart.jsx
'use client';

import { useState, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import KpiDetailDialog from './KpiDetailDialog';

ChartJS.register(ArcElement, Tooltip, Legend);

// Hanya perlu menerima userRole untuk hak akses simpan catatan
export default function AreaDonutChart({ areaScores, userRole }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);

    const filteredScores = useMemo(() => {
        return areaScores.filter(score => score.average_score > 0);
    }, [areaScores]);
    
    if (!filteredScores || filteredScores.length === 0) {
        return <p className="text-center text-gray-500 pt-16">Tidak ada data penilaian untuk ditampilkan pada periode ini.</p>;
    }

    const sortedScores = [...filteredScores].sort((a, b) => a.average_score - b.average_score);
    const lowestScoreItem = sortedScores[0];
    
    const redColor = '#d6302a';
    const tealPalette = ['#022c2c', '#033f3f', '#4f7979', '#808b8b', '#a48d5e'];

    const backgroundColors = filteredScores.map(item => {
        if (item.area === lowestScoreItem.area) {
            return redColor;
        }
        const sortedIndex = sortedScores.findIndex(s => s.area === item.area);
        return tealPalette[(sortedIndex - 1 + tealPalette.length) % tealPalette.length];
    });

    const data = {
        labels: filteredScores.map(item => item.area),
        datasets: [{
            label: 'Skor Rata-rata',
            data: filteredScores.map(item => item.average_score),
            backgroundColor: backgroundColors,
            borderColor: '#ffffff',
            borderWidth: 3,
        }],
    };

    const handleChartClick = (event, elements) => {
        if (elements.length > 0) {
            const elementIndex = elements[0].index;
            const areaName = data.labels[elementIndex];
            setSelectedArea(areaName);
            setShowModal(true);
        }
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: handleChartClick,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.chart.data.datasets[0].data.reduce((acc, val) => acc + val, 0);
                        const percentage = total > 0 ? (value / total) * 100 : 0;
                        return `${label}: ${value.toFixed(2)} (${percentage.toFixed(1)}%)`;
                    }
                }
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
                    userRole={userRole} // Kirim userRole untuk hak akses edit
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
}