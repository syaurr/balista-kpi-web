'use server';
'use server';
import { cookies } from 'next/headers';
// --- AWAL PERBAIKAN: Perbaiki path import ---
import { createClient } from '../utils/supabase/server';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';
// --- AWAL PERBAIKAN: Import library standar Supabase untuk admin client ---
import { createClient as createAdminClient } from '@supabase/supabase-js';
// --- AKHIR PERBAIKAN ---


export async function getDashboardPageData(periode) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, data: null, error: 'User not authenticated' };

  const { data: karyawan } = await supabase.from('karyawan').select('id, nama, posisi, role, tipe_akun').eq('email', user.email).single();
  if (!karyawan) return { user: null, data: null, error: 'Failed to fetch user profile.' };

  const karyawanId = karyawan.id;
  const { data: currentPeriod } = await supabase.from('assessment_periods').select('id').eq('nama_periode', periode).single();
  const periodId = currentPeriod?.id;

  const [
    rekapResult, areaScoresResult, recommendationsResult, summaryResult,
    recommendedTrainingsResult, pendingTasksResult, behavioralScoresResult,
    kpiHistoryResult, 
    rawDetailScoresResult // <--- 1. Query Transparansi
  ] = await Promise.all([
    supabase.rpc('get_rekap_kpi_data', { p_karyawan_id: karyawanId, p_posisi: karyawan.posisi, p_periode: periode }),
    supabase.rpc('get_average_scores_by_area', { p_karyawan_id: karyawanId, p_periode: periode }),
    supabase.from('kpi_summary_recommendations').select('rekomendasi_text').eq('karyawan_id', karyawanId).eq('periode', periode),
    supabase.from('penilaian_summary').select('catatan_kpi').eq('karyawan_id', karyawanId).eq('periode', periode),
    supabase.from('karyawan_training_plan').select('id, training_programs(*, training_area_link(area_name))').eq('karyawan_id', karyawanId).eq('periode', periode).eq('status', 'Disarankan'),
    supabase.from('behavioral_assessors').select('id, behavioral_results(id), period:assessment_periods!inner(status)').eq('assessor_id', karyawanId).eq('period.status', 'Open'),
    periodId ? supabase.rpc('calculate_behavioral_score', { p_employee_id: karyawanId, p_period_id: periodId }) : Promise.resolve({ data: [] }),
    supabase.rpc('get_kpi_score_history', { p_karyawan_id: karyawanId }),
    
    // <--- 2. Ambil detail nilai per penilai
    supabase.from('penilaian_kpi').select('kpi_master_id, kpi_deskripsi, bobot, nilai, penilai:karyawan!penilai_id(nama)').eq('karyawan_id', karyawanId).eq('periode', periode)
  ]);

  const pendingTaskCount = pendingTasksResult.data?.filter(task => task.behavioral_results.length === 0).length || 0;
  const combinedSummary = summaryResult.data?.map(s => s.catatan_kpi).filter(Boolean).join('\n\n---\n\n') || `Belum ada catatan umum untuk periode ${periode}.`;

  // <--- 3. LOGIKA MERAKIT DATA TRANSPARANSI --->
  const detailMap = {};
  rawDetailScoresResult.data?.forEach(item => {
      if (!detailMap[item.kpi_master_id]) {
          detailMap[item.kpi_master_id] = {
              deskripsi: item.kpi_deskripsi,
              bobot: item.bobot,
              penilai1_nama: item.penilai?.nama || 'Anonim',
              penilai1_nilai: item.nilai,
              penilai2_nama: null,
              penilai2_nilai: null
          };
      } else {
          detailMap[item.kpi_master_id].penilai2_nama = item.penilai?.nama || 'Anonim';
          detailMap[item.kpi_master_id].penilai2_nilai = item.nilai;
      }
  });

  const transparencyData = Object.values(detailMap).map(kpi => {
      let rataRata = kpi.penilai1_nilai;
      if (kpi.penilai2_nilai !== null) {
          rataRata = (kpi.penilai1_nilai + kpi.penilai2_nilai) / 2;
      }
      return { 
          ...kpi, 
          rata_rata: rataRata, 
          nilai_akhir: rataRata * (kpi.bobot / 100) // Detail perhitungan di belakang layar
      };
  });

  return {
    user: karyawan,
    data: {
      rekap: rekapResult.data || [],
      areaScores: areaScoresResult.data || [],
      recommendations: recommendationsResult.data || [],
      summary: { catatan_kpi: combinedSummary },
      recommendedTrainings: recommendedTrainingsResult.data || [],
      pendingTaskCount: pendingTaskCount,
      behavioralScores: behavioralScoresResult.data || [],
      kpiHistory: kpiHistoryResult.data || [],
      transparencyData: transparencyData // <--- 4. Kirim ke Frontend
    },
    error: null,
  };
}
export async function enrollInTraining(trainingId, periode) { // <-- Terima 'periode' sebagai parameter
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Anda harus login.' };

    const { data: karyawan } = await supabase.from('karyawan').select('id').eq('email', user.email).single();
    if (!karyawan) return { error: 'Profil karyawan tidak ditemukan.' };

    if (!periode) { // Validasi tambahan
        return { error: 'Periode harus dipilih.' };
    }

    const { error } = await supabase.from('karyawan_training_plan').insert({
        karyawan_id: karyawan.id,
        training_program_id: trainingId,
        periode: periode, // <-- Gunakan 'periode' yang dikirim dari client
        status: 'Sedang Berjalan',
        assigned_by: 'Inisiatif Sendiri'
    });

    if (error) {
        if (error.code === '23505') return { error: 'Anda sudah terdaftar di training ini pada periode yang sama.' };
        return { error: 'Gagal mendaftar training.' };
    }

    revalidatePath('/dashboard/learning-plan');
    revalidatePath('/dashboard/training');
    return { success: 'Berhasil mendaftar training!' };
}


