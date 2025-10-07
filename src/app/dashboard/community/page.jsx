import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import CommunityClient from '../../../components/CommunityClient';
import { redirect } from 'next/navigation';

// Fungsi ini mengambil semua data untuk halaman komunitas dalam satu panggilan
async function getCommunityData() {
    const supabase = createClient(cookies());
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: 'Not authenticated' };

    // Gunakan Promise.all untuk mengambil semua data secara paralel
    const [
        profileResult,
        directoryResult,
        leaderboardResult,
        badgesResult
    ] = await Promise.all([
        // 1. Data untuk Tab Profil Pribadi
        supabase.from('karyawan').select('id, nama, posisi, xp, level').eq('email', authUser.email).single(),
        // 2. Data untuk Tab Direktori
        supabase.from('karyawan').select(`id, nama, posisi, karyawan_training_plan (*, training_programs(nama_program), training_progress_updates(*, created_at))`).order('nama', { ascending: true }),
        // 3. Data untuk Tab Leaderboard
        supabase.from('karyawan').select('id, nama, posisi, xp, level').order('xp', { ascending: false }),
        // 4. Data Lencana (Badges)
        supabase.from('badges').select('*')
    ]);

    if (profileResult.error) return { error: 'Gagal memuat profil pengguna.' };
    
    // Ambil lencana yang sudah didapat user
    const { data: earnedBadgesData } = await supabase.from('karyawan_badges').select('badge_id').eq('karyawan_id', profileResult.data.id);
    const earnedBadgeIds = earnedBadgesData?.map(b => b.badge_id) || [];

    return {
        userData: profileResult.data,
        earnedBadgeIds,
        allBadges: badgesResult.data || [],
        directoryData: directoryResult.data || [],
        leaderboardData: leaderboardResult.data || [],
        error: null
    };
}

export default async function CommunityPage() {
    const { error, ...data } = await getCommunityData();

    if (error) {
        console.error("Community Page Error:", error);
        redirect('/login');
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Community & Achievement</h1>
            <p className="text-gray-600 mb-8">
                Lihat pencapaian Anda, jelajahi progres rekan kerja, dan lihat peringkat di leaderboard.
            </p>
            
            {/* Kirim semua data yang sudah diambil ke Client Component */}
            <CommunityClient {...data} />
        </div>
    );
}