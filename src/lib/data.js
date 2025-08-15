import { createClient } from '../utils/supabase/server';

export async function getDashboardData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, data: null, error: 'User not authenticated' };

  const { data: karyawan, error: userError } = await supabase
    .from('karyawan').select('id, nama, posisi, role').eq('email', user.email).single();
  if (userError) return { user, data: null, error: 'Failed to fetch user profile.' };

  const karyawanId = karyawan.id;
  const posisi = karyawan.posisi;

  // --- AWAL LOGIKA PENGAMBILAN DATA GABUNGAN YANG BENAR ---
  
  // 1. Ambil SEMUA data rekap KPI, tidak peduli periode
  const { data: rekapData } = await supabase.rpc('get_rekap_kpi_data', {
    p_karyawan_id: karyawanId,
    p_posisi: posisi
  });

  // 2. Ambil SEMUA skor area, tidak peduli periode
  const { data: areaScores } = await supabase.rpc('get_average_scores_by_area', {
    p_karyawan_id: karyawanId
  });

  // 3. Ambil rekomendasi TERBARU berdasarkan tanggal pembuatan
  const { data: recommendations } = await supabase
    .from('kpi_summary_recommendations')
    .select('rekomendasi_text')
    .eq('karyawan_id', karyawanId)
    .order('created_at', { ascending: false }); // Urutkan dari yang paling baru

  // 4. Ambil catatan summary TERBARU berdasarkan tanggal pembuatan
  const { data: summary } = await supabase
    .from('penilaian_summary')
    .select('catatan_kpi')
    .eq('karyawan_id', karyawanId)
    .order('created_at', { ascending: false })
    .limit(1) // Ambil hanya 1 yang paling baru
    .single();

  // --- AKHIR LOGIKA PENGAMBILAN DATA GABUNGAN YANG BENAR ---

  return {
    user: karyawan,
    data: {
      rekap: rekapData || [],
      areaScores: areaScores || [],
      recommendations: recommendations || [],
      summary: summary || { catatan_kpi: 'Belum ada catatan umum yang ditemukan.' },
    },
    error: null,
  };
}