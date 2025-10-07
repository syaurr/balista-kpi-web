import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';
import TrainingOversightClient from '../../../../components/TrainingOversightClient';

async function getOversightData() {
    const supabase = createClient(cookies());
    
    const { data: plans, error } = await supabase
        .from('karyawan_training_plan')
        .select(`id, periode, status, karyawan(nama, posisi), training_programs(nama_program)`)
        // --- PERBAIKAN: Hanya ambil status yang aktif & perlu perhatian ---
        .in('status', ['Disarankan', 'Sedang Berjalan', 'Menunggu Verifikasi', 'Selesai'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching oversight data:", error);
        return [];
    }
    return plans;
}

export default async function TrainingOversightPage() {
    const plans = await getOversightData();

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Monitoring Rencana Pengembangan</h1>
            <p className="text-gray-600 mb-8">
                Monitor dan verifikasi progres training seluruh karyawan dari halaman ini.
            </p>

            <TrainingOversightClient initialPlans={plans} />
        </div>
    );
}
