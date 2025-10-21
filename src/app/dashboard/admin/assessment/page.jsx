export const dynamic = 'force-dynamic';
import AssessmentClient from '../../../../components/AssessmentClient';
import { fetchAssessmentData } from '../../../../app/actions';
import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';

async function getEmployeeList() {
    const supabase = createClient(cookies());
    // --- PERBAIKAN: Hanya ambil karyawan yang bisa dinilai ---
    const { data: employees } = await supabase
        .from('karyawan')
        .select('id, nama, posisi')
        .neq('tipe_akun', 'Admin Non-Penilaian') // <-- KECUALIKAN TIPE AKUN KHUSUS
        .order('nama');
    return employees || [];
}

export default async function AssessmentPage({ searchParams }) {
    const selectedEmployeeId = searchParams.karyawanId || null;
    const month = searchParams.bulan || (new Date().getMonth() + 1).toString().padStart(2, '0');
    const year = searchParams.tahun || new Date().getFullYear().toString();
    
    let periode = null;
    if (selectedEmployeeId) {
        periode = `${new Date(0, parseInt(month, 10) - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;
    }

    const employees = await getEmployeeList();
    let initialAssessmentData = null;

    if (selectedEmployeeId && periode) {
        initialAssessmentData = await fetchAssessmentData(selectedEmployeeId, periode);
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Input Penilaian KPI Karyawan</h1>
            <AssessmentClient 
                employees={employees} 
                initialAssessmentData={initialAssessmentData}
            />
        </div>
    );
}