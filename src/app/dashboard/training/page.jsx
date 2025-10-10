import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import TrainingMarketplaceClient from '../../../components/TrainingMarketplaceClient';

async function getMarketplaceData() {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { trainings: [], allAreas: [] };

    // 1. Ambil profil karyawan untuk mendapatkan ID dan Posisi
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

    // --- AWAL PERBAIKAN LOGIKA ---
    // 2. Dapatkan daftar ID dari training yang sudah AKTIF diikuti atau SELESAI
    const { data: enrolledPlans } = await supabase
        .from('karyawan_training_plan')
        .select('training_program_id')
        .eq('karyawan_id', karyawan.id)
        // Hanya kecualikan yang sudah benar-benar diambil
        .in('status', ['Sedang Berjalan', 'Menunggu Verifikasi', 'Selesai']);

    const enrolledTrainingIds = enrolledPlans?.map(plan => plan.training_program_id) || [];
    // --- AKHIR PERBAIKAN LOGIKA ---

    // 3. Bangun query dasar untuk mengambil training yang aktif
    let query = supabase
        .from('training_programs')
        .select('*, training_area_link(area_name)')
        .in('status', ['Akan Datang', 'Berlangsung']);

    // 4. Tambahkan filter berdasarkan posisi user
    if (userPosition) {
        query = query.or(`posisi.cs.{"${userPosition}"},posisi.is.null`);
    } else {
        query = query.is('posisi', null);
    }
    
    // 5. KECUALIKAN training yang ID-nya sudah ada di daftar 'enrolledTrainingIds'
    if (enrolledTrainingIds.length > 0) {
        query = query.not('id', 'in', `(${enrolledTrainingIds.join(',')})`);
    }
    
    const { data: trainings, error } = await query.order('created_at', { ascending: false });

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