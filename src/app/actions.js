'use server';

import { createClient } from '../utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

// --- AWAL PERBAIKAN UTAMA DI SINI ---
export async function addTrainingProgram(formData) {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Anda harus login.' };

    const { data: karyawan } = await supabase.from('karyawan').select('role').eq('email', user.email).single();
    const role = karyawan?.role === 'Admin' ? 'Admin' : 'User';

    const programData = {
        nama_program: formData.get('nama_program'),
        penyedia: formData.get('penyedia'),
        topik_utama: formData.get('topik_utama'),
        link_akses: formData.get('link_akses'),
        biaya: formData.get('biaya'),
        status: formData.get('status'),
        tanggal_mulai: formData.get('tanggal_mulai') || null,
        tanggal_berakhir: formData.get('tanggal_berakhir') || null,
        posisi: formData.getAll('posisi'),
        created_by_role: role
    };

    // 1. Simpan data utama ke tabel training_programs dan dapatkan ID-nya
    const { data: newProgram, error: programError } = await supabase
        .from('training_programs')
        .insert(programData)
        .select('id')
        .single();

    if (programError) {
        console.error(programError);
        return { error: 'Gagal menambah program.' };
    }

    // 2. Ambil ID KPI yang dipilih dari form
    const selectedKpiIds = formData.getAll('kpi_ids');

    // 3. Jika ada KPI yang dipilih, simpan hubungannya ke tabel link
    if (selectedKpiIds && selectedKpiIds.length > 0) {
        const linksToInsert = selectedKpiIds.map(kpiId => ({
            training_program_id: newProgram.id,
            kpi_master_id: kpiId
        }));

        const { error: linkError } = await supabase.from('training_kpi_link').insert(linksToInsert);
        if (linkError) {
            console.error(linkError);
            return { error: 'Gagal menyimpan hubungan KPI.' };
        }
    }

    revalidatePath('/dashboard/training');
    revalidatePath('/dashboard/admin/training');
    return { success: 'Program baru berhasil ditambahkan!' };
}


export async function updateTrainingProgram(formData) {
    const supabase = createClient(cookies());
    const id = formData.get('id');
    const updatedData = {
        nama_program: formData.get('nama_program'),
        penyedia: formData.get('penyedia'),
        topik_utama: formData.get('topik_utama'),
        link_akses: formData.get('link_akses'),
        biaya: formData.get('biaya'),
        status: formData.get('status'),
        tanggal_mulai: formData.get('tanggal_mulai') || null,
        tanggal_berakhir: formData.get('tanggal_berakhir') || null,
        posisi: formData.getAll('posisi')
    };
    const { error } = await supabase.from('training_programs').update(updatedData).eq('id', id);
    if (error) { console.error(error); return { error: 'Gagal memperbarui program.' }; }
    revalidatePath('/dashboard/admin/training');
}

export async function deleteTrainingProgram(formData) {
    const supabase = createClient(cookies());
    const id = formData.get('id');
    const { error } = await supabase.from('training_programs').delete().eq('id', id);
    if (error) {
        console.error('Supabase delete error:', error);
        return { error: `Gagal menghapus program: ${error.message}` };
    }
    revalidatePath('/dashboard/admin/training');
    return { success: true };
}

export async function importFromExcel(formData) {
    const file = formData.get('excelFile');
    if (!file || file.size === 0) {
        return { error: 'File tidak ditemukan.' };
    }
    try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        if (data.length === 0) {
            return { error: 'File Excel kosong atau formatnya salah.' };
        }

        const supabase = createClient(cookies());
        
        const programsToInsert = data.map(row => {
            const parseDate = (dateValue) => {
                if (!dateValue) return null;
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) return null;
                return date.toISOString();
            };
            return {
                nama_program: row['Nama Program'],
                penyedia: row['Penyedia'],
                topik_utama: row['Topik Utama'],
                link_akses: row['Link Akses/Informasi Program'],
                biaya: row['Biaya'],
                status: row['Status'],
                tanggal_mulai: parseDate(row['Tanggal Mulai']),
                tanggal_berakhir: parseDate(row['Tanggal Berakhir']),
                posisi: row['Posisi'] ? row['Posisi'].split(',').map(p => p.trim()) : null,
                created_by_role: 'Admin'
            };
        });

        const { error } = await supabase.from('training_programs').insert(programsToInsert);
        if (error) {
            console.error('Supabase import error:', error);
            return { error: `Gagal mengimpor data: ${error.message}` };
        }
        
        revalidatePath('/dashboard/admin/training');
        return { success: `${data.length} data berhasil diimpor!` };

    } catch (e) {
        console.error('Import processing error:', e);
        return { error: `Terjadi kesalahan saat memproses file: ${e.message}` };
    }
}

