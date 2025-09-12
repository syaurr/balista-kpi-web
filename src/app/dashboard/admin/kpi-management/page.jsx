import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';
import KpiManagementClient from '../../../../components/KpiManagementClient';

async function getKpiPageData() {
    const supabase = createClient(cookies());

    // --- PERBAIKAN QUERY: Ambil data KPI beserta link-nya ---
    const { data: kpis } = await supabase
        .from('kpi_master')
        .select(`
            *,
            kpi_links (
                id,
                link_url
            )
        `)
        .order('posisi')
        .order('area_kerja');

    const { data: positions } = await supabase.from('karyawan').select('posisi').order('posisi');
    
    // Ambil posisi unik
    const uniquePositions = [...new Map(positions.map(item => [item['posisi'], item])).values()];

    return {
        kpis: kpis || [],
        positions: uniquePositions || [],
    };
}

export default async function KpiManagementPage() {
    const { kpis, positions } = await getKpiPageData();

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Manajemen Master KPI</h1>
            <KpiManagementClient initialKpis={kpis} allPositions={positions} />
        </div>
    );
}