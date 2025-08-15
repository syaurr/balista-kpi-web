'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../utils/supabase/client';
import { addTrainingProgram, deleteTrainingProgram } from '../../../actions';
import ImportForm from '../../../../components/ImportForm';
import EditTrainingModal from '../../../../components/EditTrainingModal'; // <-- KUNCINYA DI SINI
import Modal from '../../../../components/Modal';

// Komponen Form Tambah
function TrainingForm({ allPosisi, onFormSubmit }) {
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const handleAdd = async (formData) => {
        setLoading(true);
        setMessage(null);
        const result = await addTrainingProgram(formData);
        
        if (result?.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Program baru berhasil ditambahkan!' });
            onFormSubmit(); // Panggil fungsi untuk refresh data
        }
        setLoading(false);
    };
    
    return (
        <form action={handleAdd} className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-lg font-bold text-[#6b1815]">Tambah Program Baru</h3>
            <div><label className="block text-sm font-medium text-gray-700">Nama Program</label><input type="text" name="nama_program" className="mt-1 block w-full border rounded-md p-2" required /></div>
            <div><label className="block text-sm font-medium text-gray-700">Penyedia</label><input type="text" name="penyedia" className="mt-1 block w-full border rounded-md p-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Topik Utama</label><input type="text" name="topik_utama" className="mt-1 block w-full border rounded-md p-2" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Link Akses/Informasi Program</label><input type="url" name="link_akses" className="mt-1 block w-full border rounded-md p-2" /></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700">Tanggal Mulai</label><input type="date" name="tanggal_mulai" className="mt-1 block w-full border rounded-md p-2"/></div><div><label className="block text-sm font-medium text-gray-700">Tanggal Berakhir</label><input type="date" name="tanggal_berakhir" className="mt-1 block w-full border rounded-md p-2"/></div></div>
            <div><label className="block text-sm font-medium text-gray-700">Posisi Terkait (Tahan Ctrl/Cmd untuk memilih lebih dari satu)</label><select name="posisi" multiple className="mt-1 block w-full border rounded-md p-2 h-32">{allPosisi.map(p => <option key={p.posisi} value={p.posisi}>{p.posisi}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700">Biaya</label><select name="biaya" defaultValue="Gratis" className="mt-1 block w-full border rounded-md p-2"><option>Gratis</option><option>Berbayar</option></select></div><div><label className="block text-sm font-medium text-gray-700">Status</label><select name="status" defaultValue="Akan Datang" className="mt-1 block w-full border rounded-md p-2"><option>Akan Datang</option><option>Berlangsung</option><option>Expired</option></select></div></div>

            <button type="submit" disabled={loading} className="w-full bg-[#033f3f] text-white py-2 rounded-lg font-bold hover:bg-[#022c2c] disabled:bg-gray-400">
                {loading ? 'Menyimpan...' : 'Tambah Program'}
            </button>
            {message && <div className={`mt-4 p-2 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}
        </form>
    );
}

// Halaman Utama Admin
export default function AdminTrainingPage() {
    const [trainings, setTrainings] = useState([]);
    const [allPosisi, setAllPosisi] = useState([]);
    const [editingTraining, setEditingTraining] = useState(null);
    const [deletingTraining, setDeletingTraining] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchData = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) {
            router.push('/login');
            return;
        }

        const { data: trainingsData } = await supabase.from('training_programs').select('*').order('created_at', { ascending: false });
        const { data: posisiData } = await supabase.from('karyawan').select('posisi').order('posisi');
        setTrainings(trainingsData || []);
        setAllPosisi(posisiData || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async () => {
        if (!deletingTraining) return;
        const formData = new FormData();
        formData.append('id', deletingTraining.id);
        const result = await deleteTrainingProgram(formData);
        if (result?.error) {
            alert(`Gagal menghapus: ${result.error}`);
        } else {
            alert(`Program "${deletingTraining.nama_program}" berhasil dihapus.`);
            fetchData();
        }
        setDeletingTraining(null);
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Admin: Kelola Program Training</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <TrainingForm allPosisi={allPosisi} onFormSubmit={fetchData} />
                <ImportForm />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md mt-8">
                <h3 className="text-lg font-bold text-[#6b1815] mb-4">Daftar Semua Program Training</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#6b1815] text-white">
                            <tr>
                                <th className="px-6 py-3 text-left">Nama Program</th>
                                <th className="px-6 py-3 text-left">Penyedia</th>
                                <th className="px-6 py-3 text-left">Posisi</th>
                                <th className="px-6 py-3 text-left">Biaya</th>
                                <th className="px-6 py-3 text-left">Tanggal Mulai</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center p-8">Loading data...</td></tr>
                            ) : (
                                trainings.map(training => (
                                    <tr key={training.id}>
                                        <td className="px-6 py-4">{training.nama_program}</td>
                                        <td className="px-6 py-4">{training.penyedia}</td>
                                        <td className="px-6 py-4">{training.posisi?.join(', ')}</td>
                                        <td className="px-6 py-4">{training.biaya}</td>
                                        <td className="px-6 py-4">{formatDate(training.tanggal_mulai)}</td>
                                        <td className="px-6 py-4">{training.status}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => setEditingTraining(training)} className="btn btn-sm">Edit</button>
                                            <button onClick={() => setDeletingTraining(training)} className="btn btn-sm btn-ghost text-red-600">Hapus</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {editingTraining && (
                <EditTrainingModal
                    training={editingTraining}
                    allPosisi={allPosisi}
                    onClose={() => {
                        setEditingTraining(null);
                        fetchData();
                    }}
                />
            )}
            
            {deletingTraining && (
                <Modal
                    isOpen={true}
                    onClose={() => setDeletingTraining(null)}
                    title="Konfirmasi Penghapusan"
                >
                    <p>Yakin ingin menghapus program: <span className="font-bold">"{deletingTraining.nama_program}"</span>?</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={() => setDeletingTraining(null)} className="btn btn-sm">Batal</button>
                        <button onClick={handleDelete} className="btn btn-sm btn-error">Ya, Hapus</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}