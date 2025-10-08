import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import TrainingMarketplaceClient from '../../../components/TrainingMarketplaceClient';

async function getMarketplaceData() {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { trainings: [], allAreas: [] };

    console.log("\n--- DEBUG: GETMARKETPLACEDATA ---");

    // 1. Ambil data posisi dari user yang sedang login
    const { data: karyawan } = await supabase
        .from('karyawan')
        .select('posisi')
        .eq('email', user.email)
        .single();
    
    const userPosition = karyawan?.posisi;
    // --- ALAT PELACAK 1 ---
    console.log(`Posisi user yang terdeteksi: '${userPosition}'`);

    // 2. Bangun query dasar
    let query = supabase
        .from('training_programs')
        .select('*, training_area_link(area_name)')
        .in('status', ['Akan Datang', 'Berlangsung']);

    // 3. Tambahkan filter berdasarkan posisi user
    if (userPosition) {
        const filterString = `posisi.cs.{"${userPosition}"},posisi.is.null`;
        // --- ALAT PELACAK 2 ---
        console.log(`Filter yang akan dijalankan: .or("${filterString}")`);
        query = query.or(filterString);
    } else {
        console.log("Filter yang akan dijalankan: .is('posisi', null)");
        query = query.is('posisi', null);
    }
    
    const { data: trainings, error } = await query.order('created_at', { ascending: false });
    
    // --- ALAT PELACAK 3 ---
    console.log(`Hasil: Ditemukan ${trainings ? trainings.length : 0} training setelah difilter.`);
    console.log("---------------------------------\n");

    if (error) console.error("Fetch marketplace error:", error);
    
    const { data: areasData } = await supabase.from('kpi_master').select('area').neq('area', null);
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
                Jelajahi katalog training yang tersedia untuk posisi Anda, atau ajukan training eksternal baru.
            </p>
            <TrainingMarketplaceClient trainings={trainings} allAreas={allAreas} />
        </div>
    );
}