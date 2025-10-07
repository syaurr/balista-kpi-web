'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../utils/supabase/client'; 
import { addTrainingProgress, updateTrainingPlanStatus } from '../app/actions';

export default function TrainingPlanItem({ plan, viewOnly = false }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const formRef = useRef(null); // Gunakan ref untuk form

    const trainingProgram = plan?.training_programs || { nama_program: 'Nama Training Tidak Ditemukan' };
    const progressUpdates = plan?.training_progress_updates || [];

    const handleStatusChange = async (newStatus) => {
        setLoading(true);
        await updateTrainingPlanStatus(plan.id, newStatus);
        setLoading(false);
        router.refresh();
    };

    // --- PERBAIKAN TOTAL: Logika Handle Submit ---
    // Fungsi ini sekarang menerima 'formData' langsung dari 'action' prop
    const handleProgressSubmitWithUpload = async (formData) => {
        setLoading(true);

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Sesi Anda berakhir, silakan login kembali.');
            setLoading(false);
            return;
        }

        const deskripsi = formData.get('deskripsi');
        const file = formData.get('fileBukti');
        let fileUrl = null;

        if (file && file.size > 0) {
            const filePath = `${user.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('file_bukti_training')
                .upload(filePath, file);

            if (uploadError) {
                alert(`Error unggah file: ${uploadError.message}`);
                setLoading(false);
                return;
            }
            
            const { data: urlData } = supabase.storage
                .from('file_bukti_training').getPublicUrl(filePath);
            fileUrl = urlData.publicUrl;
        }

        const result = await addTrainingProgress(plan.id, deskripsi, fileUrl);
        
        if (result.error) {
            alert(`Error: ${result.error}`);
        } else {
            alert(result.success);
            formRef.current?.reset(); // Reset form menggunakan ref
        }

        setLoading(false);
        router.refresh();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const sortedProgress = useMemo(() => {
        return [...progressUpdates].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [progressUpdates]);

    return (
        <div className="card w-full bg-white shadow-xl border border-gray-200 transition-shadow hover:shadow-2xl">
            <div className="card-body">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="card-title text-xl text-[#033f3f]">{trainingProgram.nama_program}</h2>
                        <p className="text-sm text-gray-500">Periode Penugasan: {plan.periode}</p>
                    </div>
                    <div className={`badge font-semibold ${
                        plan.status === 'Selesai' ? 'badge-success' :
                        plan.status === 'Sedang Berjalan' ? 'badge-info' : 
                        plan.status === 'Menunggu Verifikasi' ? 'badge-warning' : 'badge-neutral'
                    }`}>{plan.status}</div>
                </div>

                <div className="divider my-0"></div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 pt-4">
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800">Riwayat Progres</h3>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 bg-gray-50 p-3 rounded-lg border">
                            {sortedProgress.length > 0 ? sortedProgress.map(progress => (
                                <div key={progress.id} className="chat chat-start">
                                    <div className="chat-header text-xs opacity-60">{formatDate(progress.created_at)}</div>
                                    <div className="chat-bubble text-sm bg-teal-100 text-teal-800">
                                        {progress.deskripsi_progress}
                                        {progress.file_bukti_url && (
                                            <a href={progress.file_bukti_url} target="_blank"  rel="noopener noreferrer" className="text-blue-600 block mt-1 hover:underline font-semibold">Lihat Bukti</a>
                                        )}
                                    </div>
                                </div>
                            )) : <p className="text-sm italic text-gray-500 p-4">Belum ada progres yang dilaporkan.</p>}
                        </div>
                        
                        <div className="pt-4 flex flex-col space-y-2">
                            {plan.status === 'Disarankan' && (
                                <button onClick={() => handleStatusChange('Sedang Berjalan')} className="btn btn-success text-white shadow-md">Mulai Training Ini</button>
                            )}
                             {plan.status === 'Sedang Berjalan' && (
                                <button onClick={() => handleStatusChange('Menunggu Verifikasi')} className="btn btn-warning text-gray-800 shadow-md">Ajukan Verifikasi Selesai</button>
                            )}
                        </div>
                    </div>

                    <div className="border-t lg:border-t-0 lg:border-l lg:pl-8 pt-4 lg:pt-0">
                        {!viewOnly && plan.status === 'Sedang Berjalan' ? (
                            <form ref={formRef} action={handleProgressSubmitWithUpload} className="space-y-3">
                                <h3 className="font-bold text-gray-800">Tambah Progres Baru</h3>
                                <div>
                                    <label className="label text-sm"><span className="label-text">Deskripsi Progres</span></label>
                                    <textarea name="deskripsi" className="textarea textarea-bordered w-full" placeholder="Contoh: Menyelesaikan Modul 3..." required></textarea>
                                </div>
                                <div>
                                    <label className="label text-sm"><span className="label-text">Unggah Bukti (Opsional)</span></label>
                                    <input name="fileBukti" type="file" className="file-input file-input-bordered file-input-sm w-full" />
                                </div>
                                <button type="submit" disabled={loading} className="btn btn-primary w-full shadow-md">
                                    {loading ? 'Mengunggah...' : 'Simpan Progres'}
                                </button>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center bg-gray-50 rounded-lg p-4">
                                <p className="font-semibold">Form Tambah Progres</p>
                                <p className="text-sm text-gray-500 mt-2">Ubah status training menjadi "Sedang Berjalan" untuk dapat menambahkan progres baru.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}