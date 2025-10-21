import { createClient } from '../../utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '../../components/Sidebar';

export default async function DashboardLayout({ children }) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // --- PERBAIKAN: Ambil juga kolom 'tipe_akun' ---
  const { data: karyawan } = await supabase
    .from('karyawan')
    .select('nama, role, posisi, xp, tipe_akun') // <-- 'tipe_akun' ditambahkan di sini
    .eq('email', user.email)
    .single();
  
  const isAdmin = karyawan?.role === 'Admin';

  return (
    <div className="min-h-screen flex">
      {/* Kirim data 'karyawan' yang sudah lengkap ke Sidebar */}
      <Sidebar karyawan={karyawan} isAdmin={isAdmin} />

      <div className="flex-1 bg-[#f4e3be]">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
        </main>
      </div>
    </div>
  );
}