import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import LearningPlanClient from '../../../components/LearningPlanClient';

async function getLearningPlanData(periode) {
    const supabase = createClient(cookies());
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return []; // Selalu kembalikan array

    const { data: karyawan } = await supabase
        .from('karyawan')
        .select('id')
        .eq('email', authUser.email)
        .single();

    if (!karyawan) {
        console.error(`Gagal menemukan profil karyawan untuk email: ${authUser.email}`);
        return []; // Selalu kembalikan array
    }
    
    const { data: plans, error } = await supabase
        .from('karyawan_training_plan')
        .select(`*, training_programs (*), training_progress_updates (*, created_at)`)
        .eq('karyawan_id', karyawan.id)
        .eq('periode', periode)
        .not('status', 'in', '("Selesai", "Kedaluwarsa", "Ditolak")') 
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching learning plan:", error.message || error);
        return []; // Selalu kembalikan array
    }
    
    return plans || []; // <-- PERBAIKAN: Jika 'plans' null, kembalikan array kosong
}

export default async function LearningPlanPage({ searchParams }) {
    const month = searchParams.bulan || (new Date().getMonth() + 1).toString();
    const year = searchParams.tahun || new Date().getFullYear().toString();
    const periode = `${new Date(0, parseInt(month, 10) - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;

    const plans = await getLearningPlanData(periode);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
               <h1 className="text-3xl font-bold text-[#022020] mb-6">Learning & Development Plan</h1>
            </div>
            <p className="text-gray-600 mb-8">
                Lihat training yang direkomendasikan untuk Anda dan laporkan progres Anda di sini.
            </p>
            
            <LearningPlanClient 
                initialPlans={plans}
                initialMonth={month}
                initialYear={year}
            />
        </div>
    );
}