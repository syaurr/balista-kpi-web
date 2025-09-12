// app/components/AssessmentClient.jsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveFullAssessment, addRecommendation, fetchAssessmentData } from '../app/actions';
import ScoreCard from './ScoreCard';
import Modal from './Modal';
import AreaDonutChart from './AreaDonutChart';

function LinkModal({ kpi, onClose }) {
    if (!kpi || !kpi.kpi_links || kpi.kpi_links.length === 0) return null;
    return (
        <Modal isOpen={true} onClose={onClose} title={`Link Referensi untuk: ${kpi.kpi_deskripsi}`}>
            <div className="space-y-3">
                <p className="text-sm text-gray-600">Pilih link di bawah ini untuk membukanya di tab baru:</p>
                <ul className="list-disc list-inside bg-gray-50 p-4 rounded-md">
                    {kpi.kpi_links.map((link, index) => (
                        <li key={link.id || index}>
                            <a href={link.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                {link.link_url}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </Modal>
    );
}


export default function AssessmentClient({ employees, initialAssessmentData }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const selectedEmployeeId = searchParams.get('karyawanId') || '';
    const currentMonth = searchParams.get('bulan') || (new Date().getMonth() + 1).toString().padStart(2, '0');
    const currentYear = searchParams.get('tahun') || new Date().getFullYear().toString();
    
    // PERBAIKAN: Definisikan 'periode' di scope utama agar bisa diakses semua fungsi
    const periode = useMemo(() => {
        if (!selectedEmployeeId) return null;
        const monthName = new Date(0, currentMonth - 1).toLocaleString('id-ID', { month: 'long' });
        return `${monthName} ${currentYear}`;
    }, [currentMonth, currentYear, selectedEmployeeId]);

    const [employeeInput, setEmployeeInput] = useState(selectedEmployeeId);
    const [monthInput, setMonthInput] = useState(currentMonth);
    const [yearInput, setYearInput] = useState(currentYear);

    const { kpis, scores, generalNote, recommendations, areaScores } = initialAssessmentData || { 
        kpis: [], scores: {}, generalNote: '', recommendations: [], areaScores: [] 
    };
    
    const [currentScores, setCurrentScores] = useState(scores);
    const [currentGeneralNote, setCurrentGeneralNote] = useState(generalNote);
    const [currentRecommendations, setCurrentRecommendations] = useState(recommendations); // State baru untuk rekomendasi
    const [newRecommendation, setNewRecommendation] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [linkModalKpi, setLinkModalKpi] = useState(null);

    // app/components/AssessmentClient.jsx

    const handleSelectionChange = () => {
        const params = new URLSearchParams();
        if (employeeInput) params.set('karyawanId', employeeInput);
        if (monthInput) params.set('bulan', monthInput);
        if (yearInput) params.set('tahun', yearInput);

        // GANTI router.push dengan window.location.href untuk memaksa FULL REFRESH
        window.location.href = `/dashboard/admin/assessment?${params.toString()}`;
    };

    const { totalNilaiAkhir, nilaiProporsional } = useMemo(() => {
        let total = 0;
        let totalBobot = 0;
        if (!kpis || kpis.length === 0) return { totalNilaiAkhir: 0, nilaiProporsional: 0 };
        kpis.forEach(kpi => {
            const score = currentScores[kpi.id] || 0;
            const nilai = score * (kpi.bobot / 100.0);
            total += nilai;
            if (kpi.frekuensi && ['bulanan', 'mingguan', 'harian', 'per kebutuhan', 'per kasus'].some(f => kpi.frekuensi.toLowerCase().includes(f))) {
                totalBobot += kpi.bobot;
            }
        });
        const proporsional = totalBobot > 0 ? (total / (totalBobot / 100.0)) : 0;
        return { totalNilaiAkhir: total, nilaiProporsional: proporsional };
    }, [currentScores, kpis]);

    const sortedKpis = useMemo(() => {
        if (!kpis) return [];
        // Buat salinan array agar tidak mengubah state asli, lalu urutkan
        return [...kpis].sort((a, b) => {
            const areaA = a.area || ''; // Fallback jika area null
            const areaB = b.area || ''; // Fallback jika area null
            return areaA.localeCompare(areaB);
        });
    }, [kpis]);

    const handleScoreChange = (kpiId, value) => {
        setCurrentScores(prev => ({ ...prev, [kpiId]: Math.max(0, Math.min(100, parseInt(value, 10) || 0)) }));
    };

    const handleAddRecommendation = async () => {
        if (newRecommendation.trim() && selectedEmployeeId && periode) {
            await addRecommendation(selectedEmployeeId, periode, newRecommendation);
            setNewRecommendation('');
            // Refresh data rekomendasi dengan memanggil ulang fetch
            const { recommendations: newRecs } = await fetchAssessmentData(selectedEmployeeId, periode);
            setCurrentRecommendations(newRecs.recommendations || []);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);
        const formData = new FormData();
        formData.append('karyawanId', selectedEmployeeId);
        formData.append('periode', periode);
        // PERBAIKAN: Kirim data yang ada di state saat ini
        formData.append('scores', JSON.stringify(currentScores));
        formData.append('generalNote', currentGeneralNote);

        const result = await saveFullAssessment(formData);
        if (result.error) setMessage({ type: 'error', text: result.error });
        else setMessage({ type: 'success', text: result.success });
        setLoading(false);
    };

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString().padStart(2, '0'),
        label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
    }));

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pilih Karyawan</label>
                        <select value={employeeInput} onChange={e => setEmployeeInput(e.target.value)} className="select select-bordered w-full mt-1">
                            <option value="" disabled>Pilih...</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.nama} ({emp.posisi})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bulan</label>
                        <select value={monthInput} onChange={e => setMonthInput(e.target.value)} className="select select-bordered w-full mt-1">
                            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tahun</label>
                        <select value={yearInput} onChange={e => setYearInput(e.target.value)} className="select select-bordered w-full mt-1">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSelectionChange} disabled={!employeeInput} className="btn btn-primary w-full">Tampilkan Data</button>
                </div>
            </div>

            {initialAssessmentData && (
                <>
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card untuk Total Nilai Akhir Bulanan */}
                        <div className="bg-white p-6 rounded-xl shadow-md text-center">
                            <h3 className="text-base font-medium text-gray-500">Total Nilai Akhir Bulanan</h3>
                            <p className="text-2xl font-bold text-[#022020] mt-2">
                                {parseFloat(totalNilaiAkhir || 0).toFixed(2)}
                            </p>
                        </div>
                        
                        {/* Card untuk Nilai Akhir Proporsional */}
                        <div className="bg-white p-6 rounded-xl shadow-md text-center">
                            <h3 className="text-base font-medium text-gray-500">Nilai Akhir Proporsional</h3>
                            <p className="text-4xl font-bold text-[#6b1815] mt-2">
                                {parseFloat(nilaiProporsional || 0).toFixed(2)}
                            </p>
                        </div>
                    </section>
                                        
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Catatan Umum Penilaian KPI (Bulanan)</label>
                        <textarea value={currentGeneralNote} onChange={(e) => setCurrentGeneralNote(e.target.value)} rows="3" className="textarea textarea-bordered w-full" placeholder="Tuliskan catatan umum untuk penilaian periode ini..."/>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        {/* Kita buat judulnya manual dengan tag h2 */}
                        <h2 className="text-xl font-bold text-[#6b1815] mb-4">
                            Detail Kinerja per Area & Rekomendasi
                        </h2>
                        
                        <div className="space-y-8">

                            <div className="h-96 w-full">
                                <AreaDonutChart areaScores={areaScores} />
                            </div>

                            {/* Bagian Rekomendasi */}
                            <div className="p-4 border-t">
                                <h3 className="font-bold text-lg mb-2">Rekomendasi</h3>
                                <div className="max-h-40 overflow-y-auto mb-4">
                                    <table className="table table-xs">
                                        <tbody>
                                            {currentRecommendations.map((r, i) => <tr key={r.id || i}><td>{r.rekomendasi_text}</td></tr>)}
                                            {currentRecommendations.length === 0 && <tr><td>Belum ada rekomendasi.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex space-x-2">
                                    <input type="text" value={newRecommendation} onChange={e => setNewRecommendation(e.target.value)} className="input input-bordered w-full" placeholder="Tambah rekomendasi baru..."/>
                                    <button onClick={handleAddRecommendation} className="btn btn-primary">Tambah</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold text-[#6b1815] mb-4">Input Skor KPI</h3>
                        <div className="space-y-4">
                            {sortedKpis.map((kpi, index) => (
                                <div key={kpi.id} className="p-4 border rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex-grow w-full">
                                        <label className="font-bold">{index + 1}. {kpi.kpi_deskripsi}</label>
                                        <p className="text-xs text-gray-500">Area Kerja: {kpi.area_kerja} | Bobot: {kpi.bobot}%</p>
                                        {kpi.kpi_links && kpi.kpi_links.length > 0 && (
                                            <button onClick={() => setLinkModalKpi(kpi)} className="btn btn-xs btn-outline mt-2">
                                                Lihat Link ({kpi.kpi_links.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="w-full md:w-52 text-center flex-shrink-0">
                                        <input
                                            type="number" min="0" max="100"
                                            value={currentScores[kpi.id] || 0}
                                            onChange={(e) => handleScoreChange(kpi.id, e.target.value)}
                                            className="input input-bordered w-32 text-center text-xl font-bold"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSave} disabled={loading} className="btn btn-primary btn-lg">{loading ? 'Menyimpan...' : 'Simpan Seluruh Penilaian'}</button>
                        </div>
                        {message && <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
                    </div>
                </>
            )}
            
            {linkModalKpi && <LinkModal kpi={linkModalKpi} onClose={() => setLinkModalKpi(null)} />}
        </div>
    );
}