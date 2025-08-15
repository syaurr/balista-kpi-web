'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTrainingProgram } from '../app/actions';
import Modal from './Modal';

export default function DeleteTrainingButton({ trainingId, trainingName }) {
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('id', trainingId);
        
        const result = await deleteTrainingProgram(formData);
        
        // --- PERBAIKAN LOGIKA NOTIFIKASI ---
        if (result?.error) {
            // Tampilkan pesan error spesifik dari server
            alert(`Gagal menghapus: ${result.error}`);
        } else if (result?.success) {
            // Tampilkan pesan sukses
            alert(`Program "${trainingName}" berhasil dihapus.`);
            router.refresh();
        } else {
            // Fallback jika terjadi respons yang tidak beklen
            alert('Terjadi kesalahan yang tidak diketahui.');
        }
        // --- AKHIR PERBAIKAN ---
        
        setLoading(false);
        setIsModalOpen(false);
    };

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="btn btn-xs btn-ghost text-red-600"
            >
                Hapus
            </button>

            <Modal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Konfirmasi Penghapusan"
            >
                <p className="text-gray-700">
                    Apakah Anda yakin ingin menghapus program: <br/>
                    <span className="font-bold">"{trainingName}"</span>?
                    <br/><br/>
                    <span className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
                </p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold disabled:bg-red-300"
                    >
                        {loading ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </Modal>
        </>
    );
}