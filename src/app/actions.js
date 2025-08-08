'use server';

import { createClient } from '../utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function addTrainingProgram(formData) {
  const supabase = createClient(cookies());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Anda harus login untuk menambah data.' };

  const programData = {
    nama_program: formData.get('nama_program'),
    penyedia: formData.get('penyedia'),
    link_akses: formData.get('link_akses'),
    created_by_role: 'User'
  };

  const { error } = await supabase.from('training_programs').insert(programData);
  if (error) return { error: 'Gagal menyimpan usulan training.' };

  revalidatePath('/dashboard/training');
  return { success: 'Usulan training berhasil ditambahkan!' };
}

// --- FUNGSI BARU UNTUK UPDATE ---
export async function updateTrainingProgram(formData) {
  const supabase = createClient(cookies());
  const id = formData.get('id');

  const updatedData = {
    nama_program: formData.get('nama_program'),
    penyedia: formData.get('penyedia'),
    link_akses: formData.get('link_akses'),
    biaya: formData.get('biaya'),
    created_by_role: formData.get('created_by_role')
  };
  
  const { error } = await supabase.from('training_programs').update(updatedData).eq('id', id);
  if (error) return { error: 'Gagal memperbarui data training.' };

  revalidatePath('/dashboard/admin/training');
  return { success: 'Data training berhasil diperbarui!' };
}

// --- FUNGSI BARU UNTUK DELETE ---
export async function deleteTrainingProgram(formData) {
  const supabase = createClient(cookies());
  const id = formData.get('id');

  const { error } = await supabase.from('training_programs').delete().eq('id', id);
  if (error) return { error: 'Gagal menghapus data training.' };

  revalidatePath('/dashboard/admin/training');
  return { success: 'Data training berhasil dihapus!' };
}

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