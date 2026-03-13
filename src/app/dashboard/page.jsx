// src/app/dashboard/page.tsx

import { redirect } from 'next/navigation';
import DashboardClient from '../../components/DashboardClient';
import { getDashboardPageData } from '../../app/actions';

export default async function DashboardPage({ searchParams }) {
  // 1. TAMBAHKAN AWAIT DI SINI! (Wajib untuk Next.js terbaru)
  const params = await searchParams; 

  // 2. Baca dari 'params' yang sudah ditunggu, bukan dari 'searchParams' langsung
  const month = params?.bulan || (new Date().getMonth() + 1).toString();
  const year = params?.tahun || new Date().getFullYear().toString();
  
  const periode = `${new Date(0, parseInt(month, 10) - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;

  const { user, data, error } = await getDashboardPageData(periode);

  if (error || !user) {
    redirect('/login');
  }
  
  if (user.tipe_akun === 'Admin Non-Penilaian') {
    redirect('/dashboard/admin');
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