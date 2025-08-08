import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import { addTrainingProgram } from '../../actions';

async function getTrainingData() {
    const supabase = createClient(cookies());
    // Urutkan berdasarkan yang terbaru
    const { data, error } = await supabase.from('training_programs').select('*').order('created_at', { ascending: false });
    return data || [];
}

// Komponen Form untuk menambah training baru
function AddTrainingForm() {
    return (
        // --- PERUBAHAN DI SINI: Gunakan server action ---
        <form action={addTrainingProgram} className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-lg font-bold text-[#6b1815]">Usulkan Program Training Baru</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Program</label>
                <input type="text" name="nama_program" className="mt-1 block w-full border rounded-md p-2" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Penyedia</label>
                <input type="text" name="penyedia" className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Link Akses</label>
                <input type="url" name="link_akses" className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <button type="submit" className="w-full bg-[#033f3f] text-white py-2 rounded-lg font-bold hover:bg-[#022c2c]">
                Submit Usulan
            </button>
        </form>
    );
}

// Komponen Tabel untuk menampilkan daftar training
function TrainingTable({ trainings }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-[#6b1815] mb-4">Daftar Program Training Tersedia</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#6b1815] text-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nama Program</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Penyedia</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Biaya</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Akses</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {trainings.map(training => (
                            <tr key={training.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{training.nama_program}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{training.penyedia}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{training.biaya}</td>
                                <td className="px-6 py-4 whitespace-nowrap">Akan Datang</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <a href={training.link_akses} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800">
                                        Link
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export default async function TrainingPage() {
    const trainings = await getTrainingData();

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Program Training & Pengembangan Diri</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <AddTrainingForm />
                </div>
                <div className="lg:col-span-2">
                    <TrainingTable trainings={trainings} />
                </div>
            </div>
        </div>
    );
}