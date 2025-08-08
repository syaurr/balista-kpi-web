import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';
import { addTrainingProgram, updateTrainingProgram, deleteTrainingProgram } from '../../../actions';
import { revalidatePath } from 'next/cache';

async function getAdminData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false, trainings: [] };

    const { data: karyawan } = await supabase.from('karyawan').select('role').eq('email', user.email).single();
    const isAdmin = karyawan?.role === 'Admin';

    if (!isAdmin) return { isAdmin: false, trainings: [] };

    const { data: trainings } = await supabase.from('training_programs').select('*').order('created_at', { ascending: false });
    
    return { isAdmin, trainings: trainings || [] };
}

// Komponen Form untuk Tambah / Edit (TETAP SEBAGAI SERVER COMPONENT)
interface TrainingProgram {
    id: number;
    nama_program: string;
    penyedia: string;
    link_akses: string;
    biaya: string;
    created_by_role: string;
}

function TrainingForm({ action, title, training = null, buttonText }: { 
    action: (formData: FormData) => Promise<any>;
    title: string;
    training?: TrainingProgram | null;
    buttonText: string;
}) {
    // Fungsi 'action' di sini adalah Server Action yang kita teruskan
    return (
        <form action={action} className="bg-base-100 p-4 rounded-box space-y-4">
            <h3 className="text-lg font-bold text-[#6b1815]">{title}</h3>
            {training && <input type="hidden" name="id" value={training.id} />}
            <div>
                <label className="block text-sm font-medium text-gray-700">Nama Program</label>
                <input type="text" name="nama_program" defaultValue={training?.nama_program} className="mt-1 block w-full border rounded-md p-2" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Penyedia</label>
                <input type="text" name="penyedia" defaultValue={training?.penyedia} className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Link Akses</label>
                <input type="url" name="link_akses" defaultValue={training?.link_akses} className="mt-1 block w-full border rounded-md p-2" />
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
                    <label className="block text-sm font-medium text-gray-700">Dibuat Oleh</label>
                    <select name="created_by_role" defaultValue={training?.created_by_role || 'Admin'} className="mt-1 block w-full border rounded-md p-2">
                        <option>Admin</option>
                        <option>User</option>
                    </select>
                </div>
            </div>
            <button type="submit" className="w-full bg-[#033f3f] text-white py-2 rounded-lg font-bold hover:bg-[#022c2c]">
                {buttonText}
            </button>
        </form>
    );
}

// Komponen untuk baris tabel (TETAP SEBAGAI SERVER COMPONENT)
function TrainingTableRow({ training }) {
    // Kita buat Server Action khusus di dalam sini untuk Delete
    const deleteAction = async () => {
        'use server';
        const supabase = createClient();
        const { error } = await supabase.from('training_programs').delete().eq('id', training.id);
        if (error) { console.error('Delete error:', error); }
        revalidatePath('/dashboard/admin/training');
    };

    return (
        <tr>
            <td className="px-6 py-4">{training.nama_program}</td>
            <td className="px-6 py-4">{training.penyedia}</td>
            <td className="px-6 py-4">{training.biaya}</td>
            <td className="px-6 py-4">{training.created_by_role}</td>
            <td className="px-6 py-4 space-x-2">
                <details className="dropdown dropdown-left">
                    <summary className="m-1 btn btn-sm">Edit</summary>
                    <div className="p-0 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-96">
                       <TrainingForm action={updateTrainingProgram} title="Edit Program" training={training} buttonText="Simpan Perubahan" />
                    </div>
                </details>
                <form action={deleteAction} className="inline">
                    <button type="submit" className="text-red-600 hover:text-red-800">Hapus</button>
                </form>
            </td>
        </tr>
    );
}

export default async function AdminTrainingPage() {
    const { isAdmin, trainings } = await getAdminData();

    if (!isAdmin) {
        return (
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
                <p className="text-gray-600">Anda tidak memiliki hak akses untuk membuka halaman ini.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Admin: Kelola Semua Program Training</h1>
            
            <TrainingForm action={addTrainingProgram} title="Tambah Program Training Baru" buttonText="Tambah Program" />

            <div className="bg-white p-6 rounded-xl shadow-md mt-8">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#6b1815] text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nama Program</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Penyedia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Biaya</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Dibuat Oleh</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                         <tbody className="bg-white divide-y divide-gray-200">
                            {trainings.map(training => (
                                <TrainingTableRow key={training.id} training={training} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}