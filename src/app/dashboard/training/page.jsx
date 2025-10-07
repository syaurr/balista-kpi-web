import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import TrainingMarketplaceClient from '../../../components/TrainingMarketplaceClient';

async function getMarketplaceData() {
    const supabase = createClient(cookies());

    // Ambil semua training yang aktif dan sudah disetujui untuk ditampilkan di katalog
    const { data: trainings, error } = await supabase
        .from('training_programs')
        .select('*, training_area_link(area_name)')
        .in('status', ['Akan Datang', 'Berlangsung'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch marketplace error:", error);
    }
    
    // Ambil daftar unik "Area" untuk form usulan
    const { data: areasData } = await supabase
        .from('kpi_master')
        .select('area')
        .neq('area', null);
        
    const allAreas = [...new Set(areasData?.map(item => item.area) || [])];

    return {
        trainings: trainings || [],
        allAreas: allAreas || []
    };
}

export default async function TrainingMarketplacePage() {
    const { trainings, allAreas } = await getMarketplaceData();

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Training Marketplace</h1>
            <p className="text-gray-600 mb-8">
                Jelajahi katalog training yang tersedia, atau ajukan training eksternal baru.
            </p>
            <TrainingMarketplaceClient trainings={trainings} allAreas={allAreas} />
        </div>
    );
}