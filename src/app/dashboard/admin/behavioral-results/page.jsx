import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';
import BehavioralResultsClient from '../../../../components/BehavioralResultsClient';
import { redirect } from 'next/navigation';

async function getPageData(periodId) {
    const supabase = createClient(cookies());
    let dashboardData = {};

    if (periodId) {
        const { data, error } = await supabase.rpc('get_behavioral_dashboard_data', { p_period_id: periodId });
        if (error) {
            console.error("Error fetching results data:", error);
            dashboardData = { error: error.message };
        } else {
            dashboardData = data;
        }
    }
    return dashboardData;
}

export default async function BehavioralResultsPage({ searchParams }) {
    const supabase = createClient(cookies());

    // Ambil daftar semua periode (termasuk tanggal & status untuk manajemen)
    const { data: allPeriods } = await supabase
        .from('assessment_periods')
        .select('id, nama_periode, start_date, end_date, status')
        .order('start_date', { ascending: false });

    // Tentukan periode aktif
    const activePeriodId = searchParams.periode_id || allPeriods?.[0]?.id || null;
    const dashboardData = await getPageData(activePeriodId);

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Panel Penilaian Behavioral</h1>
            <p className="text-gray-600 mb-8">
                Pantau progres, lihat hasil, dan kelola periode penilaian dari satu tempat.
            </p>
            <BehavioralResultsClient
                allPeriods={allPeriods || []}
                activePeriodId={activePeriodId ? String(activePeriodId) : null} // Pastikan string
                initialData={dashboardData}
            />
        </div>
    );
}