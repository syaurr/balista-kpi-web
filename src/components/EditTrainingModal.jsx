'use client';

import { useRouter } from 'next/navigation';
import { updateTrainingProgram } from '../app/actions';
import Modal from './Modal';

export default function EditTrainingModal({ training, allPosisi, onClose }) {
    const router = useRouter();

    const handleUpdate = async (formData) => {
        const result = await updateTrainingProgram(formData);
        if (result?.error) {
            alert(`Gagal memperbarui: ${result.error}`);
        } else {
            alert('Program berhasil diperbarui!');
            onClose();
            router.refresh();
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Edit Program Training">
            <form action={handleUpdate} className="space-y-4">
                <input type="hidden" name="id" value={training.id} />
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Program</label>
                    <input type="text" name="nama_program" defaultValue={training?.nama_program} className="mt-1 block w-full border rounded-md p-2" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Penyedia</label>
                    <input type="text" name="penyedia" defaultValue={training?.penyedia} className="mt-1 block w-full border rounded-md p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Topik Utama</label>
                    <input type="text" name="topik_utama" defaultValue={training?.topik_utama} className="mt-1 block w-full border rounded-md p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Link Akses/Informasi Program</label>
                    <input type="url" name="link_akses" defaultValue={training?.link_akses} className="mt-1 block w-full border rounded-md p-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                        <input type="date" name="tanggal_mulai" defaultValue={training?.tanggal_mulai?.split('T')[0]} className="mt-1 block w-full border rounded-md p-2"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tanggal Berakhir</label>
                        <input type="date" name="tanggal_berakhir" defaultValue={training?.tanggal_berakhir?.split('T')[0]} className="mt-1 block w-full border rounded-md p-2"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Posisi Terkait (Tahan Ctrl/Cmd untuk memilih lebih dari satu)</label>
                    <select name="posisi" multiple defaultValue={training?.posisi || []} className="mt-1 block w-full border rounded-md p-2 h-32">
                        {allPosisi.map(p => <option key={p.posisi} value={p.posisi}>{p.posisi}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Biaya</label>
                        <select name="biaya" defaultValue={training?.biaya || 'Gratis'} className="mt-1 block w-full border rounded-md p-2">
                            <option>Gratis</option>
                            <option>Berbayar</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" defaultValue={training?.status || 'Akan Datang'} className="mt-1 block w-full border rounded-md p-2">
                            <option>Akan Datang</option>
                            <option>Berlangsung</option>
                            <option>Expired</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="submit" className="w-full bg-[#033f3f] text-white py-2 rounded-lg font-bold hover:bg-[#022c2c]">
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </Modal>
    );
}