export async function fetchKpiDetailsForArea(karyawanId, periode, areaName) {
    const supabase = createClient();
    if (!karyawanId || !periode || !areaName) {
        return { data: [], error: 'Parameter tidak lengkap.' };
    }
    try {
        const { data, error } = await supabase
            .from('penilaian_kpi')
            .select(`
                skor_aktual:nilai, 
                kpi_master!inner(kpi_deskripsi, area)
            `)
            .eq('karyawan_id', karyawanId)
            .eq('periode', periode)
            .eq('kpi_master.area', areaName);

        if (error) throw error;

        const finalData = data.map(item => ({
            kpi_deskripsi: item.kpi_master.kpi_deskripsi,
            skor_aktual: item.skor_aktual
        }));
        return { data: finalData, error: null };
    } catch (error) {
        console.error("Error di fetchKpiDetailsForArea:", error.message);
        return { data: [], error: 'Gagal mengambil detail KPI.' };
    }
}

export async function fetchAreaNote(karyawanId, periode, areaName) {
    const supabase = createClient();
    if (!karyawanId || !periode || !areaName) {
        return { note: '', error: 'Parameter tidak lengkap.' };
    }
    try {
        const { data, error } = await supabase.from('area_summary_notes')
            .select('catatan')
            .eq('karyawan_id', karyawanId)
            .eq('periode', periode)
            .eq('area_name', areaName)
            .single();
        if (error && error.code !== 'PGRST116') throw error;
        return { note: data?.catatan || '', error: null };
    } catch (error) {
        console.error("Error di fetchAreaNote:", error.message);
        return { note: '', error: 'Gagal mengambil catatan area.' };
    }
}

export async function saveAreaNote(karyawanId, periode, areaName, noteText) {
    const supabase = createClient();
    if (!karyawanId || !periode || !areaName) {
        return { success: null, error: 'Data tidak lengkap.' };
    }
    try {
        const { error } = await supabase.from('area_summary_notes')
            .upsert(
                { karyawan_id: karyawanId, periode, area_name: areaName, catatan: noteText },
                { onConflict: 'karyawan_id, periode, area_name' }
            );
        if (error) throw error;
        revalidatePath('/dashboard/admin/assessment');
        return { success: 'Catatan berhasil disimpan!', error: null };
    } catch (error) {
        console.error("Error di saveAreaNote:", error.message);
        return { success: null, error: 'Gagal menyimpan catatan.' };
    }
}

export async function addOrUpdateKpi(formData) {
    const supabase = createClient(cookies());
    const id = formData.get('id');
    const linksString = formData.get('referensi_links');

    const kpiData = {
        kpi_deskripsi: formData.get('kpi_deskripsi'),
        area_kerja: formData.get('area_kerja'),
        area: formData.get('area'),
        posisi: formData.get('posisi'),
        frekuensi: formData.get('frekuensi'),
        bobot: parseInt(formData.get('bobot'), 10),
        target_standar: formData.get('target_standar'),
    };

    let kpiId = id;
    let error;

    if (id) {
        // --- PROSES UPDATE ---
        const { error: updateError } = await supabase.from('kpi_master').update(kpiData).eq('id', id);
        error = updateError;
    } else {
        // --- PROSES INSERT ---
        const { data: newKpi, error: insertError } = await supabase.from('kpi_master').insert(kpiData).select('id').single();
        error = insertError;
        if (newKpi) {
            kpiId = newKpi.id;
        }
    }

    if (error) {
        console.error('KPI save error:', error);
        return { error: 'Gagal menyimpan data KPI utama.' };
    }
    
    // --- PROSES UPDATE LINK DI TABEL kpi_links ---
    if (kpiId) {
        const { error: deleteError } = await supabase.from('kpi_links').delete().eq('kpi_master_id', kpiId);
        if (deleteError) {
            console.error('KPI link delete error:', deleteError);
            return { error: 'Gagal menghapus link lama.' };
        }
        
        if (linksString) {
            const linksArray = linksString.split('\n')
                .map(link => link.trim())
                .filter(link => link.length > 0)
                // --- AWAL PERBAIKAN: Hapus kolom 'deskripsi' ---
                .map(link => ({
                    kpi_master_id: kpiId,
                    link_url: link
                }));
            // --- AKHIR PERBAIKAN ---
            
            if (linksArray.length > 0) {
                const { error: insertLinksError } = await supabase.from('kpi_links').insert(linksArray);
                if (insertLinksError) {
                    console.error('KPI link insert error:', insertLinksError);
                    return { error: 'Gagal menyimpan link baru.' };
                }
            }
        }
    }

    revalidatePath('/dashboard/admin/kpi-management');
    return { success: 'Data KPI dan link berhasil disimpan!' };
}

