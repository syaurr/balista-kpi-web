// src/app/dashboard/admin/layout.js
import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  // --- PERBAIKAN: Tambahkan 'await' di sini ---
  // Kita tidak perlu lagi oper cookies() karena sudah di-handle di dalam server.js
  const supabase = await createClient(); 

  // Sekarang 'supabase' sudah jadi objek asli, baris di bawah ini pasti jalan
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // 2. Cek peran (role) pengguna
  const { data: karyawan } = await supabase
    .from('karyawan')
    .select('role')
    .eq('email', user.email)
    .single();

  const isAdmin = karyawan?.role === 'Admin';

  // 3. Proteksi akses
  if (!isAdmin) {
    return (
        <div className="flex-grow flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-8 bg-white rounded-xl shadow-md border-2 border-red-100">
                <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
                <p className="text-gray-600 mt-2">Maaf kak, area ini cuma buat Admin Balista aja. 🙏</p>
                <div className="mt-4">
                  <a href="/dashboard" className="btn btn-sm btn-ghost text-teal-700 underline">Kembali ke Dashboard</a>
                </div>
            </div>
        </div>
    );
  }

  return <>{children}</>;
}