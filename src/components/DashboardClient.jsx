// src/components/DashboardClient.jsx

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ScoreCard from './ScoreCard';
import AreaDonutChart from './AreaDonutChart';

export default function DashboardClient({ user, initialData, initialMonth, initialYear, karyawanId, periode }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { rekap, areaScores, recommendations, summary } = initialData;

    const [month, setMonth] = useState(initialMonth);
    const [year, setYear] = useState(initialYear);
    
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (!params.get('karyawanId') && karyawanId) {
            router.replace(`/dashboard?bulan=${month}&tahun=${year}&karyawanId=${karyawanId}`);
        }
    }, [karyawanId, month, year, searchParams, router]);

    const handlePeriodChange = () => {
        router.push(`/dashboard?bulan=${month}&tahun=${year}&karyawanId=${karyawanId}`);
    };

    // --- BLOK DEBUGGING FORENSIK ---
    const { totalNilaiAkhir, nilaiProporsional } = useMemo(() => {
        console.log("===================================");
        console.log("MEMULAI KALKULASI FORENSIK useMemo");
        console.log("===================================");
        
        let total = 0;
        let totalBobot = 0;

        if (!rekap || rekap.length === 0) {
            console.log("HASIL: 'rekap' kosong atau tidak ada. Mengembalikan 0.");
            return { totalNilaiAkhir: 0, nilaiProporsional: 0 };
        }

        rekap.forEach((item, index) => {
            const nilai = item.nilai_akhir;
            const bobot = item.bobot;
            const skor = item.skor_aktual;

            const convertedNilai = Number(nilai) || 0;
            const convertedBobot = Number(bobot) || 0;
            const convertedSkor = Number(skor) || 0;

            console.log(`[Item #${index}] NILAIAKHIR: Diterima '${nilai}' (Tipe: ${typeof nilai}), Dikonversi menjadi -> ${convertedNilai}`);
            
            total += convertedNilai;

            if (convertedSkor > 0) {
                console.log(`[Item #${index}] BOBOT: Diterima '${bobot}' (Tipe: ${typeof bobot}), Dikonversi menjadi -> ${convertedBobot}`);
                totalBobot += convertedBobot;
            }
        });

        console.log("-----------------------------------");
        console.log(`HASIL AKHIR: Total Nilai = ${total}, Total Bobot = ${totalBobot}`);
        console.log("===================================");

        const proporsional = totalBobot > 0 ? (total / (totalBobot / 100.0)) : 0;
        return { totalNilaiAkhir: total, nilaiProporsional: proporsional };
    }, [rekap]);
    
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
    }));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#022020]">Dashboard Kinerja</h1>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-md">
                    <select value={month} onChange={e => setMonth(e.target.value)} className="select select-bordered select-sm">
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(e.target.value)} className="select select-bordered select-sm">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={handlePeriodChange} className="btn btn-sm btn-primary">Lihat</button>
                </div>
            </div>

            <section className="mb-8">
                <h2 className="text-2xl font-bold text-[#6b1815] mb-4">Ringkasan Kinerja Bulanan</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ScoreCard title="Total Nilai Akhir Bulanan" value={totalNilaiAkhir} />
                    <ScoreCard title="Nilai Akhir Proporsional" value={nilaiProporsional} prominent={true} />
                </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h3 className="text-lg font-bold text-[#6b1815] mb-4">Kinerja per Area</h3>
                <div className="h-96 w-full">
                    <AreaDonutChart 
                        areaScores={areaScores} 
                        userRole={user.role}
                    />
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
                                    <td className="px-4 py-4 text-center">{item.skor_aktual}</td>
                                    <td className="px-4 py-4 text-center">{item.bobot}%</td>
                                    <td className="px-4 py-4 text-center font-semibold">{parseFloat(item.nilai_akhir || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
            
        </div>
    );
}