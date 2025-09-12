// app/dashboard/admin/assessment/page.jsx

export const dynamic = 'force-dynamic';

import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';
import AssessmentClient from '../../../../components/AssessmentClient';
import { getAssessmentDataLogic } from '../../../../app/actions'; 

async function getEmployeeList() {
    const supabase = createClient(cookies());
    const { data: employees } = await supabase.from('karyawan').select('id, nama, posisi').order('nama');
    return employees || [];
}

export default async function AssessmentPage({ searchParams }) {
    console.log("\n--- [SERVER PAGE] Memulai Render ---");
    console.log("[SERVER PAGE] Menerima searchParams:", searchParams);

    const supabase = createClient(cookies());

    const selectedEmployeeId = searchParams.karyawanId || null;
    const month = searchParams.bulan || (new Date().getMonth() + 1).toString().padStart(2, '0');
    const year = searchParams.tahun || new Date().getFullYear().toString();
    const periode = selectedEmployeeId ? `${new Date(0, month - 1).toLocaleString('id-ID', { month: 'long' })} ${year}` : null;
    
    console.log(`[SERVER PAGE] Menghitung Periode: ${periode}`);

    const employees = await getEmployeeList();
    let initialAssessmentData = null;

    if (selectedEmployeeId && periode) {
        console.log(`[SERVER PAGE] Memanggil getAssessmentDataLogic dengan ID: ${selectedEmployeeId} dan Periode: ${periode}`);
        initialAssessmentData = await getAssessmentDataLogic(supabase, selectedEmployeeId, periode);
        console.log("[SERVER PAGE] Menerima hasil dari getAssessmentDataLogic:", initialAssessmentData);
    } else {
        console.log("[SERVER PAGE] Tidak ada karyawan terpilih, skip pengambilan data penilaian.");
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Input Penilaian KPI Karyawan</h1>
            <AssessmentClient 
                employees={employees} 
                initialAssessmentData={initialAssessmentData}
                initialSearchParams={searchParams}
            />
        </div>
    );
}