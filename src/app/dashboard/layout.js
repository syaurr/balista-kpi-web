import { createClient } from '../../utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '../../components/Sidebar'; // <-- Import komponen baru

export default async function DashboardLayout({ children }) {
  const supabase = createClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: karyawan } = await supabase
    .from('karyawan').select('nama, role, posisi').eq('email', user.email).single();
  
  const isAdmin = karyawan?.role === 'Admin';

  return (
    <div className="min-h-screen flex">
      {/* Panggil komponen Sidebar baru dan kirim data yang dibutuhkan */}
      <Sidebar karyawan={karyawan} isAdmin={isAdmin} />

      {/* Main Content */}
      <div className="flex-1 bg-[#f4e3be]">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
        </main>
      </div>
    </div>
  );
}