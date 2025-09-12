'use client';

import { useState, useMemo } from 'react';
import ScoreCard from './ScoreCard';
import AreaDonutChart from './AreaDonutChart';

export default function DashboardClient({ user, initialData }) {
    const { rekap, areaScores, recommendations, summary } = initialData;

    // Kalkulasi skor
    const { totalNilaiAkhir, nilaiProporsional } = useMemo(() => {
        let total = rekap.reduce((sum, item) => sum + parseFloat(item.nilai_akhir || 0), 0);
        let totalBobot = rekap.reduce((sum, item) => {
            if (item.frekuensi && ['bulanan', 'mingguan', 'harian', 'per kebutuhan', 'per kasus'].some(f => item.frekuensi.toLowerCase().includes(f))) {
                return sum + item.bobot;
            }
            return sum;
        }, 0);
        const proporsional = totalBobot > 0 ? (total / (totalBobot / 100.0)) : 0;
        return { totalNilaiAkhir: total, nilaiProporsional: proporsional };
    }, [rekap]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Dashboard Kinerja</h1>
            <section className="mb-8">
                <h2 className="text-2xl font-bold text-[#6b1815] mb-4">Ringkasan Kinerja Bulanan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ScoreCard title="Total Nilai Akhir Bulanan" value={totalNilaiAkhir} />
                    <ScoreCard title="Nilai Akhir Proporsional" value={nilaiProporsional} />
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-[#6b1815] mb-3">Catatan Umum dari Penilai</h3>
                    <p className="text-gray-600 italic">{summary.catatan_kpi}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold text-[#6b1815] mb-3">Rekomendasi Pengembangan</h3>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                        {recommendations.map((rec, index) => <li key={index}>{rec.rekomendasi_text}</li>)}
                        {recommendations.length === 0 && <p className="italic">Belum ada rekomendasi.</p>}
                    </ul>
                </div>
            </div>
            
            <section className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h3 className="text-lg font-bold text-[#6b1815] mb-4">Rekapitulasi Semua KPI</h3>
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#6b1815] text-white sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-center">No</th>
                                <th className="px-4 py-3 text-left">Nama KPI</th>
                                <th className="px-4 py-3 text-left">Frekuensi</th>
                                <th className="px-4 py-3 text-center">Skor Aktual</th>
                                <th className="px-4 py-3 text-center">Bobot</th>
                                <th className="px-4 py-3 text-center">Nilai Akhir</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rekap.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 text-center">{index + 1}</td>
                                    <td className="px-4 py-4">{item.kpi_deskripsi}</td>
                                    <td className="px-4 py-4">{item.frekuensi}</td>
                                    <td className="px-4 py-4 text-center text-sm">{item.skor_aktual}</td>
                                    <td className="px-4 py-4 text-center">{item.bobot}%</td>
                                    <td className="px-4 py-4 text-[#6b1815] text-center font-semibold text-lg">{parseFloat(item.nilai_akhir || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-[#6b1815] mb-4">Kinerja per Area</h3>
                <div className="h-96 w-full">
                    <AreaDonutChart areaScores={areaScores} userRole={user.role} />
                </div>
            </section>
        </div>
    );
}