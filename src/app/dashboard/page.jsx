import { redirect } from 'next/navigation';
import DashboardClient from '../../components/DashboardClient';
import { getDashboardPageData } from '../../app/actions';

export default async function DashboardPage({ searchParams }) {
  const month = searchParams.bulan || (new Date().getMonth() + 1).toString();
  const year = searchParams.tahun || new Date().getFullYear().toString();
  const periode = `${new Date(0, parseInt(month, 10) - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;

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
        // --- PERBAIKAN: Kirim ID Karyawan & Periode ---
        karyawanId={user.id}
        periode={periode}
    />
  );
}