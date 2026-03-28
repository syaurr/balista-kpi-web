import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import TrainingMarketplaceClient from '../../../components/TrainingMarketplaceClient';

async function getMarketplaceData() {
    // 1. Perbaikan: Await cookies dan createClient
    const cookieStore = await cookies();
    const supabase = await createClient(); 

    // 2. Ambil user dengan aman
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Jika tidak ada user atau error auth, langsung return kosong
    if (authError || !user) {
        console.error("Auth error atau user tidak ditemukan");
        return { trainings: [], allAreas: [] };
    }

    // 3. Ambil profil karyawan
    const { data: karyawan } = await supabase
        .from('karyawan')
        .select('id, posisi')
        .eq('email', user.email)
        .single();
    
    if (!karyawan) {
        console.error("Fetch marketplace error: Karyawan profile not found.");
        return { trainings: [], allAreas: [] };
    }
    const userPosition = karyawan.posisi;

    // 4. Dapatkan daftar ID training yang sudah diambil
    const { data: enrolledPlans } = await supabase
        .from('karyawan_training_plan')
        .select('training_program_id')
        .eq('karyawan_id', karyawan.id)
        .in('status', ['Sedang Berjalan', 'Menunggu Verifikasi', 'Selesai']);

    const enrolledTrainingIds = enrolledPlans?.map(plan => plan.training_program_id) || [];

    // 5. Bangun query training
    let query = supabase
        .from('training_programs')
        .select('*, training_area_link(area_name)')
        .in('status', ['Akan Datang', 'Berlangsung']);

    // Filter posisi
    if (userPosition) {
        query = query.or(`posisi.cs.{"${userPosition}"},posisi.is.null`);
    } else {
        query = query.is('posisi', null);
    }
    
    // Eksklusi yang sudah terdaftar (PENTING: Hanya jalankan filter 'not' jika array tidak kosong)
    if (enrolledTrainingIds.length > 0) {
        query = query.not('id', 'in', `(${enrolledTrainingIds.join(',')})`);
    }
    
    const { data: trainings, error: trainingError } = await query.order('created_at', { ascending: false });

    if (trainingError) console.error("Fetch training error:", trainingError);
    
    // 6. Ambil area dari kpi_master
    const { data: areasData } = await supabase.from('kpi_master').select('area').neq('area', null);
    const allAreas = [...new Set(areasData?.map(item => item.area) || [])];

    return {
        trainings: trainings || [],
        allAreas: allAreas || []
    };
}

export default async function TrainingMarketplacePage() {
    // Panggil fungsi data
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