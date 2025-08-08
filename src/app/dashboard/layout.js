import { createClient } from '../../utils/supabase/server';
// Hapus 'import { cookies }'
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '../../components/SignOutButton';

function NavLink({ href, children }) {
  return (
    <Link href={href} className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-teal-100 transition-colors">
      {children}
    </Link>
  );
}

export default async function DashboardLayout({ children }) {
  const supabase = createClient(); // Panggil tanpa argumen
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: karyawan } = await supabase
    .from('karyawan').select('nama, role, posisi').eq('email', user.email).single();
  
  const isAdmin = karyawan?.role === 'Admin';

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white shadow-md flex flex-col p-4">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-[#022020]">Balista KPI</h1>
          <p className="text-sm text-gray-500">Welcome, {karyawan?.nama}</p>
        </div>
        <nav className="flex-grow space-y-2">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/dashboard/training">Program Training</NavLink>
          {isAdmin && (
            <NavLink href="/dashboard/admin/training">Admin: Kelola Training</NavLink>
          )}
        </nav>
        <div className="mt-auto">
          <SignOutButton />
        </div>
      </aside>
      <div className="flex-1 bg-[#f4e3be]">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
        </main>
      </div>
    </div>
  );
}