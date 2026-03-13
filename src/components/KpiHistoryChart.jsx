'use client';

// Impor semua yang dibutuhkan untuk chart
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Daftarkan komponen chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// src/components/KpiHistoryChart.jsx

export default function KpiHistoryChart({ kpiHistory }) {
    // --- 1. PINDAHKAN PENGECEKAN KE PALING ATAS ---
    if (!kpiHistory || kpiHistory.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="italic text-gray-500 text-center">
                    Data riwayat belum cukup untuk menampilkan grafik tren.
                </p>
            </div>
        );
    }

    // --- 2. SEKARANG AMAN UNTUK MEMBUAT VARIABEL DATA ---
    const data = {
        labels: kpiHistory.map(item => item.periode),
        datasets: [
            {
                label: 'Nilai Akhir Proporsional',
                data: kpiHistory.map(item => item.nilai_proporsional ? item.nilai_proporsional.toFixed(2) : 0),
                borderColor: 'rgba(2, 132, 130, 1)',
                backgroundColor: 'rgba(2, 132, 130, 0.2)',
                fill: true,
                tension: 0.3
            },
            {
                label: 'Total Nilai Akhir',
                data: kpiHistory.map(item => item.total_nilai_akhir ? item.total_nilai_akhir.toFixed(2) : 0),
                borderColor: 'rgba(108, 117, 125, 1)',
                backgroundColor: 'rgba(108, 117, 125, 0.1)',
                fill: true,
                tension: 0.3
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
        },
        scales: {
            y: { 
                beginAtZero: true, 
                max: 100 
            }
        }
    };

    return <Line options={options} data={data} />;
}