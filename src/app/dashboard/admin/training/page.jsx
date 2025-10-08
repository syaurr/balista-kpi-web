// --- AWAL PERBAIKAN: Perbaiki semua path import ---
import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';
import TrainingManagementClient from '../../../../components/TrainingManagementClient';
// --- AKHIR PERBAIKAN ---

async function getTrainingAdminData() {
    const supabase = createClient(cookies());

    const [trainingsResult, positionsResult, areasResult] = await Promise.all([
        // Ambil data training beserta link areanya
        supabase.from('training_programs').select('*, training_area_link(area_name)').order('created_at', { ascending: false }),
        supabase.from('karyawan').select('posisi').order('posisi'),
        // Ambil daftar unik area dari master kpi
        supabase.from('kpi_master').select('area').neq('area', null)
    ]);
    
    // Pastikan data tidak null sebelum di-map
    const uniquePositions = positionsResult.data ? [...new Map(positionsResult.data.map(item => [item['posisi'], item])).values()] : [];
    const uniqueAreas = areasResult.data ? [...new Set(areasResult.data.map(item => item.area))] : [];

    return {
        trainings: trainingsResult.data || [],
        allPositions: uniquePositions,
        allAreas: uniqueAreas
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