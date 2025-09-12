// app/components/AreaDonutChart.jsx
'use client';

import { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import KpiDetailDialog from './KpiDetailDialog'; 

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AreaDonutChart({ areaScores, userRole }) { 
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    const [showModal, setShowModal] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);

    if (!areaScores || areaScores.length === 0) {
        return <p className="text-center text-gray-500 pt-16">Tidak ada data chart untuk ditampilkan.</p>;
    }

    const chartLabels = areaScores.map(item => item.area);
    const chartDataValues = areaScores.map(item => item.average_score);
    const backgroundColors = ['#022c2c', '#033f3f', '#4f7979', '#808b8b', '#d6302a', '#b0a1a1'];

    const data = {
        labels: chartLabels,
        datasets: [{ label: 'Skor Rata-rata', data: chartDataValues, backgroundColor: backgroundColors, borderColor: '#ffffff', borderWidth: 2 }],
    };

    const handleChartClick = (event, elements) => {
        if (elements.length > 0) {
            const elementIndex = elements[0].index;
            const areaName = chartLabels[elementIndex];
            setSelectedArea(areaName);
            setShowModal(true);
        }
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: handleChartClick,
        plugins: { legend: { position: 'bottom' } },
        cutout: '50%',
    };

    return (
        <>
            {isClient && <Doughnut data={data} options={options} />}
            {showModal && <KpiDetailDialog areaName={selectedArea} onClose={() => setShowModal(false)} />}
        </>
    );
}