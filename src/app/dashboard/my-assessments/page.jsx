import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import MyAssessmentsClient from '../../../components/MyAssessmentsClient';

async function getMyAssessmentTasks() {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: karyawan } = await supabase.from('karyawan').select('id').eq('email', user.email).single();
    if (!karyawan) return [];

    // --- PERBAIKAN: Hanya tampilkan tugas dari periode yang 'Open' ---
    const { data: tasks, error } = await supabase
        .from('behavioral_assessors')
        .select(`
            id,
            assessor_type,
            employee_to_assess:karyawan!employee_id ( nama, posisi ),
            period:assessment_periods!inner ( nama_periode, status ),
            behavioral_results ( id )
        `)
        .eq('assessor_id', karyawan.id)
        .eq('period.status', 'Open'); // <-- Filter Kunci

    if (error) {
        console.error("Error fetching assessment tasks:", error);
        return [];
    }
    return tasks;
}

export default async function MyAssessmentsPage() {
    const tasks = await getMyAssessmentTasks();
    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Tugas Penilaian Behavioral</h1>
            <p className="text-gray-600 mb-8">Berikut adalah daftar penilaian yang perlu Anda selesaikan.</p>
            <MyAssessmentsClient tasks={tasks} />
        </div>
    );
}