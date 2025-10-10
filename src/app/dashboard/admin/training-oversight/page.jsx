import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';
import TrainingOversightClient from '../../../../components/TrainingOversightClient';

async function getOversightData() {
    const supabase = createClient(cookies());
    
    // --- PERBAIKAN QUERY: Sertakan pengambilan data 'training_progress_updates' ---
    const { data: plans, error } = await supabase
        .from('karyawan_training_plan')
        .select(`
            *,
            karyawan (
                nama,
                posisi
            ),
            training_programs (
                *
            ),
            training_progress_updates (
                *,
                created_at
            )
        `)
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