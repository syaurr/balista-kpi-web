'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BehavioralRadarChart from './BehavioralRadarChart';
import { closeAssessmentPeriod, generateAllCertificatesForPeriod } from '../app/actions';
import Modal from './Modal';
import CreatePeriodForm from './CreatePeriodForm';

// --- Sub-Komponen untuk Tampilan Hasil ---
function ResultsTabs({ data }) {
    const [activeTab, setActiveTab] = useState('karyawan');
    const [detailAssessor, setDetailAssessor] = useState(null); // State untuk modal detail
    const { scores_by_employee, scores_by_aspect, assessment_status } = data || {};

    // --- FUNGSI HELPER BARU UNTUK WARNA RANKING ---
    const getRankColor = (rankIndex) => {
        if (rankIndex === 0) return "progress-success"; // Peringkat 1 (Emas/Hijau)
        if (rankIndex === 1) return "progress-info";    // Peringkat 2 (Perak/Biru)
        if (rankIndex === 2) return "progress-warning"; // Peringkat 3 (Perunggu/Kuning)
        return "progress-neutral"; // Peringkat lainnya (Abu-abu)
    };

    const statusByAssessor = useMemo(() => {
        if (!assessment_status) return {};
        
        return assessment_status.reduce((acc, task) => {
            const name = task.assessor_name;
            if (!acc[name]) {
                acc[name] = { tasks: [], completed: 0, total: 0 };
            }
            acc[name].tasks.push(task);
            acc[name].total += 1;
            if (task.status === 'Selesai') {
                acc[name].completed += 1;
            }
            return acc;
        }, {});
    }, [assessment_status]);

    return (
        <div>
            <div role="tablist" className="tabs tabs-lifted tabs-lg">
                <a role="tab" className={`tab ${activeTab === 'karyawan' ? 'tab-active' : ''}`} onClick={() => setActiveTab('karyawan')}>Skor per Karyawan</a>
                <a role="tab" className={`tab ${activeTab === 'aspek' ? 'tab-active' : ''}`} onClick={() => setActiveTab('aspek')}>Ranking per Aspek</a>
                <a role="tab" className={`tab ${activeTab === 'status' ? 'tab-active' : ''}`} onClick={() => setActiveTab('status')}>Status Progres</a>
            </div>

            <div className="bg-white p-6 rounded-b-xl rounded-tr-xl shadow-md min-h-[400px]">
                {/* Konten Tab 1: Per Karyawan (Tidak Berubah) */}
                {activeTab === 'karyawan' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {scores_by_employee && scores_by_employee.length > 0 ? (
                            scores_by_employee.map((emp, index) => (
                                <div key={emp.id || index} className="card bg-base-100 shadow-lg border">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg">{emp.nama}</h3>
                                        <p className="text-sm text-gray-500 -mt-2 mb-2">{emp.posisi}</p>
                                        <div className="h-64 w-full">
                                            <BehavioralRadarChart scores={emp.scores_per_aspect || []} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center italic py-16">
                                Belum ada skor untuk ditampilkan pada periode ini.
                            </div>
                        )}
                    </div>
                )}
                
                {/* --- AWAL PEROMBAKAN: TAB 2 (PER ASPEK) --- */}
                {activeTab === 'aspek' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {scores_by_aspect && scores_by_aspect.length > 0 ? scores_by_aspect.map(aspect => (
                            <div key={aspect.nama_aspek} className="card bg-base-100 shadow border">
                                <div className="card-body">
                                    <h4 className="card-title text-base mb-4">{aspect.nama_aspek}</h4>
                                    <div className="space-y-4">
                                        {aspect.ranked_list?.map((rank, index) => (
                                            <div key={rank.employee_name || index}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-semibold">{index + 1}. {rank.employee_name}</span>
                                                    <span className="font-bold">{rank.final_score.toFixed(2)}</span>
                                                </div>
                                                <progress 
                                                    className={`progress ${getRankColor(index)} w-full`} 
                                                    value={rank.final_score} 
                                                    max="100"
                                                ></progress>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )) : <p className="col-span-full text-center italic">Belum ada skor untuk ditampilkan.</p>}
                    </div>
                )}
                {/* --- AKHIR PEROMBAKAN --- */}
                {activeTab === 'status' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(statusByAssessor).map(([assessorName, data]) => {
                            const progressPercent = (data.completed / data.total) * 100;
                            return (
                                <div key={assessorName} className="card bg-base-100 shadow border">
                                    <div className="card-body">
                                        <h4 className="card-title text-base">{assessorName}</h4>
                                        <p className="text-sm text-gray-500 -mt-2 mb-2">Tugas Penilaian Selesai</p>
                                        <div className="flex items-center gap-4">
                                            <progress 
                                                className={`progress ${progressPercent < 100 ? 'progress-warning' : 'progress-success'} w-full`} 
                                                value={progressPercent} 
                                                max="100"
                                            ></progress>
                                            <span className="font-bold text-sm">{data.completed}/{data.total}</span>
                                        </div>
                                        <div className="card-actions justify-end mt-4">
                                            <button className="btn btn-sm btn-outline" onClick={() => setDetailAssessor(data.tasks)}>
                                                Lihat Detail
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(statusByAssessor).length === 0 && (
                            <p className="col-span-full text-center italic">Belum ada tugas penilaian untuk periode ini.</p>
                        )}
                    </div>
                )}

                {detailAssessor && (
                    <Modal isOpen={true} onClose={() => setDetailAssessor(null)} title={`Detail Tugas: ${detailAssessor[0].assessor_name}`}>
                        <div className="max-h-[60vh] overflow-y-auto">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Nama yang Dinilai</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailAssessor.map(task => (
                                        <tr key={task.task_id} className="hover">
                                            <td>{task.assessed_name}</td>
                                            <td>
                                                <span className={`badge ${task.status === 'Selesai' ? 'badge-success' : 'badge-warning'}`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
}

// --- Sub-Komponen untuk Tampilan Manajemen ---
function ManagementView({ allPeriods, onRefresh }) {
    const [loadingId, setLoadingId] = useState(null);

    const handleAction = async (action, period, confirmMessage) => {
        const confirm = window.confirm(confirmMessage);
        if (confirm) {
            setLoadingId(period.id);
            const result = await action(period.id);
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                alert(result.success);
            }
            setLoadingId(null);
            onRefresh();
        }
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="bg-white p-6 rounded-xl shadow-md min-h-[400px]">
            <h3 className="font-bold text-lg mb-4">Daftar Periode Penilaian</h3>
            <div className="overflow-x-auto">
                <table className="table">
                    <thead><tr><th>Nama Periode</th><th>Jadwal</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
                    <tbody>
                        {allPeriods.map(period => (
                            <tr key={period.id} className="hover">
                                <td className="font-bold">{period.nama_periode}</td>
                                <td>{formatDate(period.start_date)} - {formatDate(period.end_date)}</td>
                                <td><div className={`badge ${period.status === 'Open' ? 'badge-success' : period.status === 'Closed' ? 'badge-neutral' : 'badge-ghost'}`}>{period.status}</div></td>
                                <td className="text-right space-x-2">
                                    {period.status === 'Open' && (
                                        <button className="btn btn-xs btn-warning" onClick={() => handleAction(closeAssessmentPeriod, period, `Tutup periode "${period.nama_periode}"?`)} disabled={loadingId === period.id}>
                                            {loadingId === period.id ? '...' : 'Tutup Periode'}
                                        </button>
                                    )}
                                    {period.status === 'Closed' && (
                                        <button className="btn btn-xs btn-secondary" onClick={() => handleAction(generateAllCertificatesForPeriod, period, `Generate sertifikat untuk periode "${period.nama_periode}"?`)} disabled={loadingId === period.id}>
                                            {loadingId === period.id ? '...' : 'Generate Sertifikat'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- KOMPONEN UTAMA (PENGGABUNG) ---
export default function BehavioralResultsClient({ allPeriods, activePeriodId, initialData }) {
    const router = useRouter();
    // --- PERBAIKAN DI SINI: Deklarasikan state yang hilang ---
    const [mainTab, setMainTab] = useState('hasil');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const { 
        progress, 
        scores_by_employee, 
        scores_by_aspect, 
        assessment_status 
    } = initialData || {};
    
    const progressPercent = useMemo(() => {
        if (!progress || !progress.total_tasks || progress.total_tasks === 0) return 0;
        return (progress.completed_tasks / progress.total_tasks) * 100;
    }, [progress]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md">
                    <label className="label"><span className="label-text font-semibold">Pilih Periode:</span></label>
                    <select value={activePeriodId || ''} onChange={(e) => router.push(`/dashboard/admin/behavioral-results?periode_id=${e.target.value}`)} className="select select-bordered w-full">
                        {allPeriods.map(p => <option key={p.id} value={p.id}>{p.nama_periode}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                    + Buat Periode Baru
                </button>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                <h3 className="font-bold text-gray-700">Progres Penilaian Periode Ini</h3>
                <div className="flex items-center gap-4 mt-2">
                    <progress className="progress progress-success w-full" value={progressPercent} max="100"></progress>
                    <span className="font-bold text-lg text-teal-600">{progress?.completed_tasks || 0} / {progress?.total_tasks || 0}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Tugas penilaian telah diselesaikan.</p>
            </div>

            <div role="tablist" className="tabs tabs-boxed">
                <a role="tab" className={`tab ${mainTab === 'hasil' ? 'tab-active' : ''}`} onClick={() => setMainTab('hasil')}>Hasil & Skor</a>
                <a role="tab" className={`tab ${mainTab === 'manajemen' ? 'tab-active' : ''}`} onClick={() => setMainTab('manajemen')}>Manajemen Periode & Status</a>
            </div>

            {mainTab === 'hasil' && <ResultsTabs data={initialData} />}
            {mainTab === 'manajemen' && <ManagementView allPeriods={allPeriods} onRefresh={() => router.refresh()} />}

            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Buat Periode Penilaian Behavioral Baru">
                    <CreatePeriodForm onFinished={() => {
                        setIsAddModalOpen(false);
                        router.refresh();
                    }} />
                </Modal>
            )}
        </div>
    );
}