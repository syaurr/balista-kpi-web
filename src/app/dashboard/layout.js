// src/app/dashboard/layout.js
import { createClient } from '@/utils/supabase/server'; 
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar'; 

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect('/login');

  // 1. Cek profil asli yang login di Auth
  const { data: asli } = await supabase
    .from('karyawan')
    .select('role')
    .eq('email', authUser.email)
    .single();

  // 2. Izin nyamar diberikan jika ROLE ASLI adalah Admin (Tasya & Tria)
  const bisaNyamar = asli?.role === 'Admin';

  const cookieStore = await cookies();
  const impersonateEmail = cookieStore.get('impersonate_email')?.value;
  const activeEmail = (bisaNyamar && impersonateEmail) ? impersonateEmail : authUser.email;

  // 3. Ambil data profil aktif
  const { data: karyawan } = await supabase
    .from('karyawan')
    .select('id, nama, role, posisi, xp, tipe_akun, email')
    .eq('email', activeEmail)
    .single();

  if (!karyawan) redirect('/login');

  // 4. Hitung bawahan untuk Sidebar
  const { count } = await supabase
    .from('karyawan')
    .select('*', { count: 'exact', head: true })
    .or(`superior_id.eq.${karyawan.id},superior_id_2.eq.${karyawan.id}`);

  const isAdmin = karyawan.role === 'Admin';
  const isAssessor = (count ?? 0) > 0;
  const isSuperAssessor = karyawan.tipe_akun === 'Admin Non-Penilaian';

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        karyawan={karyawan} 
        isAdmin={karyawan.role === 'Admin'} 
        isAssessor={isAssessor} 
        isSuperAssessor={karyawan.tipe_akun === 'Admin Non-Penilaian'} 
        bisaNyamar={bisaNyamar} // <--- KIRIM INI
      />
      <div className="flex-1 bg-[#f4e3be]">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
        </main>
      </div>
    </div>
  );
}