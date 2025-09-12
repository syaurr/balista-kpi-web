import { createClient } from '../../../utils/supabase/server'; 
import { cookies } from 'next/headers';
import AddTrainingForm from '../../../components/AddTrainingForm';

// Fungsi ini mengambil data training, daftar posisi, dan KPI user
async function getTrainingPageData() {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { trainings: [], allPosisi: [], userKpis: [], currentUserPosisi: null };

    const { data: karyawan } = await supabase.from('karyawan').select('posisi').eq('email', user.email).single();
    const currentUserPosisi = karyawan?.posisi;
    
    // Ambil data training dengan KPI terkait
    let trainingQuery = supabase.from('training_programs').select('*, training_kpi_link(kpi_master(kpi_deskripsi))');
    if (currentUserPosisi) {
        trainingQuery = trainingQuery.or(`posisi.cs.{"${currentUserPosisi}"},posisi.is.null`);
    } else {
        trainingQuery = trainingQuery.is('posisi', null);
    }
    const { data: trainings, error } = await trainingQuery.order('created_at', { ascending: false });
    if (error) console.error("Error fetching training data:", error.message);

    // Ambil semua posisi
    const { data: allPosisi } = await supabase.from('karyawan').select('posisi').order('posisi');

    // Ambil daftar KPI untuk posisi user
    const { data: userKpis } = await supabase.from('kpi_master').select('id, kpi_deskripsi').eq('posisi', currentUserPosisi);

    return { 
        trainings: trainings || [], 
        allPosisi: allPosisi || [],
        userKpis: userKpis || [],
        currentUserPosisi: currentUserPosisi
    };
}

// Komponen Tabel untuk menampilkan daftar training
function TrainingTable({ trainings }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-[#6b1815] mb-4">Daftar Program Training Tersedia</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#6b1815] text-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nama Program</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Penyedia</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Topik Utama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tanggal Mulai</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tanggal Berakhir</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Biaya</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Diinput Oleh</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">KPI Terkait</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Akses</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {trainings.map(training => (
                            <tr key={training.id}>
                                <td className="px-6 py-4 whitespace-normal">{training.nama_program}</td>
                                <td className="px-6 py-4">{training.penyedia}</td>
                                <td className="px-6 py-4 whitespace-normal">{training.topik_utama}</td>
                                <td className="px-6 py-4">{formatDate(training.tanggal_mulai)}</td>
                                <td className="px-6 py-4">{formatDate(training.tanggal_berakhir)}</td>
                                <td className="px-6 py-4">{training.biaya}</td>
                                <td className="px-6 py-4">{training.status}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        training.created_by_role === 'Admin' ? 'bg-sky-100 text-sky-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {training.created_by_role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    {training.training_kpi_link?.length > 0 ? (
                                        <ul className="list-disc list-inside">
                                            {training.training_kpi_link.map(link => (
                                                <li key={link.kpi_master.kpi_deskripsi}>{link.kpi_master.kpi_deskripsi}</li>
                                            ))}
                                        </ul>
                                    ) : 'Umum'}
                                </td>
                                <td className="px-6 py-4">
                                    <a href={training.link_akses} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800">
                                        Link
                                    </a>
                                </td>
                            </tr>
                        ))}
                         {trainings.length === 0 && (
                            <tr>
                                <td colSpan="10" className="text-center py-8 text-gray-500 italic">Belum ada program training yang tersedia untuk posisi Anda.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Komponen Halaman Utama
export default async function TrainingPage() {
    const { trainings, allPosisi, userKpis, currentUserPosisi } = await getTrainingPageData();

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Program Training & Pengembangan Diri</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <AddTrainingForm allPosisi={allPosisi} userKpis={userKpis} currentUserPosisi={currentUserPosisi} />
                </div>
                <div className="lg:col-span-2">
                    <TrainingTable trainings={trainings} />
                </div>
            </div>
        </div>
    );
}
