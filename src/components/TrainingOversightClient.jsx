'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { verifyTrainingCompletion } from '../app/actions';
import Modal from './Modal';
import TrainingPlanItem from './TrainingPlanItem';

export default function TrainingOversightClient({ initialPlans }) {
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [detailPlan, setDetailPlan] = useState(null);
    const router = useRouter();

    const handleVerification = async (plan, event) => {
        event.stopPropagation(); 
        
        const confirmAction = window.confirm(`Verifikasi bahwa ${plan.karyawan.nama} telah menyelesaikan training "${plan.training_programs.nama_program}"?`);
        if (confirmAction) {
            const result = await verifyTrainingCompletion(plan.id);
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                alert(result.success);
                setDetailPlan(null); 
                router.refresh();
            }
        }
    };

    const filteredPlans = useMemo(() => {
        if (filterStatus === 'Semua') {
            return initialPlans;
        }
        return initialPlans.filter(plan => plan.status === filterStatus);
    }, [filterStatus, initialPlans]);

    const statuses = ['Semua', 'Disarankan', 'Sedang Berjalan', 'Menunggu Verifikasi', 'Selesai'];

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center mb-4 space-x-2">
                <label className="font-semibold">Filter berdasarkan Status:</label>
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="select select-bordered select-sm"
                >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Nama Karyawan</th>
                            <th>Posisi</th>
                            <th>Nama Training</th>
                            <th>Periode</th>
                            <th>Status</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPlans.map(plan => (
                            <tr key={plan.id} onClick={() => setDetailPlan(plan)} className="cursor-pointer hover">
                                <td>{plan.karyawan.nama}</td>
                                <td>{plan.karyawan.posisi}</td>
                                <td>{plan.training_programs.nama_program}</td>
                                <td>{plan.periode}</td>
                                <td>
                                    <div className={`badge ${
                                        plan.status === 'Selesai' ? 'badge-success' :
                                        plan.status === 'Sedang Berjalan' ? 'badge-info' :
                                        plan.status === 'Menunggu Verifikasi' ? 'badge-error' : 'badge-warning'
                                    }`}>{plan.status}</div>
                                </td>
                                <td className="text-right">
                                    {plan.status === 'Menunggu Verifikasi' && (
                                        <button 
                                            onClick={(e) => handleVerification(plan, e)}
                                            className="btn btn-xs btn-success"
                                        >
                                            Verifikasi Selesai
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {filteredPlans.length === 0 && (
                            <tr><td colSpan="6" className="text-center italic py-4">Tidak ada data yang cocok dengan filter.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {detailPlan && (
                <Modal 
                    isOpen={true} 
                    onClose={() => setDetailPlan(null)} 
                    title={`Detail Plan: ${detailPlan.karyawan.nama}`}
                >
                    <div className="max-h-[70vh] overflow-y-auto">
                        <TrainingPlanItem plan={detailPlan} viewOnly={true} />
                    </div>
                </Modal>
            )}
        </div>
    );
}