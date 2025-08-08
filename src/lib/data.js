import { createClient } from '../utils/supabase/server';

export async function getDashboardData() {
  const supabase = createClient(); // Panggil tanpa argumen
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, data: null, error: 'User not authenticated' };

  const { data: karyawan, error: userError } = await supabase
    .from('karyawan').select('id, nama, posisi, role').eq('email', user.email).single();
  if (userError) return { user, data: null, error: 'Failed to fetch user profile.' };

  const karyawanId = karyawan.id;
  const posisi = karyawan.posisi;
  const periodeTahun = new Date().getFullYear().toString();
  const periodeBulan = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date()) + " " + periodeTahun;

  const [rekapResult, areaScoresResult, recommendationsResult, summaryResult] = await Promise.all([
    supabase.rpc('get_rekap_kpi_data', { p_karyawan_id: karyawanId, p_posisi: posisi }),
    supabase.rpc('get_average_scores_by_area', { p_karyawan_id: karyawanId }),
    supabase.from('kpi_summary_recommendations').select('rekomendasi_text').eq('karyawan_id', karyawanId).eq('periode', periodeTahun),
    supabase.from('penilaian_summary').select('catatan_kpi').eq('karyawan_id', karyawanId).eq('periode', periodeBulan).single()
  ]);

  return {
    user: karyawan,
    data: {
      rekap: rekapResult.data || [],
      areaScores: areaScoresResult.data || [],
      recommendations: recommendationsResult.data || [],
      summary: summaryResult.data || { catatan_kpi: 'Belum ada catatan umum untuk periode ini.' },
    },
    error: null,
  };
}