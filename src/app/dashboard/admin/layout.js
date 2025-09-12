import { createClient } from '../../../utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const supabase = createClient(cookies());

  // 1. Cek sesi login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Cek peran (role) pengguna dari tabel 'karyawan'
  const { data: karyawan } = await supabase
    .from('karyawan')
    .select('role')
    .eq('email', user.email)
    .single();

  const isAdmin = karyawan?.role === 'Admin';

  // 3. Jika bukan admin, tampilkan pesan "Akses Ditolak"
  if (!isAdmin) {
    return (
        <div className="flex-grow flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-xl shadow-md">
                <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
                <p className="text-gray-600 mt-2">Anda tidak memiliki hak akses untuk membuka halaman ini.</p>
            </div>
        </div>
    );
  }

  // 4. Jika admin, tampilkan konten halaman admin
  return <>{children}</>;
}