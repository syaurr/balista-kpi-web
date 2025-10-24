'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enrollInTraining } from '../app/actions';
import Modal from './Modal';
import AddTrainingForm from './AddTrainingForm';
import Link from 'next/link';

// Komponen Modal Baru untuk memilih periode pendaftaran
function EnrollModal({ training, onClose }) {
    const [loading, setLoading] = useState(false);
    // Default ke bulan saat ini
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const router = useRouter();

    const handleConfirmEnroll = async () => {
        setLoading(true);
        // Buat string periode dari pilihan user
        const periode = `${new Date(0, parseInt(month, 10) - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;
        const result = await enrollInTraining(training.id, periode);
        if (result.error) {
            alert(`Error: ${result.error}`);
            setLoading(false);
        } else {
            alert(result.success);
            // Arahkan user ke halaman learning plan dengan periode yang baru dipilih
            router.push(`/dashboard/learning-plan?bulan=${month}&tahun=${year}`);
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
    }));

    return (
        <Modal isOpen={true} onClose={onClose} title="Konfirmasi Pendaftaran Training">
            <div className="space-y-4">
                <p>Anda akan mendaftar untuk training: <br/><span className="font-bold">{training.nama_program}</span></p>
                <p>Silakan pilih periode di mana Anda akan mengikuti training ini:</p>
                <div className="flex items-center gap-2">
                    <select value={month} onChange={e => setMonth(e.target.value)} className="select select-bordered w-full">
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(e.target.value)} className="select select-bordered w-full">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="card-actions justify-end mt-6">
                    <button onClick={onClose} className="btn">Batal</button>
                    <button onClick={handleConfirmEnroll} disabled={loading} className="btn btn-primary">
                        {loading ? 'Mendaftar...' : 'Konfirmasi & Daftar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// Komponen Kartu Training yang menampilkan semua detail
function TrainingCard({ training, onEnrollClick }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatRupiah = (number) => {
        if (number === null || number === undefined) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    return (
        <div className="card bg-white shadow-xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col">
            <div className="card-body p-6 flex-grow">
                <div className="badge badge-info absolute top-4 right-4 font-semibold">{training.status}</div>
                <h2 className="card-title text-md font-bold text-[#033f3f] leading-snug pr-16">{training.nama_program}</h2>
                <p className="text-sm text-gray-500">Oleh: {training.penyedia || '-'}</p>
                <p className="text-xs text-gray-500 mb-2">Topik: {training.topik_utama || '-'}</p>
                <div className="divider my-1"></div>
                <div className="text-xs space-y-2 text-gray-600">
                    <p><span className="font-semibold">Jadwal:</span> {formatDate(training.tanggal_mulai)} - {formatDate(training.tanggal_berakhir)}</p>
                    <p><span className="font-semibold">Biaya:</span> {training.biaya === 'Berbayar' ? formatRupiah(training.biaya_nominal) : 'Gratis'}</p>
                </div>
                <div className="mt-3">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Area KPI Terkait</h3>
                    <div className="flex flex-wrap gap-1">
                        {training.training_area_link && training.training_area_link.length > 0 ? (
                            training.training_area_link.map(link => (
                                <div key={link.area_name} className="badge badge-ghost badge-sm">{link.area_name}</div>
                            ))
                        ) : (<div className="badge badge-ghost badge-sm">Umum</div>)}
                    </div>
                </div>
                <div className="mt-3">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Untuk Posisi:</h3>
                    <div className="flex flex-wrap gap-1">
                        {training.posisi && training.posisi.length > 0 ? (
                            training.posisi.map(p => (<div key={p} className="badge badge-outline badge-sm">{p}</div>))
                        ) : (<div className="badge badge-ghost badge-sm">Semua Posisi</div>)}
                    </div>
                </div>
            </div>
            <div className="card-actions justify-between items-center p-6 pt-0">
                {training.link_akses ? (
                    <a href={training.link_akses} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-ghost text-blue-600">Link Info</a>
                ) : <div></div>}
                <button onClick={() => onEnrollClick(training)} className="btn btn-sm btn-primary">
                    Ikuti Training Ini
                </button>
            </div>
        </div>
    );
}

// Komponen utama halaman marketplace
export default function TrainingMarketplaceClient({ trainings, allAreas }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [enrollingTraining, setEnrollingTraining] = useState(null);

    return (
        <div>
            {/* --- AWAL PERBAIKAN --- */}
            <div className="flex justify-between items-center mb-6">
                {/* Tombol navigasi baru di sebelah kiri */}
                <Link href="/dashboard/learning-plan" className="btn btn-outline btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    Lihat Learning Plan
                </Link>
                
                {/* Tombol "Ajukan" tetap di sebelah kanan */}
                <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary shadow-md">
                    + Ajukan Training Eksternal
                </button>
            </div>
            {/* --- AKHIR PERBAIKAN --- */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainings.map(training => (
                    <TrainingCard key={training.id} training={training} onEnrollClick={setEnrollingTraining} />
                ))}
                 {trainings.length === 0 && <p className="col-span-full text-center text-gray-500 italic">Saat ini belum ada training yang tersedia untuk posisi Anda.</p>}
            </div>
            {isAddModalOpen && (
                <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Usulkan Training Eksternal">
                    <AddTrainingForm allAreas={allAreas} onFinished={() => setIsAddModalOpen(false)} />
                </Modal>
            )}
            {enrollingTraining && (
                <EnrollModal training={enrollingTraining} onClose={() => setEnrollingTraining(null)} />
            )}
        </div>
    );
}