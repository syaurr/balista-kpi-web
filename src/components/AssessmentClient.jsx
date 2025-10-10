'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveFullAssessment, addRecommendation, updateRecommendation, deleteRecommendation } from '../app/actions';
import ScoreCard from './ScoreCard';
import Modal from './Modal';
import dynamic from 'next/dynamic';

const AreaDonutChart = dynamic(() => import('./AreaDonutChart'), { ssr: false, loading: () => <p>Memuat chart...</p> });

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

    // --- ARSITEKTUR BARU ---
    // 1. Baca parameter URL untuk mengontrol TAMPILAN form filter
    const employeeIdFromUrl = searchParams.get('karyawanId') || '';
    const monthFromUrl = searchParams.get('bulan') || (new Date().getMonth() + 1).toString().padStart(2, '0');
    const yearFromUrl = searchParams.get('tahun') || new Date().getFullYear().toString();
    
    // 2. State HANYA untuk input form filter
    const [employeeInput, setEmployeeInput] = useState(employeeIdFromUrl);
    const [monthInput, setMonthInput] = useState(monthFromUrl);
    const [yearInput, setYearInput] = useState(yearFromUrl);

    // 3. Semua data inti (kpis, scores, dll.) datang dari props, BUKAN dari state
    const { kpis, scores, generalNote, recommendations, areaScores: initialAreaScores } = initialAssessmentData || {};
    
    // 4. State HANYA untuk data yang bisa diedit oleh user di halaman ini
    const [currentScores, setCurrentScores] = useState(scores || {});
    const [currentGeneralNote, setCurrentGeneralNote] = useState(generalNote || '');
    const [currentRecommendations, setCurrentRecommendations] = useState(recommendations || []);
    
    // ... (State lain seperti loading, message, modal tidak berubah)
    const [editingRecommendation, setEditingRecommendation] = useState(null);
    const [newRecommendation, setNewRecommendation] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [linkModalKpi, setLinkModalKpi] = useState(null);

     useEffect(() => {
        // Efek ini akan berjalan setiap kali data dari server (initialAssessmentData) berubah
        if (initialAssessmentData) {
            setCurrentScores(initialAssessmentData.scores || {});
            setCurrentGeneralNote(initialAssessmentData.generalNote || '');
            setCurrentRecommendations(initialAssessmentData.recommendations || []);
        }
    }, [initialAssessmentData]); 

    const periode = useMemo(() => {
        if (!employeeIdFromUrl) return null;
        return `${new Date(0, parseInt(monthFromUrl, 10) - 1).toLocaleString('id-ID', { month: 'long' })} ${yearFromUrl}`;
    }, [monthFromUrl, yearFromUrl, employeeIdFromUrl]);

    // Fungsi ini HANYA mengubah URL, membiarkan server mengambil data baru
    const handleSelectionChange = () => {
        const params = new URLSearchParams();
        params.set('karyawanId', employeeInput);
        params.set('bulan', monthInput);
        params.set('tahun', yearInput);
        router.push(`/dashboard/admin/assessment?${params.toString()}`);
    };
    
    const { totalNilaiAkhir, nilaiProporsional, areaScores } = useMemo(() => {
        if (!kpis || kpis.length === 0) {
            return { totalNilaiAkhir: 0, nilaiProporsional: 0, areaScores: [] };
        }

        let totalNilai = 0;
        let totalBobotYangDinilai = 0;
        const areaData = {};

        kpis.forEach(kpi => {
            const score = currentScores[kpi.id] || 0;
            const nilai = score * (kpi.bobot / 100.0);

            // 1. Total Nilai Akhir dihitung dari SEMUA KPI yang ada (termasuk yang skornya 0)
            totalNilai += nilai;
            
            // 2. Total Bobot untuk Proporsional HANYA dihitung dari KPI yang skornya > 0
            if (score > 0) {
                totalBobotYangDinilai += kpi.bobot;
            }
            
            // 3. Logika untuk chart juga HANYA dari KPI yang skornya > 0
            if (score > 0) {
                const areaName = kpi.area || 'Lain-lain';
                if (!areaData[areaName]) {
                    areaData[areaName] = { totalScore: 0, count: 0 };
                }
                areaData[areaName].totalScore += score;
                areaData[areaName].count += 1;
            }
        });
        
        const proporsional = totalBobotYangDinilai > 0 ? (totalNilai / (totalBobotYangDinilai / 100.0)) : 0;
        
        const finalAreaScores = Object.entries(areaData).map(([area, data]) => ({
            area,
            average_score: data.count > 0 ? data.totalScore / data.count : 0
        }));

        return { totalNilaiAkhir: totalNilai, nilaiProporsional: proporsional, areaScores: finalAreaScores };
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

    const chartAreaScores = useMemo(() => {
    if (!areaScores || !kpis || areaScores.length === 0 || kpis.length === 0) {
        return [];
    }

    // 1. Buat pemetaan dari area_kerja -> area
    const areaKerjaToAreaMap = new Map();
        kpis.forEach(kpi => {
            if (kpi.area_kerja && kpi.area) {
                areaKerjaToAreaMap.set(kpi.area_kerja, kpi.area);
            }
        });

        // 2. Kelompokkan skor berdasarkan 'Area' umum
        const groupedByArea = {}; // Format: { 'Kinerja & Evaluasi': { scores: [85, 90], count: 2 } }
        
        areaScores.forEach(scoreItem => {
            const specificArea = scoreItem.area; // Ini adalah 'area_kerja' dari RPC
            const generalArea = areaKerjaToAreaMap.get(specificArea);

            if (generalArea) {
                if (!groupedByArea[generalArea]) {
                    groupedByArea[generalArea] = { scores: [], count: 0 };
                }
                groupedByArea[generalArea].scores.push(scoreItem.average_score);
                groupedByArea[generalArea].count += 1;
            }
        });

        // 3. Hitung rata-rata final untuk setiap 'Area' umum
        return Object.entries(groupedByArea).map(([areaName, data]) => {
            const sum = data.scores.reduce((total, score) => total + score, 0);
            return {
                area: areaName,
                average_score: sum / data.count,
            };
        });

    }, [areaScores, kpis]);

    const handleScoreChange = (kpiId, value) => {
        setCurrentScores(prev => ({ ...prev, [kpiId]: Math.max(0, Math.min(100, parseInt(value, 10) || 0)) }));
    };

    const handleAddRecommendation = async () => {
        if (newRecommendation.trim() && selectedEmployeeId && periode) {
            await addRecommendation(selectedEmployeeId, periode, newRecommendation);
            setNewRecommendation('');
            fetchAllData(); // Muat ulang semua data
        }
    };

    // --- FUNGSI BARU UNTUK MENGHAPUS REKOMENDASI ---
    const handleDeleteRecommendation = async (rec) => {
        if (window.confirm(`Yakin ingin menghapus rekomendasi: "${rec.rekomendasi_text}"?`)) {
            const formData = new FormData();
            formData.append('id', rec.id);
            const result = await deleteRecommendation(formData);
            if (result.error) {
                alert(`Gagal menghapus: ${result.error}`);
            } else {
                alert('Rekomendasi berhasil dihapus.');
                fetchAllData();
            }
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

           {initialAssessmentData ? (
                <>
                    {/* Tampilkan semua data dari state yang sudah diinisialisasi */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ScoreCard title="Total Nilai Akhir Bulanan" value={totalNilaiAkhir} />
                        <ScoreCard title="Nilai Akhir Proporsional" value={nilaiProporsional} prominent={true} />
                    </section>
                                        
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Catatan Umum</label>
                        <textarea value={currentGeneralNote} onChange={(e) => setCurrentGeneralNote(e.target.value)} rows="3" className="textarea textarea-bordered w-full"/>
                    </div>

                    <details className="collapse collapse-arrow bg-white shadow-md rounded-xl" open>
                        <summary className="collapse-title text-xl font-bold text-[#6b1815]">Detail Kinerja per Area & Rekomendasi</summary>
                        <div className="collapse-content space-y-8 p-4">
                            <div className="h-96 w-full">
                                <AreaDonutChart 
                                    areaScores={areaScores} 
                                    userRole="Admin"
                                    karyawanId={employeeIdFromUrl}
                                    periode={periode}
                                />
                            </div>
                            <div className="p-4 border-t">
                                <h3 className="font-bold text-lg mb-2">Rekomendasi</h3>
                                <div className="max-h-40 overflow-y-auto mb-4">
                                    <table className="table table-xs">
                                        <thead>
                                            <tr>
                                                <th>No.</th>
                                                <th>Deskripsi Rekomendasi</th>
                                                <th className="text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentRecommendations.map((rec, index) => (
                                                <tr key={rec.id || index}>
                                                    <th className="text-center">{index + 1}</th>
                                                    <td>{rec.rekomendasi_text}</td>
                                                    <td className="text-right space-x-2">
                                                        <button onClick={() => setEditingRecommendation(rec)} className="btn btn-xs btn-outline">Edit</button>
                                                        <button onClick={() => handleDeleteRecommendation(rec)} className="btn btn-xs btn-ghost text-red-600">Hapus</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {currentRecommendations.length === 0 && (
                                                <tr><td colSpan="3" className="text-center italic">Belum ada rekomendasi.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex space-x-2">
                                    <input type="text" value={newRecommendation} onChange={e => setNewRecommendation(e.target.value)} className="input input-bordered w-full" placeholder="Tambah rekomendasi baru..."/>
                                    <button onClick={handleAddRecommendation} className="btn btn-primary">Tambah</button>
                                </div>
                            </div>
                        </div>
                    </details>
                    
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold text-[#6b1815] mb-4">Input Skor KPI</h3>
                        <div className="space-y-4">
                            {kpis.map((kpi, index) => (
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
            ) : (
                <div className="text-center bg-white p-8 rounded-xl shadow-md">
                    <p className="font-semibold">Pilih karyawan dan periode di atas, lalu klik "Tampilkan Data" untuk memulai.</p>
                </div>
            )}
            
            {linkModalKpi && <LinkModal kpi={linkModalKpi} onClose={() => setLinkModalKpi(null)} />}
            {editingRecommendation && (
                <Modal 
                    isOpen={true}
                    onClose={() => setEditingRecommendation(null)}
                    title="Edit Rekomendasi"
                >
                    <form action={async (formData) => {
                        formData.append('id', editingRecommendation.id);
                        await updateRecommendation(formData);
                        setEditingRecommendation(null);
                        router.refresh(); // Refresh untuk memuat ulang data
                    }}>
                        <textarea 
                            name="rekomendasi_text"
                            defaultValue={editingRecommendation.rekomendasi_text}
                            rows="4"
                            className="textarea textarea-bordered w-full"
                        ></textarea>
                        <div className="mt-4 flex justify-end">
                            <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}