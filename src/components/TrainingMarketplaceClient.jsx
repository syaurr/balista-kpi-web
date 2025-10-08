'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enrollInTraining } from '../app/actions';
import Modal from './Modal';
import AddTrainingForm from './AddTrainingForm';

// --- AWAL DESAIN BARU: Komponen Kartu Training yang Detail ---
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

    // Fungsi helper untuk format tanggal
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Fungsi helper untuk format Rupiah
    const formatRupiah = (number) => {
        if (number === null || number === undefined) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    return (
        <div className="card bg-white shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col">
            <div className="card-body p-6 flex-grow">
                {/* Status Badge di pojok kanan atas */}
                <div className="badge badge-info absolute top-4 right-4 font-semibold">{training.status}</div>
                
                {/* Judul & Penyedia */}
                <h2 className="card-title text-md font-bold text-[#033f3f] leading-snug pr-16">
                    {training.nama_program}
                </h2>
                <p className="text-sm text-gray-500">Oleh: {training.penyedia || '-'}</p>
                <p className="text-xs text-gray-500 mb-2">Topik: {training.topik_utama || '-'}</p>

                <div className="divider my-1"></div>

                {/* Detail Jadwal & Biaya */}
                <div className="text-xs space-y-2 text-gray-600">
                    <p><span className="font-semibold">Jadwal:</span> {formatDate(training.tanggal_mulai)} - {formatDate(training.tanggal_berakhir)}</p>
                    <p><span className="font-semibold">Biaya:</span> {training.biaya === 'Berbayar' ? formatRupiah(training.biaya_nominal) : 'Gratis'}</p>
                </div>

                {/* Posisi Terkait */}
                <div className="mt-3">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Untuk Posisi:</h3>
                    <div className="flex flex-wrap gap-1">
                        {training.posisi && training.posisi.length > 0 ? (
                            training.posisi.map(p => (
                                <div key={p} className="badge badge-outline badge-sm">{p}</div>
                            ))
                        ) : (
                            <div className="badge badge-ghost badge-sm">Semua Posisi</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bagian Bawah Kartu: Tombol Aksi */}
            <div className="card-actions justify-between items-center p-6 pt-0">
                {training.link_akses ? (
                    <a href={training.link_akses} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-ghost text-blue-600">
                        Link Info
                    </a>
                ) : <div></div>}
                <button onClick={handleEnroll} disabled={loading} className="btn btn-sm btn-primary">
                    {loading ? 'Mendaftar...' : 'Ikuti Training Ini'}
                </button>
            </div>
        </div>
    );
}
// --- AKHIR DESAIN BARU ---

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
                 {trainings.length === 0 && <p className="col-span-full text-center text-gray-500 italic">Saat ini belum ada training yang tersedia untuk posisi Anda.</p>}
            </div>
            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Usulkan Training Eksternal">
                    <AddTrainingForm allAreas={allAreas} onFinished={() => setIsAddModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
}