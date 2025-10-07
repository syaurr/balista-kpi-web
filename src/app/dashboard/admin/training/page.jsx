import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';
import TrainingManagementClient from '../../../../components/TrainingManagementClient';

async function getTrainingAdminData() {
    const supabase = createClient(cookies());

    const [trainingsResult, positionsResult, areasResult] = await Promise.all([
        supabase.from('training_programs').select('*, training_area_link(area_name)').order('created_at', { ascending: false }),
        supabase.from('karyawan').select('posisi').order('posisi'),
        // --- AWAL PERBAIKAN: Ambil data dari kolom 'area' ---
        supabase.from('kpi_master').select('area').neq('area', null)
    ]);
    
    const uniquePositions = [...new Map(positionsResult.data.map(item => [item['posisi'], item])).values()];
    // --- PERBAIKAN LANJUTAN: Buat daftar unik dari kolom 'area' ---
    const uniqueAreas = [...new Set(areasResult.data.map(item => item.area))];

    return {
        trainings: trainingsResult.data || [],
        allPositions: uniquePositions || [],
        allAreas: uniqueAreas || []
    };
}


export default async function AdminTrainingPage() {
    const { trainings, allPositions, allAreas } = await getTrainingAdminData();

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Admin: Kelola Program Training</h1>
            <TrainingManagementClient 
                initialTrainings={trainings}
                allPositions={allPositions}
                allAreas={allAreas}
            />
        </div>
    );
}