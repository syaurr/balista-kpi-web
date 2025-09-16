import { redirect } from 'next/navigation';
import DashboardClient from '../../components/DashboardClient';
import { getDashboardDataForPeriod } from '../../app/actions';

export default async function DashboardPage({ searchParams }) {
  // Ambil periode dari URL, atau gunakan periode saat ini sebagai default
  const month = searchParams.bulan || (new Date().getMonth() + 1).toString();
  const year = searchParams.tahun || new Date().getFullYear().toString();
  const periode = `${new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;

  const { user, data, error } = await getDashboardDataForPeriod(periode);

  if (error || !user) {
    redirect('/login');
  }
  
  return (
    <DashboardClient 
        user={user} 
        initialData={data}
        initialMonth={month}
        initialYear={year}
    />
  );
}