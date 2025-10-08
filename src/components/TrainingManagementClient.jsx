'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import ImportForm from './ImportForm';
import { addTrainingProgram, updateTrainingProgram, approveTraining, rejectTraining, deleteTrainingProgram } from '../app/actions';

// Komponen Form untuk Tambah/Edit (tidak ada perubahan di sini)
function TrainingForm({ training, allPositions, allAreas, onFinished }) {
    const [loading, setLoading] = useState(false);
    // State untuk menampilkan input biaya nominal secara kondisional
    const [isPaid, setIsPaid] = useState(training?.biaya === 'Berbayar');
    
    // Tentukan aksi yang akan digunakan (tambah atau perbarui)
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
    
    // Ambil data area yang sudah terhubung dengan training ini (untuk mode edit)
    const linkedAreas = training?.training_area_link.map(link => link.area_name) || [];

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
            {training?.id && <input type="hidden" name="id" value={training.id} />}
            
            <div><label className="block text-sm font-medium">Nama Program</label><input type="text" name="nama_program" defaultValue={training?.nama_program} className="input input-bordered w-full" required /></div>
            
            <div><label className="block text-sm font-medium">Area KPI Terkait</label>
                <div className="bg-gray-50 p-2 rounded-md max-h-32 overflow-y-auto grid grid-cols-2 gap-2 mt-1">
                    {allAreas.map(area => (
                        <label key={area} className="label cursor-pointer space-x-2 justify-start">
                            <input type="checkbox" name="linked_areas" value={area} defaultChecked={linkedAreas.includes(area)} className="checkbox checkbox-sm" />
                            <span className="label-text text-sm">{area}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div><label className="block text-sm font-medium">Penyedia</label><input type="text" name="penyedia" defaultValue={training?.penyedia} className="input input-bordered w-full" /></div>
            <div><label className="block text-sm font-medium">Topik Utama</label><input type="text" name="topik_utama" defaultValue={training?.topik_utama} className="input input-bordered w-full" /></div>
            <div><label className="block text-sm font-medium">Link Akses/Informasi</label><input type="url" name="link_akses" defaultValue={training?.link_akses} className="input input-bordered w-full" /></div>
            
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Tanggal Mulai</label><input type="date" name="tanggal_mulai" defaultValue={training?.tanggal_mulai?.split('T')[0]} className="input input-bordered w-full"/></div>
                <div><label className="block text-sm font-medium">Tanggal Berakhir</label><input type="date" name="tanggal_berakhir" defaultValue={training?.tanggal_berakhir?.split('T')[0]} className="input input-bordered w-full"/></div>
            </div>
            
            <div><label className="block text-sm font-medium">Posisi Terkait (Tahan Ctrl/Cmd untuk memilih)</label><select name="posisi" multiple defaultValue={training?.posisi || []} className="select select-bordered w-full h-32">{allPositions.map(p => <option key={p.posisi} value={p.posisi}>{p.posisi}</option>)}</select></div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Biaya</label>
                    <select name="biaya" defaultValue={training?.biaya || 'Gratis'} onChange={(e) => setIsPaid(e.target.value === 'Berbayar')} className="select select-bordered w-full">
                        <option>Gratis</option>
                        <option>Berbayar</option>
                    </select>
                </div>
                {isPaid && (
                     <div>
                        <label className="block text-sm font-medium">Biaya Nominal (Rp)</label>
                        <input type="number" name="biaya_nominal" defaultValue={training?.biaya_nominal} className="input input-bordered w-full" placeholder="500000" />
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium">Status Program</label>
                <select name="status" defaultValue={training?.status || 'Akan Datang'} className="select select-bordered w-full">
                    <option>Akan Datang</option>
                    <option>Berlangsung</option>
                    <option>Expired</option>
                    <option>Ditolak</option>
                </select>
            </div>

            <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
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
    
    // --- FUNGSI BARU UNTUK MENGHANDLE PENGHAPUSAN ---
    const handleDelete = async (training) => {
        const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus program "${training.nama_program}" secara permanen? Tindakan ini tidak dapat dibatalkan.`);
        if (confirmDelete) {
            const formData = new FormData();
            formData.append('id', training.id);
            const result = await deleteTrainingProgram(formData);
            if (result.error) {
                alert(`Gagal menghapus: ${result.error}`);
            } else {
                alert('Program berhasil dihapus.');
                router.refresh();
            }
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
    
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

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
                    <table className="table table-zebra w-full">
                        <thead>
                           <tr>
                                {/* --- AWAL PERBAIKAN LEBAR KOLOM --- */}
                                <th className="w-1/2">Nama & Detail Program</th>
                                <th className="w-1/5">Posisi & Area Terkait</th>
                                <th className="w-1/6">Jadwal</th>
                                <th className="w-1/7">Biaya</th>
                                <th className="w-1/3">Status</th>
                                <th className="text-right">Aksi</th>
                                {/* --- AKHIR PERBAIKAN LEBAR KOLOM --- */}
                            </tr>
                        </thead>
                        <tbody>
                            {trainingsToDisplay.map(training => (
                                <tr key={training.id}>
                                    <td className="align-top">
                                        <div className="font-bold whitespace-normal">{training.nama_program}</div>
                                        <div className="text-xs opacity-70">Penyedia: {training.penyedia || '-'}</div>
                                        <div className="text-xs opacity-70">Topik: {training.topik_utama || '-'}</div>
                                        {training.link_akses && <a href={training.link_akses} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline mt-2">Link Info</a>}
                                    </td>
                                    <td className="align-top">
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <div className="font-semibold text-xs">Posisi:</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {/* --- AWAL PERBAIKAN GAYA BADGE --- */}
                                                    {training.posisi?.map(p => 
                                                        <div key={p} className="badge badge-outline h-auto p-1 text-xs" style={{ whiteSpace: 'normal' }}>{p}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-xs mt-2">Area KPI:</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {training.training_area_link.map(l => 
                                                        <div key={l.area_name} className="badge badge-ghost h-auto p-1 text-xs" style={{ whiteSpace: 'normal' }}>{l.area_name}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-xs align-top">
                                        <div>Mulai: {formatDate(training.tanggal_mulai)}</div>
                                        <div>Selesai: {formatDate(training.tanggal_berakhir)}</div>
                                    </td>
                                    <td className="align-top text-xs whitespace-normal">
                                        {training.biaya === 'Berbayar' 
                                            ? formatRupiah(training.biaya_nominal) 
                                            : 'Gratis'
                                        }
                                    </td>
                                    <td className="align-top">
                                        <div 
                                            className="badge badge-neutral font-semibold h-auto text-xs p-1" 
                                            style={{ whiteSpace: 'normal' }}
                                        >
                                            {training.status}
                                        </div>
                                    </td>
                                    <td className="text-right align-top space-x-2">
                                        {training.status === 'Menunggu Persetujuan' ? (
                                            <>
                                                <button onClick={() => handleAction(approveTraining, training.id, 'MENYETUJUI')} className="btn btn-xs btn-success">Setujui</button>
                                                <button onClick={() => handleAction(rejectTraining, training.id, 'MENOLAK')} className="btn btn-xs btn-error">Tolak</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleOpenModal(training)} className="btn btn-xs">Edit</button>
                                                {/* --- TOMBOL HAPUS BARU --- */}
                                                <button onClick={() => handleDelete(training)} className="btn btn-xs btn-error btn-outline">Hapus</button>
                                            </> 
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {trainingsToDisplay.length === 0 && (
                                <tr><td colSpan="6" className="text-center italic py-4">Tidak ada data untuk ditampilkan.</td></tr>
                            )}
                        </tbody>
                    </table>
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