'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import ImportForm from './ImportForm';
import { addTrainingProgram, updateTrainingProgram, approveTraining, rejectTraining } from '../app/actions';

// Komponen Form untuk Tambah/Edit (tidak ada perubahan di sini)
function TrainingForm({ training, allPositions, allAreas, onFinished }) {
    const [loading, setLoading] = useState(false);
    const action = training ? updateTrainingProgram : addTrainingProgram;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await action(formData);
        
        if(result?.error) {
            alert(`Error: ${result.error}`);
        } else {
            alert(result.success || 'Operasi berhasil!');
            onFinished();
        }
        setLoading(false);
    };
    
    const linkedAreas = training?.training_area_link.map(link => link.area_name) || [];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {training?.id && <input type="hidden" name="id" value={training.id} />}
            <div><label className="block text-sm font-medium">Nama Program</label><input type="text" name="nama_program" defaultValue={training?.nama_program} className="input input-bordered w-full" required /></div>
            <div><label className="block text-sm font-medium">Area KPI Terkait</label>
                <div className="bg-gray-50 p-2 rounded-md max-h-32 overflow-y-auto grid grid-cols-2 gap-2">
                    {allAreas.map(area => (
                        <label key={area} className="label cursor-pointer space-x-2 justify-start">
                            <input type="checkbox" name="linked_areas" value={area} defaultChecked={linkedAreas.includes(area)} className="checkbox checkbox-sm" />
                            <span className="label-text text-sm">{area}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div><label className="block text-sm font-medium">Penyedia</label><input type="text" name="penyedia" defaultValue={training?.penyedia} className="input input-bordered w-full" /></div>
            <div><label className="block text-sm font-medium">Link Akses</label><input type="url" name="link_akses" defaultValue={training?.link_akses} className="input input-bordered w-full" /></div>
            <div><label className="block text-sm font-medium">Posisi Terkait (Tahan Ctrl/Cmd untuk memilih lebih dari satu)</label><select name="posisi" multiple defaultValue={training?.posisi || []} className="select select-bordered w-full h-32">{allPositions.map(p => <option key={p.posisi} value={p.posisi}>{p.posisi}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Status</label><select name="status" defaultValue={training?.status || 'Akan Datang'} className="select select-bordered w-full"><option>Akan Datang</option><option>Berlangsung</option><option>Expired</option></select></div>
                <div><label className="block text-sm font-medium">Biaya</label><select name="biaya" defaultValue={training?.biaya || 'Gratis'} className="select select-bordered w-full"><option>Gratis</option><option>Berbayar</option></select></div>
            </div>
            <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
        </form>
    );
}

// Komponen Utama Halaman
export default function TrainingManagementClient({ initialTrainings, allPositions, allAreas }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTraining, setEditingTraining] = useState(null);
    const [view, setView] = useState('Semua');
    const router = useRouter();

    const handleAction = async (action, trainingId, message) => {
        const confirmAction = window.confirm(`Apakah Anda yakin ingin ${message} training ini?`);
        if (confirmAction) {
            const result = await action(trainingId);
            if (result.error) alert(`Error: ${result.error}`);
            else alert(result.success);
            router.refresh();
        }
    };

    const handleOpenModal = (training = null) => {
        setEditingTraining(training);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTraining(null);
        router.refresh();
    };

    const pendingTrainings = useMemo(() => 
        initialTrainings.filter(t => t.status === 'Menunggu Persetujuan'), 
    [initialTrainings]);

    const otherTrainings = useMemo(() => 
        initialTrainings.filter(t => t.status !== 'Menunggu Persetujuan'), 
    [initialTrainings]);

    const trainingsToDisplay = view === 'Semua' ? otherTrainings : pendingTrainings;

    const formatRupiah = (number) => {
        if (number === null || number === undefined) return '-';
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">
                <button onClick={() => handleOpenModal(null)} className="btn btn-primary h-full text-lg shadow-md">
                    Tambah Program Training Baru
                </button>
                <ImportForm />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#6b1815]">Daftar Program Training</h3>
                    <div className="tabs tabs-boxed">
                        <a className={`tab ${view === 'Semua' ? 'tab-active' : ''}`} onClick={() => setView('Semua')}>Semua Training</a> 
                        <a className={`tab ${view === 'Menunggu Persetujuan' ? 'tab-active' : ''}`} onClick={() => setView('Menunggu Persetujuan')}>
                            Menunggu Persetujuan 
                            {pendingTrainings.length > 0 && <div className="badge badge-warning ml-2">{pendingTrainings.length}</div>}
                        </a>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {/* --- AWAL PERBAIKAN: TABEL LENGKAP --- */}
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Nama Program & Penyedia</th>
                                <th>Area KPI Terkait</th>
                                <th>Status</th>
                                <th>Biaya</th>
                                <th>Link</th>
                                <th className="text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trainingsToDisplay.map(training => (
                                <tr key={training.id}>
                                    <td>
                                        <div className="font-bold">{training.nama_program}</div>
                                        <div className="text-xs opacity-70">{training.penyedia}</div>
                                    </td>
                                    <td className="text-xs max-w-xs">{training.training_area_link.map(l => l.area_name).join(', ')}</td>
                                    <td><div className="badge badge-ghost badge-sm">{training.status}</div></td>
                                    <td>
                                        {training.biaya === 'Berbayar' 
                                            ? formatRupiah(training.biaya_nominal) 
                                            : 'Gratis'
                                        }
                                    </td>
                                    <td>
                                        {training.link_akses && <a href={training.link_akses} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline">Link</a>}
                                    </td>
                                    <td className="text-right space-x-2">
                                        {training.status === 'Menunggu Persetujuan' ? (
                                            <>
                                                <button onClick={() => handleAction(approveTraining, training.id, 'MENYETUJUI')} className="btn btn-xs btn-success">Setujui</button>
                                                <button onClick={() => handleAction(rejectTraining, training.id, 'MENOLAK')} className="btn btn-xs btn-error">Tolak</button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleOpenModal(training)} className="btn btn-xs">Edit</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {trainingsToDisplay.length === 0 && (
                                <tr><td colSpan="6" className="text-center italic py-4">Tidak ada data untuk ditampilkan.</td></tr>
                            )}
                        </tbody>
                    </table>
                    {/* --- AKHIR PERBAIKAN --- */}
                </div>
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTraining ? "Edit Program Training" : "Tambah Program Baru"}>
                    <TrainingForm 
                        training={editingTraining}
                        allPositions={allPositions}
                        allAreas={allAreas}
                        onFinished={handleCloseModal}
                    />
                </Modal>
            )}
        </div>
    );
}
