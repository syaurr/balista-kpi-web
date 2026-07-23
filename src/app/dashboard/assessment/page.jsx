// app/dashboard/admin/assessment/page.tsx
export const dynamic = 'force-dynamic';
import AssessmentClient from '../../../components/AssessmentClient';
import { getEmployeesToAssess, fetchAssessmentData } from '../../actions';
import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';

async function getEmployeeList(supabase, currentUser) {
    let query = supabase
        .from('karyawan')
        .select('id, nama, posisi, superior_id, superior_id_2')
        .neq('tipe_akun', 'Admin Non-Penilaian');

    // Jika bukan Super Admin, filter hanya bawahan langsung atau bawahan kedua
    if (currentUser.role !== 'Admin') {
        query = query.or(`superior_id.eq.${currentUser.id},superior_id_2.eq.${currentUser.id}`);
    }

    const { data: employees } = await query.order('nama');
    return employees || [];
}

// src/app/dashboard/assessment/page.jsx

// ... import lainnya

export default async function AssessmentPage({ searchParams }) {
    const sParams = await searchParams;
    const selectedEmployeeId = sParams.karyawanId || null;
    const month = sParams.bulan || null;
    const year = sParams.tahun || null;

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) redirect('/login');

    const employees = await getEmployeesToAssess();
    let initialAssessmentData = null;

    if (selectedEmployeeId && month && year) {
        const periode = `${new Date(0, parseInt(month, 10) - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;
        
        // Panggil data
        const data = await fetchAssessmentData(selectedEmployeeId, periode);
        
        // --- PERBAIKAN: Pastikan objek tidak kosong agar Client tidak crash ---
        if (data && data.kpis) {
            initialAssessmentData = data;
        } else {
            // Jika data ditemukan tapi kpis kosong, berikan array kosong sebagai fallback
            initialAssessmentData = {
                kpis: [],
                scores: {},
                generalNote: '',
                recommendations: [],
                gapAnalysis: {},
                hasConflict: false
            };
        }
    }

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Penilaian Kinerja Tim</h1>
            {/* Pastikan initialAssessmentData dikirim sebagai null jika memang tidak ada pilihan */}
            <AssessmentClient 
                employees={employees} 
                initialAssessmentData={initialAssessmentData}
            />
        </div>
    );
}