export async function deactivateKpi(formData) {
    const supabase = createClient(cookies());
    const id = formData.get('id');
    const { error } = await supabase.from('kpi_master').update({ is_active: false }).eq('id', id);
    if (error) {
        console.error('KPI deactivate error:', error);
        return { error: 'Gagal menonaktifkan KPI.' };
    }
    revalidatePath('/dashboard/admin/kpi-management');
    return { success: 'KPI berhasil dinonaktifkan.' };
}

export async function getAssessmentDataLogic(supabase, karyawanId, periode) {
    if (!karyawanId || !periode) {
        return { kpis: [], scores: {}, generalNote: '', recommendations: [], areaScores: [] };
    }
    const { data: karyawan } = await supabase.from('karyawan').select('posisi').eq('id', karyawanId).single();
    if (!karyawan) {
        return { kpis: [], scores: {}, generalNote: '', recommendations: [], areaScores: [] };
    }
    
    // Kita kembali gunakan RPC yang sudah terbukti benar untuk chart
    const [kpisResult, scoresResult, summaryResult, recommendationsResult, areaScoresResult] = await Promise.all([
        supabase.from('kpi_master').select('*, kpi_links(id, link_url)').eq('posisi', karyawan.posisi).eq('is_active', true).order('area_kerja'),
        supabase.from('penilaian_kpi').select('kpi_master_id, nilai').eq('karyawan_id', karyawanId).eq('periode', periode),
        supabase.from('penilaian_summary').select('catatan_kpi').eq('karyawan_id', karyawanId).eq('periode', periode).single(),
        supabase.from('kpi_summary_recommendations').select('id, rekomendasi_text').eq('karyawan_id', karyawanId).eq('periode', periode),
        supabase.rpc('get_average_scores_by_area', { p_karyawan_id: karyawanId }) 
    ]);

    const scoresMap = scoresResult.data?.reduce((acc, score) => {
        acc[score.kpi_master_id] = score.nilai;
        return acc;
    }, {}) || {};
    
    const finalResult = {
        kpis: kpisResult.data || [],
        scores: scoresMap,
        generalNote: summaryResult.data?.catatan_kpi || '',
        recommendations: recommendationsResult.data || [],
        areaScores: areaScoresResult.data || []
    };
    return finalResult;
}

export async function fetchAssessmentData(karyawanId, periode) {
    if (!karyawanId || !periode) return { kpis: [], scores: {}, generalNote: '', recommendations: [], areaScores: [] };
    const supabase = createClient();

    const { data: karyawan } = await supabase.from('karyawan').select('posisi').eq('id', karyawanId).single();
    if (!karyawan) return { kpis: [], scores: {}, generalNote: '', recommendations: [], areaScores: [] };

    const [kpisResult, scoresResult, summaryResult, recommendationsResult, areaScoresResult] = await Promise.all([
        supabase.from('kpi_master').select('*, kpi_links(id, link_url)').eq('posisi', karyawan.posisi).eq('is_active', true).order('area_kerja'),
        supabase.from('penilaian_kpi').select('kpi_master_id, nilai').eq('karyawan_id', karyawanId).eq('periode', periode),
        supabase.from('penilaian_summary').select('catatan_kpi').eq('karyawan_id', karyawanId).eq('periode', periode).single(),
        supabase.from('kpi_summary_recommendations').select('id, rekomendasi_text').eq('karyawan_id', karyawanId).eq('periode', periode),
        supabase.rpc('get_average_scores_by_area', { p_karyawan_id: karyawanId })
    ]);
    
    if (kpisResult.error) console.error("KPI Fetch Error:", kpisResult.error);

    const scoresMap = scoresResult.data?.reduce((acc, score) => {
        acc[score.kpi_master_id] = score.nilai;
        return acc;
    }, {}) || {};

    return {
        kpis: kpisResult.data || [],
        scores: scoresMap,
        generalNote: summaryResult.data?.catatan_kpi || '',
        recommendations: recommendationsResult.data || [],
        areaScores: areaScoresResult.data || []
    };
}

export async function getDashboardData() {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'User not authenticated' };
  const { data: karyawan, error: userError } = await supabase.from('karyawan').select('id, nama, posisi, role').eq('email', user.email).single();
  if (userError) return { error: 'Failed to fetch user profile.' };
  const karyawanId = karyawan.id;
  const posisi = karyawan.posisi;
  const [rekapResult, areaScoresResult, summaryResult] = await Promise.all([
    supabase.rpc('get_rekap_kpi_data', { p_karyawan_id: karyawanId, p_posisi: posisi }),
    supabase.rpc('get_average_scores_by_area', { p_karyawan_id: karyawanId }),
    supabase.from('penilaian_summary').select('catatan_kpi').eq('karyawan_id', karyawanId).order('created_at', { ascending: false }).limit(1).single()
  ]);
  return {
    user: karyawan,
    data: {
      rekap: rekapResult.data || [],
      areaScores: areaScoresResult.data || [],
      summary: summaryResult.data || { catatan_kpi: 'Belum ada catatan umum.' },
    },
  };
}

