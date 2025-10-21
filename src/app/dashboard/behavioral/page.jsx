import { redirect } from 'next/navigation';
import { getBehavioralDashboardData } from '../../actions';
import BehavioralDashboardClient from '../../../components/BehavioralDashboardClient';

export default async function BehavioralDashboardPage({ searchParams }) {
    // Cari semua periode penilaian yang pernah ada untuk ditampilkan di dropdown
    const { createClient } = await import('../../../utils/supabase/server');
    const supabase = createClient();
    const { data: allPeriods } = await supabase.from('assessment_periods').select('nama_periode').order('start_date', { ascending: false });

    // Tentukan periode aktif, fallback ke periode terbaru jika tidak ada di URL
    const activePeriod = searchParams.periode || allPeriods?.[0]?.nama_periode || null;
    
    let pageData = { user: null, data: null, error: null };
    if (activePeriod) {
        pageData = await getBehavioralDashboardData(activePeriod);
    } else {
        pageData.error = "Belum ada periode penilaian yang dibuat.";
    }

    if (pageData.error) {
        // Jangan redirect, tampilkan pesan error saja
    }
    if (!pageData.user) {
        redirect('/login');
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Behavioral Dashboard</h1>
            <BehavioralDashboardClient
                user={pageData.user}
                initialData={pageData.data}
                allPeriods={allPeriods || []}
                activePeriod={activePeriod}
                error={pageData.error}
            />
        </div>
    );
}