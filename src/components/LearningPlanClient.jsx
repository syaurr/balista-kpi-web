'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TrainingPlanItem from './TrainingPlanItem';
import Modal from './Modal'; // <-- Pastikan import Modal
import AddTrainingForm from './AddTrainingForm';

export default function LearningPlanClient({ initialPlans, initialMonth, initialYear }) {
    const router = useRouter();
    const [month, setMonth] = useState(initialMonth);
    const [year, setYear] = useState(initialYear);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- ALAT PELACAK ---
    console.log("========================================");
    console.log("DEBUG: Data diterima oleh LearningPlanClient:");
    console.log(initialPlans);
    console.log("========================================");

    const handlePeriodChange = () => {
        router.push(`/dashboard/learning-plan?bulan=${month}&tahun=${year}`);
    };

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
    }));

    // --- PERBAIKAN PENCEGAHAN: Pastikan initialPlans selalu array ---
    const plansToDisplay = Array.isArray(initialPlans) ? initialPlans : [];

    return (
        <div>
            <div className="flex justify-end items-center mb-6 gap-4">
                <button onClick={() => setIsAddModalOpen(true)} className="btn btn-outline btn-primary">
                    + Tambahkan Training Eksternal
                </button>
                {/* --- FITUR PEMILIH PERIODE --- */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-md">
                    <span className="font-semibold text-sm">Lihat Periode:</span>
                    <select value={month} onChange={e => setMonth(e.target.value)} className="select select-bordered select-sm">
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(e.target.value)} className="select select-bordered select-sm">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={handlePeriodChange} className="btn btn-sm btn-primary">Lihat</button>
                </div>
            </div>

            {/* --- KONTEN UTAMA --- */}
            <div className="space-y-6">
                {initialPlans && initialPlans.length > 0 ? (
                    initialPlans.map(plan => (
                        <TrainingPlanItem key={plan.id} plan={plan} />
                    ))
                ) : (
                    <div className="bg-white p-8 rounded-xl shadow-md text-center">
                        <h3 className="text-lg font-bold text-gray-700">Belum Ada Rencana Pengembangan</h3>
                        <p className="text-gray-500 mt-2">Tidak ada training yang 'Disarankan' atau 'Sedang Berjalan' untuk Anda pada periode ini.</p>
                    </div>
                )}
            </div>
             {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Usulkan Training Eksternal">
                    <AddTrainingForm onFinished={() => setIsAddModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
}