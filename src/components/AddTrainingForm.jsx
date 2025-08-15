'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addTrainingProgram } from '../app/actions';

export default function AddTrainingForm({ allPosisi, currentUserPosisi }) {
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        
        // Cek jika user tidak memiliki posisi, jangan tambahkan
        if (currentUserPosisi) {
            formData.append('posisi', currentUserPosisi);
        }

        const result = await addTrainingProgram(formData);

        if (result?.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Usulan training berhasil ditambahkan!' });
            event.target.reset();
            router.refresh();
        }
        
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-lg font-bold text-[#6b1815]">Usulkan atau Tambah Program Training Baru</h3>
            
            {/* --- AWAL PERUBAHAN: Form disamakan dengan form Admin --- */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Program</label>
                <input type="text" name="nama_program" className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Penyedia</label>
                <input type="text" name="penyedia" className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Topik Utama</label>
                <input type="text" name="topik_utama" className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Link Akses/Informasi Program</label>
                <input type="url" name="link_akses" className="mt-1 block w-full border rounded-md p-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                    <input type="date" name="tanggal_mulai" className="mt-1 block w-full border rounded-md p-2"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Berakhir</label>
                    <input type="date" name="tanggal_berakhir" className="mt-1 block w-full border rounded-md p-2"/>
                </div>
            </div>
            
            {/* Field Posisi sekarang tersembunyi dan otomatis */}
            {/* <input type="hidden" name="posisi" value={currentUserPosisi} /> */}

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Biaya</label>
                    <select name="biaya" defaultValue="Gratis" className="mt-1 block w-full border rounded-md p-2">
                        <option>Gratis</option>
                        <option>Berbayar</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" defaultValue="Akan Datang" className="mt-1 block w-full border rounded-md p-2">
                        <option>Akan Datang</option>
                        <option>Berlangsung</option>
                        <option>Selesai</option>
                        <option>Expired</option>
                    </select>
                </div>
            </div>
            {/* --- AKHIR PERUBAHAN --- */}

            <button 
                type="submit" 
                className="w-full bg-[#033f3f] text-white py-2 rounded-lg font-bold hover:bg-[#022c2c] disabled:bg-gray-400"
                disabled={loading}
            >
                {loading ? 'Mengirim...' : 'Submit Usulan'}
            </button>
            {message && (
                <div className={`mt-4 p-3 rounded-md text-sm ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {message.text}
                </div>
            )}
        </form>
    );
}