// --- FUNGSI addTrainingProgram YANG SUDAH DI-UPGRADE ---

// Di dalam file: src/app/actions.js

export async function addTrainingProgram(formData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Anda harus login.' };

    const { data: karyawan } = await supabase.from('karyawan').select('id, role, posisi').eq('email', user.email).single();
    if (!karyawan) return { error: 'Profil karyawan tidak ditemukan.' };
    
    const role = karyawan.role;
    const isPaid = formData.get('biaya') === 'Berbayar';
    
    // Status 'Akan Datang' berlaku untuk usulan gratis dari user, atau semua usulan dari admin
    const status = (role === 'User' && isPaid) ? 'Menunggu Persetujuan' : 'Akan Datang';

    const programData = {
        nama_program: formData.get('nama_program'),
        penyedia: formData.get('penyedia'),
        topik_utama: formData.get('topik_utama'),
        link_akses: formData.get('link_akses'),
        status: status,
        biaya: formData.get('biaya'),
        biaya_nominal: isPaid ? parseInt(formData.get('biaya_nominal') || 0, 10) : null,
        created_by_role: role,
        posisi: role === 'User' ? (karyawan.posisi ? [karyawan.posisi] : null) : formData.getAll('posisi') || null,
        tanggal_mulai: formData.get('tanggal_mulai') || null,
        tanggal_berakhir: formData.get('tanggal_berakhir') || null,
    };

    const { data: newProgram, error: programError } = await supabase.from('training_programs').insert(programData).select('id').single();
    if (programError) {
        console.error("Add Program Error:", programError);
        return { error: 'Gagal menambah program.' };
    }
    
    const linked_areas = formData.getAll('linked_areas');
    if (linked_areas && linked_areas.length > 0) {
        const linksToInsert = linked_areas.map(areaName => ({ training_program_id: newProgram.id, area_name: areaName }));
        await supabase.from('training_area_link').insert(linksToInsert);
    }

    // --- PERBAIKAN: HAPUS BLOK PENDAFTARAN OTOMATIS ---
    // if (role === 'User' && !isPaid) { ... } <-- Seluruh blok ini dihapus

    revalidatePath('/dashboard/training');
    revalidatePath('/dashboard/admin/training');
    
    const successMessage = status === 'Menunggu Persetujuun'
        ? 'Usulan training berbayar Anda berhasil dikirim dan menunggu persetujuan Admin!'
        : 'Training baru berhasil ditambahkan ke Marketplace!'; // <-- Pesan sukses diubah
        
    return { success: successMessage, shouldRedirect: false }; // <-- Redirect selalu false
}


export async function updateTrainingProgram(formData) {
    const supabase = await createClient();
    const programId = formData.get('id');
    const linked_areas = formData.getAll('linked_areas');

    // --- PERBAIKAN: Logika biaya yang hilang ---
    const biayaValue = formData.get('biaya');
    const isPaid = biayaValue === 'Berbayar';

    const updatedData = {
        nama_program: formData.get('nama_program'),
        penyedia: formData.get('penyedia'),
        topik_utama: formData.get('topik_utama'),
        link_akses: formData.get('link_akses'),
        status: formData.get('status'),
        biaya: biayaValue,
        biaya_nominal: isPaid ? parseInt(formData.get('biaya_nominal') || 0, 10) : null, // <-- Field yang hilang ditambahkan di sini
        tanggal_mulai: formData.get('tanggal_mulai') || null,
        tanggal_berakhir: formData.get('tanggal_berakhir') || null,
        posisi: formData.getAll('posisi')
    };

    const { error: updateError } = await supabase.from('training_programs').update(updatedData).eq('id', programId);
    if (updateError) {
        console.error('Update training error:', updateError);
        return { error: 'Gagal memperbarui program.' };
    }

    await supabase.from('training_area_link').delete().eq('training_program_id', programId);

    if (linked_areas && linked_areas.length > 0) {
        const linksToInsert = linked_areas.map(areaName => ({ training_program_id: programId, area_name: areaName }));
        const { error: insertError } = await supabase.from('training_area_link').insert(linksToInsert);
        if (insertError) return { error: 'Gagal menyimpan link area baru.' };
    }

    revalidatePath('/dashboard/admin/training');
    return { success: 'Program berhasil diperbarui!' };
}

// --- FUNGSI BARU UNTUK PERSETUJUAN OLEH ADMIN ---

export async function approveTraining(trainingId) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('training_programs')
        .update({ status: 'Akan Datang' })
        .eq('id', trainingId);
    
    if (error) return { error: 'Gagal menyetujui training.' };
    revalidatePath('/dashboard/admin/training');
    return { success: 'Training berhasil disetujui!' };
}