export async function saveFullAssessment(formData) {
    const supabase = createClient();
    const karyawanId = formData.get('karyawanId');
    const periode = formData.get('periode');
    const scoresData = JSON.parse(formData.get('scores'));
    const generalNote = formData.get('generalNote');

    if (!karyawanId || !periode) return { error: 'Data tidak lengkap.' };

    const { data: kpis } = await supabase.from('kpi_master').select('id, kpi_deskripsi, bobot').in('id', Object.keys(scoresData));
    if (!kpis) return { error: 'Gagal mengambil data master KPI untuk snapshot.' };

    const assessmentsToUpsert = kpis.map(kpi => ({
        karyawan_id: karyawanId, kpi_master_id: kpi.id, periode: periode, nilai: scoresData[kpi.id],
        tanggal_penilaian: new Date().toISOString(), kpi_deskripsi: kpi.kpi_deskripsi, bobot: kpi.bobot
    }));
    const summaryToUpsert = { karyawan_id: karyawanId, periode: periode, catatan_kpi: generalNote };

    const [assessmentResult, summaryResult] = await Promise.all([
        supabase.from('penilaian_kpi').upsert(assessmentsToUpsert, { onConflict: 'karyawan_id, kpi_master_id, periode' }),
        supabase.from('penilaian_summary').upsert(summaryToUpsert, { onConflict: 'karyawan_id, periode' })
    ]);
    
    if (assessmentResult.error || summaryResult.error) return { error: 'Gagal menyimpan penilaian.' };
    
    revalidatePath('/dashboard/admin/assessment');
    return { success: 'Penilaian berhasil disimpan!' };
}

export async function addRecommendation(karyawanId, periode, text) {
    const supabase = createClient();
    const { error } = await supabase.from('kpi_summary_recommendations').insert({ karyawan_id: karyawanId, periode: periode, rekomendasi_text: text });
    if (error) return { error: 'Gagal menambah rekomendasi.' };
    revalidatePath('/dashboard/admin/assessment');
}

export async function updateRecommendation(formData) {
    const supabase = createClient();
    const id = formData.get('id');
    const newText = formData.get('rekomendasi_text');

    if (!id || !newText) return { error: 'Data tidak lengkap.' };

    const { error } = await supabase
        .from('kpi_summary_recommendations')
        .update({ rekomendasi_text: newText })
        .eq('id', id);

    if (error) {
        console.error('Update recommendation error:', error);
        return { error: 'Gagal memperbarui rekomendasi.' };
    }
    revalidatePath('/dashboard/admin/assessment');
    return { success: 'Rekomendasi berhasil diperbarui.' };
}

export async function deleteRecommendation(formData) {
    const supabase = createClient();
    const id = formData.get('id');

    if (!id) return { error: 'ID tidak ditemukan.' };

    const { error } = await supabase
        .from('kpi_summary_recommendations')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Delete recommendation error:', error);
        return { error: 'Gagal menghapus rekomendasi.' };
    }
    revalidatePath('/dashboard/admin/assessment');
    return { success: 'Rekomendasi berhasil dihapus.' };
}

export async function getDashboardPageData(periode) {
  const supabase = createClient(cookies()); // Selalu gunakan cookies() di server component/action
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, data: null, error: 'User not authenticated' };

  const { data: karyawan, error: userError } = await supabase
    .from('karyawan').select('id, nama, posisi, role').eq('email', user.email).single();
  if (userError) return { user, data: null, error: 'Failed to fetch user profile.' };

  const karyawanId = karyawan.id;
  const posisi = karyawan.posisi;

  const [rekapResult, areaScoresResult, recommendationsResult, summaryResult] = await Promise.all([
    supabase.rpc('get_rekap_kpi_data', { p_karyawan_id: karyawanId, p_posisi: posisi, p_periode: periode }),
    supabase.rpc('get_average_scores_by_area', { p_karyawan_id: karyawanId, p_periode: periode }),
    supabase.from('kpi_summary_recommendations').select('rekomendasi_text').eq('karyawan_id', karyawanId).eq('periode', periode),
    supabase.from('penilaian_summary').select('catatan_kpi').eq('karyawan_id', karyawanId).eq('periode', periode).single()
  ]);

  return {
    user: karyawan,
    data: {
      rekap: rekapResult.data || [],
      areaScores: areaScoresResult.data || [],
      recommendations: recommendationsResult.data || [],
      summary: summaryResult.data || { catatan_kpi: `Belum ada catatan umum untuk periode ${periode}.` },
    },
    error: null,
  };
}
