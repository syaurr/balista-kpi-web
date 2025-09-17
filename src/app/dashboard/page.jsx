import { redirect } from 'next/navigation';
import DashboardClient from '../../components/DashboardClient';
// --- PERBAIKAN 1: TAMBAHKAN BARIS IMPORT INI ---
import { getDashboardPageData } from '../../app/actions';

// --- PERBAIKAN 2: HAPUS SELURUH BLOK FUNGSI LAMA 'getDashboardData' DARI SINI ---
// async function getDashboardData(periode) { ... } <-- HAPUS SEMUA INI


// Ini adalah komponen utama halaman Anda
export default async function DashboardPage({ searchParams }) {
  // Ambil periode dari URL, atau gunakan periode saat ini sebagai default
  const month = searchParams.bulan || (new Date().getMonth() + 1).toString();
  const year = searchParams.tahun || new Date().getFullYear().toString();
  const periode = `${new Date(0, parseInt(month, 10) - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;

  // Memanggil satu fungsi yang benar dan terpusat dari actions.js
  // Panggilan ini sudah benar, hanya import-nya yang kurang.
  const { user, data, error } = await getDashboardPageData(periode);
  
  if (error || !user) {
    redirect('/login');
  }
  
  return (
    <DashboardClient 
      user={user} 
      initialData={data}
      initialMonth={month}
      initialYear={year}
      karyawanId={user.id} 
      periode={periode}
    />
  );
}