export async function rejectTraining(trainingId) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('training_programs')
        .update({ status: 'Ditolak' })
        .eq('id', trainingId);
        // Alternatif: .delete().eq('id', trainingId) jika ingin dihapus permanen

    if (error) return { error: 'Gagal menolak training.' };
    revalidatePath('/dashboard/admin/training');
    return { success: 'Training berhasil ditolak.' };
}

export async function deleteTrainingProgram(formData) {
    const supabase = await createClient();
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
    const supabase = await createClient();
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

        const supabase = await createClient();
        
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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

// src/app/actions.js

// src/app/actions.js

export async function fetchAssessmentData(karyawanId, periode) {
    const supabase = await createClient();
    if (!karyawanId || !periode) return null;

    // 1. Ambil KTP Penilai yang sedang buka halaman ini
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const cookieStore = await cookies();
    let impersonateEmailRaw = cookieStore.get('impersonate_email')?.value;
    const impersonateEmail = impersonateEmailRaw ? impersonateEmailRaw.replace(/^["'](.*)["']$/, '$1').replace(/^"|"$/g, '').trim() : null;

    const { data: realUser } = await supabase.from('karyawan').select('role').eq('email', authUser.email).single();
    const activeEmail = (realUser?.role === 'Admin' && impersonateEmail) ? impersonateEmail : authUser.email;

    const { data: activePenilai } = await supabase.from('karyawan').select('id').eq('email', activeEmail.toLowerCase().trim()).single();
    if (!activePenilai) return null;

    // 2. Ambil Master KPI
    const { data: targetKaryawan } = await supabase.from('karyawan').select('posisi').eq('id', karyawanId).single();
    if (!targetKaryawan) return null;

    const { data: kpis } = await supabase.from('kpi_master').select('*').eq('posisi', targetKaryawan.posisi).eq('is_active', true).order('area');

    // 3. FILTER "MATA PENUTUP" (Hanya ambil nilainya sendiri, ATAU nilai lama yang penilai_id-nya null)
    const penilaiFilter = `penilai_id.eq.${activePenilai.id},penilai_id.is.null`;

    const [
        scoresResult, 
        summaryResult, 
        recommendationsResult, 
        areaScoresResult, 
        historyResult
    ] = await Promise.all([
        supabase.from('penilaian_kpi').select('kpi_master_id, nilai').eq('karyawan_id', karyawanId).eq('periode', periode).or(penilaiFilter),
        supabase.from('penilaian_summary').select('catatan_kpi').eq('karyawan_id', karyawanId).eq('periode', periode).or(penilaiFilter).limit(1).maybeSingle(),
        
        // --- KUNCI FIX REKOMENDASI: Jangan pakai .or(penilaiFilter) di baris ini! ---
        supabase.from('kpi_summary_recommendations').select('id, rekomendasi_text').eq('karyawan_id', karyawanId).eq('periode', periode),
        // ----------------------------------------------------------------------------
        
        supabase.rpc('get_average_scores_by_area', { p_karyawan_id: karyawanId, p_periode: periode }),
        supabase.rpc('get_kpi_score_history', { p_karyawan_id: karyawanId })
    ]);

    const scoresMap = {};
    scoresResult.data?.forEach(s => { scoresMap[s.kpi_master_id] = s.nilai; });

    const { data: allScoresForGap } = await supabase
        .from('penilaian_kpi')
        .select('kpi_master_id, kpi_deskripsi, nilai, penilai_id')
        .eq('karyawan_id', karyawanId)
        .eq('periode', periode);

    const gapWarnings = [];
    if (allScoresForGap && allScoresForGap.length > 0) {
        // Kelompokkan nilai berdasarkan KPI
        const scoresByKpi = {};
        allScoresForGap.forEach(s => {
            if (!scoresByKpi[s.kpi_master_id]) scoresByKpi[s.kpi_master_id] = { deskripsi: s.kpi_deskripsi, scores: [] };
            scoresByKpi[s.kpi_master_id].scores.push(s.nilai);
        });

        // Cek jika ada KPI yang dinilai oleh >= 2 orang, apakah selisih Max dan Min > 20
        Object.values(scoresByKpi).forEach(kpi => {
            if (kpi.scores.length > 1) {
                const maxScore = Math.max(...kpi.scores);
                const minScore = Math.min(...kpi.scores);
                if ((maxScore - minScore) >= 20) {
                    gapWarnings.push(kpi.deskripsi);
                }
            }
        });
    }
    // ------------------------------------

    return {
        kpis: kpis || [],
        scores: scoresMap,
        generalNote: summaryResult.data?.catatan_kpi || '', 
        recommendations: recommendationsResult.data || [],
        areaScores: areaScoresResult.data || [],
        kpiHistory: historyResult.data || [],
        gapWarnings: gapWarnings, // <-- KIRIM PERINGATAN KE UI
        isDataFound: (scoresResult.data?.length || 0) > 0
    };
}

// src/app/actions.js

export async function saveFullAssessment(formData) {
    const supabase = await createClient(); 
    
    const karyawanId = formData.get('karyawanId');
    const periode = formData.get('periode');
    const scoresData = JSON.parse(formData.get('scores'));
    const generalNote = formData.get('generalNote');

    if (!karyawanId || !periode) return { error: 'Data tidak lengkap.' };

    // 1. DETEKSI SIAPA YANG MENILAI (Dukung fitur Nyamar/Impersonate)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: 'Sesi login tidak valid.' };

    const cookieStore = await cookies();
    let impersonateEmailRaw = cookieStore.get('impersonate_email')?.value;
    const impersonateEmail = impersonateEmailRaw ? impersonateEmailRaw.replace(/^["'](.*)["']$/, '$1').replace(/^"|"$/g, '').trim() : null;

    const { data: realUser } = await supabase.from('karyawan').select('role').eq('email', authUser.email).single();
    const activeEmail = (realUser?.role === 'Admin' && impersonateEmail) ? impersonateEmail : authUser.email;

    const { data: activePenilai } = await supabase.from('karyawan').select('id').eq('email', activeEmail.toLowerCase().trim()).single();
    if (!activePenilai) return { error: 'Gagal mengidentifikasi data penilai.' };

    const { data: kpis } = await supabase.from('kpi_master').select('id, kpi_deskripsi, bobot').in('id', Object.keys(scoresData));
    if (!kpis) return { error: 'Gagal mengambil data master KPI untuk snapshot.' };

    // 2. MASUKKAN PENILAI_ID KE DALAM DATA
    const assessmentsToUpsert = kpis.map(kpi => ({
        karyawan_id: karyawanId, 
        kpi_master_id: kpi.id, 
        periode: periode, 
        penilai_id: activePenilai.id, // <--- KUNCI PEMISAH KURSI
        nilai: scoresData[kpi.id],
        tanggal_penilaian: new Date().toISOString(), 
        kpi_deskripsi: kpi.kpi_deskripsi, 
        bobot: kpi.bobot
    }));

    const summaryToUpsert = { 
        karyawan_id: karyawanId, 
        periode: periode, 
        penilai_id: activePenilai.id, // <--- KUNCI PEMISAH KURSI
        catatan_kpi: generalNote || '' 
    };

    // 3. SIMPAN DENGAN ATURAN BARU
    // 3. SIMPAN DENGAN MENYEBUTKAN NAMA KOLOM (Bukan nama Aturan)
    const [assessmentResult, summaryResult] = await Promise.all([
        supabase.from('penilaian_kpi').upsert(assessmentsToUpsert, {
            // Sebutkan 4 pilar yang bikin datanya unik:
            onConflict: 'karyawan_id, kpi_master_id, periode, penilai_id' 
        }),
        supabase.from('penilaian_summary').upsert(summaryToUpsert, {
            // Sebutkan 3 pilar yang bikin catatannya unik:
            onConflict: 'karyawan_id, periode, penilai_id' 
        })
    ]);
    
    if (assessmentResult.error) return { error: `Gagal simpan skor: ${assessmentResult.error.message}` };
    if (summaryResult.error) return { error: `Gagal simpan catatan: ${summaryResult.error.message}` };
    
    revalidatePath('/dashboard/admin/assessment');
    revalidatePath('/dashboard');
    return { success: 'Penilaian berhasil disimpan!' };
}

export async function getDashboardData() {
  const supabase = await createClient();
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

export async function addRecommendation(karyawanId, periode, text) {
    const supabase = await createClient();
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: 'Sesi login tidak valid.' };

    const cookieStore = await cookies();
    let impersonateEmailRaw = cookieStore.get('impersonate_email')?.value;
    const impersonateEmail = impersonateEmailRaw ? impersonateEmailRaw.replace(/^["'](.*)["']$/, '$1').replace(/^"|"$/g, '').trim() : null;

    const { data: realUser } = await supabase.from('karyawan').select('role').eq('email', authUser.email).single();
    const activeEmail = (realUser?.role === 'Admin' && impersonateEmail) ? impersonateEmail : authUser.email;

    const { data: activePenilai } = await supabase.from('karyawan').select('id').eq('email', activeEmail.toLowerCase().trim()).single();

    if (!activePenilai) return { error: 'Gagal mengidentifikasi penilai.' };

    const { error } = await supabase.from('kpi_summary_recommendations').insert({ 
        karyawan_id: karyawanId, 
        periode: periode, 
        penilai_id: activePenilai.id, 
        rekomendasi_text: text 
    });
    
    if (error) {
        console.error("DB Error Add Recommendation:", error);
        return { error: `Gagal dari DB: ${error.message}` }; // Kirim error asli ke web
    }
    
    // --- KUNCI FIX: Sapu jagat semua cache di dalam /dashboard ---
    revalidatePath('/dashboard', 'layout'); 
    return { success: 'Rekomendasi berhasil ditambahkan.' };
}

export async function updateRecommendation(formData) {
    const supabase = await createClient();
    const id = formData.get('id');
    const newText = formData.get('rekomendasi_text');

    if (!id || !newText) return { error: 'Data tidak lengkap.' };

    const { error } = await supabase
        .from('kpi_summary_recommendations')
        .update({ rekomendasi_text: newText })
        .eq('id', id);

    if (error) return { error: `Gagal memperbarui: ${error.message}` };

    revalidatePath('/dashboard', 'layout'); // Sapu jagat cache
    return { success: 'Rekomendasi berhasil diperbarui.' };
}

export async function deleteRecommendation(formData) {
    const supabase = await createClient();
    const id = formData.get('id');

    if (!id) return { error: 'ID tidak ditemukan.' };

    const { error } = await supabase
        .from('kpi_summary_recommendations')
        .delete()
        .eq('id', id);

    if (error) return { error: `Gagal menghapus: ${error.message}` };

    revalidatePath('/dashboard', 'layout'); // Sapu jagat cache
    return { success: 'Rekomendasi berhasil dihapus.' };
}

/**
 * Mengubah status rencana training seorang karyawan.
 * Misalnya dari 'Disarankan' menjadi 'Sedang Berjalan'.
 * @param {string} planId - UUID dari tabel karyawan_training_plan.
 * @param {string} newStatus - Status baru ('Sedang Berjalan', 'Menunggu Verifikasi', 'Selesai').
 */
export async function updateTrainingPlanStatus(planId, newStatus) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('karyawan_training_plan')
        .update({ status: newStatus })
        .eq('id', planId);

    if (error) {
        console.error("Update plan status error:", error);
        return { error: 'Gagal memperbarui status training.' };
    }
    revalidatePath('/dashboard/my-development'); // Refresh halaman 'Rencana Pengembangan'
    return { success: 'Status training berhasil diperbarui!' };
}

/**
 * Menambahkan entri progres baru, termasuk mengunggah file bukti ke Supabase Storage.
 * @param {FormData} formData - Data dari form yang berisi plan_id, deskripsi, dan file.
 */

async function awardXpAndCheckBadges(karyawanId, xpAmount) {
    const supabase = await createClient();
    // Fungsi ini sekarang akan dipanggil dengan ID Karyawan yang benar, bukan ID Auth
    const { error } = await supabase.rpc('award_xp_and_update_level', {
        p_user_id: karyawanId, // p_user_id sekarang merujuk ke karyawan.id
        p_xp_amount: xpAmount 
    });
    if (error) console.error("Error awarding XP and Level:", error);
}

export async function addTrainingProgress(planId, deskripsi, fileUrl) {
    const supabase = await createClient();
    
    // 1. Ambil ID Karyawan yang benar dari rencana training
    const { data: planData } = await supabase.from('karyawan_training_plan').select('karyawan_id').eq('id', planId).single();
    if (!planData) return { error: "Rencana training tidak ditemukan." };

    const { error: dbError } = await supabase.from('training_progress_updates').insert({
        plan_id: planId,
        deskripsi_progress: deskripsi,
        file_bukti_url: fileUrl
    });
    
    if (dbError) return { error: 'Gagal menyimpan progres.' };

    // 2. Beri hadiah XP ke ID Karyawan yang benar
    await awardXpAndCheckBadges(planData.karyawan_id, 10);
    
    revalidatePath('/dashboard/learning-plan');
    return { success: 'Progres berhasil ditambahkan!' };
}

export async function verifyTrainingCompletion(planId) {
    const supabase = await createClient();
    
    const { data: plan } = await supabase.from('karyawan_training_plan').select('karyawan_id').eq('id', planId).single();
    if (!plan) return { error: "Rencana training tidak ditemukan." };

    const { error } = await supabase.from('karyawan_training_plan').update({ status: 'Selesai' }).eq('id', planId);
    if (error) return { error: 'Gagal memverifikasi training.' };

    // Logika ini sudah benar, menggunakan ID Karyawan dari plan
    await awardXpAndCheckBadges(plan.karyawan_id, 50);

    revalidatePath('/dashboard/admin/training-oversight');
    revalidatePath('/dashboard/learning-plan');
    return { success: 'Training berhasil diverifikasi!' };
}

export async function submitTrainingFeedback(formData) {
    const supabase = await createClient();
    const planId = formData.get('planId');
    const rating = parseInt(formData.get('rating'), 10);
    const komentar = formData.get('komentar');

    if (!planId || !rating) return { error: 'Rating wajib diisi.' };
    
    // 1. Ambil ID Karyawan yang benar dari rencana training
    const { data: planData } = await supabase.from('karyawan_training_plan').select('karyawan_id').eq('id', planId).single();
    if (!planData) return { error: "Rencana training tidak ditemukan." };

    const { error } = await supabase.from('training_feedback').insert({ plan_id: planId, rating: rating, komentar: komentar });
    
    if (error) {
        if (error.code === '23505') return { error: 'Anda sudah pernah memberikan ulasan.' };
        return { error: 'Gagal menyimpan feedback.' };
    }

    // 2. Beri hadiah XP ke ID Karyawan yang benar
    await awardXpAndCheckBadges(planData.karyawan_id, 5);

    revalidatePath('/dashboard/learning-plan');
    return { success: 'Terima kasih atas ulasan Anda!' };
} 

/**
 * Fungsi utama untuk menghasilkan rekomendasi training untuk semua karyawan
 * berdasarkan kinerja mereka pada periode tertentu.
 * @param {string} periode - Periode yang akan dianalisis, misal: "Agustus 2025"
 */
// Di dalam file: src/app/actions.js

export async function generateTrainingRecommendations(periode) {
    console.log(`--- Memulai proses pembuatan rekomendasi untuk periode: ${periode} ---`);
    
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        { auth: { persistSession: false } }
    );

    const { data: employees, error: empError } = await supabaseAdmin
        .from('karyawan')
        .select('id, nama, posisi')
        .neq('tipe_akun', 'Admin Non-Penilaian');
        
    if (empError) {
        console.error("Gagal mengambil data karyawan:", empError);
        return { error: "Gagal mengambil data karyawan." };
    }

    let recommendationsCreated = 0;
    let details = [];
    
    for (const employee of employees) {
        console.log(`\nMenganalisis karyawan: ${employee.nama} (Posisi: ${employee.posisi})`);

        const { data: areaScores, error: scoreError } = await supabaseAdmin.rpc(
            'get_average_scores_by_area', 
            { p_karyawan_id: employee.id, p_periode: periode }
        );

        if (scoreError || !areaScores || areaScores.length === 0) {
            console.log(` -> Tidak ada data skor ditemukan. Karyawan dilewati.`);
            continue;
        }
        
        const lowestArea = areaScores
            .filter(s => s.average_score > 0)
            .sort((a, b) => a.average_score - b.average_score)[0];
        
        if (!lowestArea) {
            console.log(` -> Semua skor area adalah 0. Karyawan dilewati.`);
            continue;
        }
        console.log(` -> Area terendah ditemukan: "${lowestArea.area}"`);

        // --- AWAL PERBAIKAN: Gunakan .filter() dengan wildcard '%' ---
        const { data: linkedTrainings, error: linkError } = await supabaseAdmin
            .from('training_programs')
            .select(`
                id,
                nama_program,
                training_area_link!inner ( area_name ) 
            `)
            // Filter 1: Berdasarkan Posisi
            .or(
                'posisi.is.null',
                `posisi.cs.{"${employee.posisi}"}`
            )
            // Filter 2: Berdasarkan Area (fuzzy match)
            .filter('training_area_link.area_name', 'ilike', `%${lowestArea.area}%`);
        // --- AKHIR PERBAIKAN ---

        if (linkError) {
             console.error(` -> Error mencari training:`, linkError.message);
             continue;
        }

        if (!linkedTrainings || linkedTrainings.length === 0) {
            console.log(` -> Tidak ada training yang cocok ditemukan untuk area & posisi tersebut.`);
            continue;
        }

        for (const training of linkedTrainings) {
            const planToInsert = {
                karyawan_id: employee.id,
                training_program_id: training.id,
                periode: periode,
                status: 'Disarankan',
                assigned_by: 'Sistem Otomatis'
            };

            const { error: upsertError } = await supabaseAdmin
                .from('karyawan_training_plan')
                .upsert(planToInsert, { onConflict: 'karyawan_id, training_program_id, periode' });

            if (upsertError) {
                console.error(` -> Gagal memasukkan rekomendasi untuk ${employee.nama}:`, upsertError.message);
            } else {
                recommendationsCreated++;
                details.push(`- Untuk ${employee.nama}: direkomendasikan training "${training.nama_program}"`);
            }
        }
    }

    revalidatePath('/dashboard/learning-plan');
    return { 
        success: `Proses selesai! ${recommendationsCreated} rekomendasi dibuat/diperbarui.`,
        details: details
    };
}
// ... (semua server actions lain tidak berubah)

export async function createAssessmentPeriod(formData) {
    const supabase = await createClient();
    
    const periodData = {
        nama_periode: formData.get('nama_periode'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        status: 'Open'
    };

    const { data: newPeriod, error: periodError } = await supabase.from('assessment_periods').insert(periodData).select('id').single();
    if (periodError) return { error: 'Gagal membuat periode baru. Pastikan nama periode unik.' };
    const periodId = newPeriod.id;

    // --- PERBAIKAN: Ambil SEMUA kolom atasan ---
    const { data: allEmployees, error: empError } = await supabase.from('karyawan').select('id, nama, superior_id, superior_id_2, tipe_akun');
    if (empError) return { error: 'Gagal mengambil data karyawan.' };

    const assessableEmployees = allEmployees.filter(e => e.tipe_akun !== 'Admin Non-Penilaian');
    const potentialPeers = allEmployees.filter(e => e.tipe_akun !== 'Admin Non-Penilaian');

    let assessorsToInsert = [];
    
    for (const employee of assessableEmployees) {
        
        // a. Tugas Self-Assessment
        assessorsToInsert.push({
            period_id: periodId,
            employee_id: employee.id,
            assessor_id: employee.id,
            assessor_type: 'self'
        });

        // b. Tugas Penilaian Atasan 1
        if (employee.superior_id) {
            assessorsToInsert.push({
                period_id: periodId,
                employee_id: employee.id,
                assessor_id: employee.superior_id,
                assessor_type: 'superior'
            });
        }
        
        // c. Tugas Penilaian Atasan 2 (Sekarang akan berfungsi)
        if (employee.superior_id_2) {
            assessorsToInsert.push({
                period_id: periodId,
                employee_id: employee.id,
                assessor_id: employee.superior_id_2,
                assessor_type: 'superior'
            });
        }

        // d. Tugas Penilaian Rekan Kerja (Peer)
        const peers = potentialPeers.filter(p => 
            p.id !== employee.id &&
            p.id !== employee.superior_id &&
            p.id !== employee.superior_id_2
        );
        for (const peer of peers) {
            assessorsToInsert.push({
                period_id: periodId,
                employee_id: employee.id,
                assessor_id: peer.id,
                assessor_type: 'peer'
            });
        }
    }

    const { error: assessorError } = await supabase.from('behavioral_assessors').insert(assessorsToInsert);
    if (assessorError) {
        console.error("Insert assessors error:", assessorError);
        return { error: 'Gagal men-generate tugas penilai.' };
    }

    revalidatePath('/dashboard/admin/behavioral-assessment');
    return { success: `Periode "${periodData.nama_periode}" berhasil dibuat dan ${assessorsToInsert.length} tugas penilaian telah di-generate.` };
}

/**
 * MENUTUP PERIODE PENILAIAN
 */
export async function closeAssessmentPeriod(periodId) {
    const supabase = await createClient();
    if (!periodId) return { error: 'ID Periode tidak ditemukan.' };

    const { error } = await supabase.from('assessment_periods').update({ status: 'Closed' }).eq('id', periodId);
    if (error) return { error: 'Gagal menutup periode penilaian.' };
    
    revalidatePath('/dashboard/admin/behavioral-assessment');
    return { success: 'Periode penilaian berhasil ditutup.' };
}

/**
 * MENYIMPAN HASIL PENILAIAN
 */
export async function submitBehavioralAssessment(formData) {
    const supabase = await createClient();
    const relationshipId = formData.get('relationshipId');
    const aspectIds = formData.getAll('aspectId');
    
    if (!relationshipId || aspectIds.length === 0) return { error: 'Data form tidak lengkap.' };

    const resultsToUpsert = aspectIds.map(aspectId => ({
        assessor_relationship_id: relationshipId,
        aspect_id: aspectId,
        score: formData.get(`score_${aspectId}`),
        comment: formData.get(`comment_${aspectId}`) || null
    }));

    const { error } = await supabase.from('behavioral_results').upsert(resultsToUpsert, { onConflict: 'assessor_relationship_id, aspect_id' });
    if (error) {
        console.error("Submit behavioral assessment error:", error);
        return { error: 'Gagal menyimpan penilaian.' };
    }
    
    revalidatePath('/dashboard/my-assessments');
    return { success: 'Penilaian berhasil disimpan!' };
}

// Di dalam file: src/app/actions.js

export async function getBehavioralDashboardData(periode) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: 'Not authenticated' };

    const { data: karyawan } = await supabase.from('karyawan').select('id, nama').eq('email', authUser.email).single();
    if (!karyawan) return { error: 'Failed to fetch user profile.' };

    const { data: currentPeriod } = await supabase.from('assessment_periods').select('id').eq('nama_periode', periode).single();
    if (!currentPeriod) {
        return { user: karyawan, data: { behavioralScores: [], pendingTaskCount: 0, certificates: [], comments: [], topRankings: {} } };
    }
    const periodId = currentPeriod.id;

    const [
        behavioralScoresResult, 
        pendingTasksResult, 
        certificatesResult,
        commentsResult,
        topRankingsResult
    ] = await Promise.all([
        supabase.rpc('calculate_behavioral_score', { p_employee_id: karyawan.id, p_period_id: periodId }),
        supabase.from('behavioral_assessors').select('id, behavioral_results(id)').eq('assessor_id', karyawan.id).eq('period_id', periodId),
        supabase.from('generated_certificates').select('*, behavioral_aspects(nama_aspek)').eq('employee_id', karyawan.id).eq('period_id', periodId),
        supabase.from('behavioral_results')
            .select('comment, behavioral_aspects(nama_aspek), behavioral_assessors!inner(assessor_type)')
            .eq('behavioral_assessors.employee_id', karyawan.id)
            .eq('behavioral_assessors.period_id', periodId)
            .not('comment', 'is', null)
            .neq('comment', ''),
        supabase.rpc('get_top_behavioral_rankings', { p_period_id: periodId })
    ]);

    // Hapus "alat pelacak" yang sudah tidak kita perlukan
    
    const pendingTaskCount = pendingTasksResult.data?.filter(task => task.behavioral_results.length === 0).length || 0;

    return {
        user: karyawan,
        data: {
            behavioralScores: behavioralScoresResult.data || [],
            pendingTaskCount: pendingTaskCount,
            certificates: certificatesResult.data || [],
            comments: commentsResult.data || [],
            // --- INI DIA PERBAIKANNYA ---
            topRankings: topRankingsResult.data || {} 
        }
    };
}

export async function invokeCertificateGenerator(employeeName, aspectName, period) {
    const supabase = await createClient(); // Gunakan createClient() standar

    // supabase.functions.invoke adalah cara modern dan aman untuk memanggil Edge Function
    const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { employeeName, aspectName, period }
    });

    if (error) {
        console.error("Error invoking edge function:", error);
        return { error: `Gagal memanggil function: ${error.message}` };
    }

    console.log("Hasil dari Edge Function:", data);
    return { success: data };
}


// Di dalam file: src/app/actions.js
// ... (semua server actions lain tidak berubah)

// --- FUNGSI BARU UNTUK MEN-GENERATE SEMUA SERTIFIKAT ---
export async function generateAllCertificatesForPeriod(periodId) {
    const supabase = await createClient();
    
    const { data: periodData } = await supabase.from('assessment_periods').select('nama_periode').eq('id', periodId).single();
    if (!periodData) return { error: "Periode tidak ditemukan." };

    const { data: aspects } = await supabase.from('behavioral_aspects').select('id, nama_aspek').eq('is_active', true);
    if (!aspects || aspects.length === 0) return { error: "Tidak ada aspek penilaian yang aktif." };

    // 1. Ambil SEMUA karyawan yang bisa dinilai
    const { data: employees } = await supabase.from('karyawan').select('id, nama').neq('tipe_akun', 'Admin Non-Penilaian');
    if (!employees || employees.length === 0) return { error: "Karyawan tidak ditemukan." };

    let certificatesGenerated = 0;
    let details = [];

    // 2. Lakukan perulangan untuk SETIAP ASPEK
    for (const aspect of aspects) {
        let topScorer = null;
        let maxScore = -1;

        // 3. Lakukan perulangan untuk SETIAP KARYAWAN untuk mencari skor tertinggi
        for (const employee of employees) {
            // Panggil fungsi RPC untuk mendapatkan skor akhir karyawan ini
            const { data: scores, error } = await supabase.rpc('calculate_behavioral_score', { 
                p_employee_id: employee.id, 
                p_period_id: periodId 
            });

            if (error || !scores) continue;

            // Cari skor untuk aspek yang sedang kita proses
            const aspectScoreData = scores.find(s => s.aspect_name === aspect.nama_aspek);
            
            if (aspectScoreData && aspectScoreData.final_score > maxScore) {
                maxScore = aspectScoreData.final_score;
                topScorer = employee;
            }
        }

        // 4. Jika pemenang ditemukan (dan skornya di atas 0), panggil Edge Function
        if (topScorer && maxScore > 0) {
            const { data: certData, error: invokeError } = await supabase.functions.invoke('generate-certificate', {
                body: { 
                    employeeName: topScorer.nama, 
                    aspectName: aspect.nama_aspek, 
                    period: periodData.nama_periode 
                }
            });
            
            if (invokeError) {
                details.push(`- Gagal generate sertifikat untuk ${topScorer.nama}: ${invokeError.message}`);
            } else {
                // 5. Simpan URL sertifikat ke database
                await supabase.from('generated_certificates').upsert({
                    employee_id: topScorer.id,
                    period_id: periodId,
                    aspect_id: aspect.id,
                    certificate_url: certData.certificateUrl
                }, { onConflict: 'employee_id, period_id, aspect_id' });

                certificatesGenerated++;
                details.push(`- Aspek "${aspect.nama_aspek}": Sertifikat dibuat untuk ${topScorer.nama}.`);
            }
        } else {
            details.push(`- Aspek "${aspect.nama_aspek}": Tidak ada data penilaian yang valid ditemukan.`);
        }
    }

    revalidatePath('/dashboard/community');
    return { 
        success: `${certificatesGenerated} sertifikat berhasil dibuat.`,
        details: details 
    };
}

export async function checkIsAssessor() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return false;

    const { data: profile } = await supabase
        .from('karyawan')
        .select('id, role')
        .eq('email', authUser.email)
        .single();

    if (!profile) return false;
    if (profile.role === 'Admin') return true; // Admin otomatis bisa

    // Cek apakah ID profile ini ada di kolom superior manapun
    const { count, error } = await supabase
        .from('karyawan')
        .select('*', { count: 'exact', head: true })
        .or(`superior_id.eq.${profile.id},superior_id_2.eq.${profile.id}`);

    return count > 0;
}

export async function getEmployeesToAssess() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return [];

    const cookieStore = await cookies();
    let impersonateEmail = cookieStore.get('impersonate_email')?.value;

    // Bersihkan email dari tanda kutip ganda (Sapu Jagat)
    if (impersonateEmail) {
        impersonateEmail = impersonateEmail.replace(/^["'](.*)["']$/, '$1').replace(/^"|"$/g, '').trim();
    }

    const { data: realUser } = await supabase
        .from('karyawan')
        .select('role')
        .eq('email', authUser.email)
        .single();

    let activeEmail = (realUser?.role === 'Admin' && impersonateEmail) 
                      ? impersonateEmail 
                      : authUser.email;

    // Pastikan email selalu huruf kecil untuk kecocokan database
    activeEmail = activeEmail.toLowerCase().trim();

    // --- PERBAIKAN 1: Ambil juga 'role' dari database ---
    const { data: penilai, error } = await supabase
        .from('karyawan')
        .select('id, tipe_akun, role') 
        .eq('email', activeEmail)
        .single();

    if (!penilai || error) {
        console.error("DEBUG: Email yang dicari ->", activeEmail);
        console.error("ERROR DB:", error);
        return [];
    }

    let query = supabase.from('karyawan').select('id, nama, posisi');

    // --- PERBAIKAN 2: Buka akses untuk semua yang memiliki role 'Admin' ---
    if (penilai.role === 'Admin' || penilai.tipe_akun === 'Admin Non-Penilaian') {
        // Admin: Ambil SEMUA karyawan (kecuali akun Admin Non-Penilaian itu sendiri)
        query = query.neq('tipe_akun', 'Admin Non-Penilaian'); 
    } else {
        // Atasan biasa (Nabila, Garin, dll): Ambil hanya bawahannya
        query = query.or(`superior_id.eq.${penilai.id},superior_id_2.eq.${penilai.id}`);
    }

    const { data: subordinates } = await query.order('nama');
    return subordinates || [];
}

export async function setImpersonate(email) {
    const cookieStore = await cookies();
    cookieStore.set('impersonate_email', email);
}

export async function stopImpersonate() {
    const cookieStore = await cookies();
    cookieStore.delete('impersonate_email');
}