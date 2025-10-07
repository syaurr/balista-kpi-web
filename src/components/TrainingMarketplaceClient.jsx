'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enrollInTraining } from '../app/actions';
import Modal from './Modal';
import AddTrainingForm from './AddTrainingForm';

// Komponen untuk satu kartu training yang bisa dibuka-tutup
function TrainingCard({ training }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleEnroll = async () => {
        setLoading(true);
        const result = await enrollInTraining(training.id);
        if (result.error) {
            alert(`Error: ${result.error}`);
            setLoading(false);
        } else {
            alert(result.success);
            router.push('/dashboard/learning-plan');
        }
    };

    return (
        <details className="collapse collapse-arrow bg-white shadow-xl border">
            <summary className="collapse-title text-md font-bold text-[#033f3f]">
                {training.nama_program}
            </summary>
            <div className="collapse-content space-y-3">
                <p className="text-sm"><span className="font-semibold">Penyedia:</span> {training.penyedia || '-'}</p>
                <p className="text-sm"><span className="font-semibold">Topik:</span> {training.topik_utama || '-'}</p>
                <p className="text-sm"><span className="font-semibold">Area Terkait:</span> {training.training_area_link.map(l => l.area_name).join(', ') || 'Umum'}</p>
                <div className="card-actions justify-end mt-4">
                    <button onClick={handleEnroll} disabled={loading} className="btn btn-sm btn-primary">
                        {loading ? 'Mendaftar...' : 'Ikuti Training Ini'}
                    </button>
                </div>
            </div>
        </details>
    );
}

// Komponen utama halaman marketplace
export default function TrainingMarketplaceClient({ trainings, allAreas }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    return (
        <div>
            <div className="text-right mb-6">
                <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary shadow-md">
                    + Ajukan Training Eksternal
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainings.map(training => (
                    <TrainingCard key={training.id} training={training} />
                ))}
                 {trainings.length === 0 && <p className="col-span-full text-center text-gray-500 italic">Saat ini belum ada training yang tersedia di katalog.</p>}
            </div>
            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Usulkan Training Eksternal">
                    <AddTrainingForm allAreas={allAreas} onFinished={() => setIsAddModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
}