'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScoreCard from './ScoreCard';
import AreaDonutChart from './AreaDonutChart';
import { updateTrainingPlanStatus } from '../app/actions';
import Modal from './Modal'; // <-- Import komponen Modal
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // <-- Tambahkan Filler untuk arsir
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // <-- Daftarkan Filler
);

function RecommendedTrainingModal({ plan, onClose, onStart, loading }) {
    // Ambil detail program dari data yang sudah ada
    const training = plan.training_programs;

    // Fungsi helper untuk format tanggal dan Rupiah
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const formatRupiah = (number) => {
        if (number === null || number === undefined) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Detail Program Training">
            <div className="space-y-4">
                {/* Judul & Penyedia */}
                <h2 className="text-xl font-bold text-[#033f3f]">{training.nama_program}</h2>
                <p className="text-sm text-gray-500">Oleh: {training.penyedia || '-'}</p>
                <p className="text-xs text-gray-500 -mt-2">Topik: {training.topik_utama || '-'}</p>

                <div className="divider my-2"></div>

                {/* Detail Jadwal & Biaya */}
                <div className="text-sm space-y-2 text-gray-600">
                    <p><span className="font-semibold">Jadwal:</span> {formatDate(training.tanggal_mulai)} - {formatDate(training.tanggal_berakhir)}</p>
                    <p><span className="font-semibold">Biaya:</span> {training.biaya === 'Berbayar' ? formatRupiah(training.biaya_nominal) : 'Gratis'}</p>
                </div>

                {/* Posisi Terkait */}
                <div className="mt-3">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Untuk Posisi:</h3>
                    <div className="flex flex-wrap gap-1">
                        {training.posisi && training.posisi.length > 0
                            ? training.posisi.map(p => <div key={p} className="badge badge-outline badge-sm">{p}</div>)
                            : <div className="badge badge-ghost badge-sm">Semua Posisi</div>
                        }
                    </div>
                </div>

                {/* Tombol Aksi di dalam Modal */}
                <div className="card-actions justify-between items-center pt-6">
                    {training.link_akses ? (
                        <a href={training.link_akses} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost text-blue-600">Link Info</a>
                    ) : <div></div>}
                    <button onClick={onStart} disabled={loading} className="btn btn-success text-white shadow-md">
                        {loading ? 'Memproses...' : 'Ya, Mulai Training Ini'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
function KpiHistoryChart({ kpiHistory }) {
    const data = {
        labels: kpiHistory.map(item => item.periode),
        datasets: [
            {
                label: 'Nilai Akhir Proporsional',
                data: kpiHistory.map(item => item.nilai_proporsional.toFixed(2)),
                borderColor: 'rgba(2, 132, 130, 1)', // Warna teal
                backgroundColor: 'rgba(2, 132, 130, 0.2)', // Warna arsir teal
                fill: true,
                tension: 0.3 // Membuat garis sedikit melengkung
            },
            {
                label: 'Total Nilai Akhir',
                data: kpiHistory.map(item => item.total_nilai_akhir.toFixed(2)),
                borderColor: 'rgba(108, 117, 125, 1)', // Warna abu-abu
                backgroundColor: 'rgba(108, 117, 125, 0.1)', // Warna arsir abu-abu
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

export default function DashboardClient({ user, initialData, initialMonth, initialYear, karyawanId, periode }) {
    const router = useRouter();
    const { rekap, areaScores, recommendations, summary, recommendedTrainings, pendingTaskCount, behavioralScores, kpiHistory } = initialData;

    const [month, setMonth] = useState(initialMonth);
    const [year, setYear] = useState(initialYear);
    const [loading, setLoading] = useState(false);
    const [selectedTrainingDetail, setSelectedTrainingDetail] = useState(null); // <-- State baru untuk modal

    const handlePeriodChange = () => {
        router.push(`/dashboard?bulan=${month}&tahun=${year}`);
    };

    const handleStartTraining = async (planId) => {
        setLoading(true);
        const result = await updateTrainingPlanStatus(planId, 'Sedang Berjalan');
        if (result.error) {
            alert(`Error: ${result.error}`);
            setLoading(false);
        } else {
            alert('Status training berhasil diperbarui! Anda akan diarahkan ke halaman Learning Plan.');
            router.push('/dashboard/learning-plan');
        }
    };

    // --- AWAL PERBAIKAN LOGIKA PROPORSIONAL ---
    const { totalNilaiAkhir, nilaiProporsional } = useMemo(() => {
        if (!rekap || rekap.length === 0) {
            return { totalNilaiAkhir: 0, nilaiProporsional: 0 };
        }

        let total = 0;
        let totalBobotYangDinilai = 0;

        rekap.forEach(item => {
            // Total Nilai Akhir dihitung dari semua KPI yang ada
            total += parseFloat(item.nilai_akhir || 0);
            
            // Total Bobot HANYA dihitung dari KPI yang skornya > 0,
            // tidak peduli frekuensinya apa.
            if (item.skor_aktual > 0) {
                totalBobotYangDinilai += item.bobot;
            }
        });
        
        const proporsional = totalBobotYangDinilai > 0 ? (total / (totalBobotYangDinilai / 100.0)) : 0;
        return { totalNilaiAkhir: total, nilaiProporsional: proporsional };
    }, [rekap]);
    // --- AKHIR PERBAIKAN LOGIKA PROPORSIONAL ---
    
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
                <h2 className="text-2xl font-bold text-[#6b1815] mb-4">Rencana Pengembangan Bulan Ini</h2>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    {recommendedTrainings.length > 0 ? (
                        <div>
                            <p className="text-gray-600 mb-4">Berdasarkan kinerjamu periode lalu, sistem merekomendasikan training berikut untukmu:</p>
                            <div className="space-y-3">
                                {recommendedTrainings.map(plan => (
                                    <div key={plan.id} className="p-3 bg-teal-50 rounded-lg flex justify-between items-center">
                                        <span className="font-semibold text-teal-800">
                                            {plan.training_programs.nama_program}
                                        </span>
                                        {/* --- PERBAIKAN TOMBOL AKSI --- */}
                                        <button 
                                            onClick={() => setSelectedTrainingDetail(plan)}
                                            className="btn btn-sm btn-outline btn-primary"
                                        >
                                            Lihat Detail Program
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-600">Kerja bagus! Tidak ada training yang secara khusus direkomendasikan untuk Anda berdasarkan kinerja periode ini.</p>
                    )}
                    <Link href="/dashboard/learning-plan" className="btn btn-sm btn-outline btn-primary mt-4">
                        Lihat Semua Rencana Pengembangan
                    </Link>
                </div>
            </section>
            
            <section className="mb-8">
                <h2 className="text-2xl font-bold text-[#6b1815] mb-4">Ringkasan Kinerja Bulanan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ScoreCard title="Total Nilai Akhir Bulanan" value={totalNilaiAkhir} />
                    <ScoreCard title="Nilai Akhir Proporsional" value={nilaiProporsional} prominent={true} />
                </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h3 className="text-lg font-bold text-[#6b1815] mb-4">Tren Kinerja KPI (Semua Periode)</h3>
                <div className="h-96 w-full">
                    {kpiHistory && kpiHistory.length > 0 ? (
                        <KpiHistoryChart kpiHistory={kpiHistory} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="italic text-gray-500 text-center">
                                Data riwayat belum cukup untuk menampilkan grafik tren.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h3 className="text-lg font-bold text-[#6b1815] mb-4">Kinerja per Area</h3>
                <div className="h-96 w-full">
                    {/* --- PERBAIKAN: Kirim prop ke komponen chart --- */}
                    <AreaDonutChart 
                        areaScores={areaScores} 
                        userRole={user.role}
                        karyawanId={karyawanId}
                        periode={periode}
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
            
        {selectedTrainingDetail && (
                <RecommendedTrainingModal
                    plan={selectedTrainingDetail}
                    loading={loading}
                    onClose={() => setSelectedTrainingDetail(null)}
                    onStart={() => {
                        handleStartTraining(selectedTrainingDetail.id);
                        setSelectedTrainingDetail(null); // Tutup modal setelah aksi
                    }}
                />
            )}
        </div>
    );
}