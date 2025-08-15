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
    // Tentukan role berdasarkan siapa yang sedang login
    const role = karyawan?.role === 'Admin' ? 'Admin' : 'User';

    // Ambil semua data dari form, termasuk yang diisi oleh user
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
        created_by_role: role // 'created_by_role' sekarang diisi secara dinamis
    };

    const { error } = await supabase.from('training_programs').insert(programData);

    if (error) {
        console.error("Error adding training program:", error);
        return { error: 'Gagal menambah program.' };
    }

    // Refresh kedua halaman karena data berubah di keduanya
    revalidatePath('/dashboard/training');
    revalidatePath('/dashboard/admin/training');
}
// --- AKHIR PERBAIKAN UTAMA ---


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


// --- FUNGSI-FUNGSI DASHBOARD YANG HILANG ---

export async function fetchKpiDetailsForArea(areaName) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: karyawan } = await supabase.from('karyawan').select('id').eq('email', user.email).single();
  if (!karyawan) return { error: 'User profile not found' };
  
  const { data, error } = await supabase.rpc('get_kpi_details_by_area', {
    p_karyawan_id: karyawan.id,
    p_area_name: areaName
  });

  if (error) {
    console.error("Error fetching KPI details:", error);
    return { error: 'Failed to fetch details' };
  }
  return { data };
}

export async function fetchAreaNote(areaName) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { note: '' };
  
  const { data: karyawan } = await supabase.from('karyawan').select('id').eq('email', user.email).single();
  if (!karyawan) return { note: '' };

  const periode = new Date().getFullYear().toString();
  const { data } = await supabase.from('area_summary_notes')
    .select('catatan')
    .eq('karyawan_id', karyawan.id)
    .eq('periode', periode)
    .eq('area_name', areaName)
    .single();
    
  return { note: data?.catatan || '' };
}

export async function saveAreaNote(areaName, noteText) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };
  
  const { data: karyawan } = await supabase.from('karyawan').select('id').eq('email', user.email).single();
  if (!karyawan) return { error: 'User profile not found' };

  const periode = new Date().getFullYear().toString();
  const { error } = await supabase.from('area_summary_notes').upsert({
    karyawan_id: karyawan.id,
    periode: periode,
    area_name: areaName,
    catatan: noteText
  }, { onConflict: 'karyawan_id, periode, area_name' });
  
  if (error) {
    console.error('Save note error:', error);
    return { error: 'Gagal menyimpan catatan.' };
  }

  revalidatePath('/dashboard');
  return { success: 'Catatan berhasil disimpan!' };
}