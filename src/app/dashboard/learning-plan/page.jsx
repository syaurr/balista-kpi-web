'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../../utils/supabase/client'; // <-- Gunakan client
import { addTrainingProgress, updateTrainingPlanStatus } from '../../actions';
import TrainingPlanItem from '../../../components/TrainingPlanItem'; // <-- Import komponen anak

export default function LearningPlanPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // --- State Management ---
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(searchParams.get('bulan') || (new Date().getMonth() + 1).toString());
    const [year, setYear] = useState(searchParams.get('tahun') || new Date().getFullYear().toString());

    const periode = useMemo(() => {
        return `${new Date(0, parseInt(month, 10) - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`;
    }, [month, year]);

    // --- Pengambilan Data di Sisi Klien ---
    useEffect(() => {
        const supabase = createClient();
        
        async function getLearningPlanData() {
            setLoading(true);
            
            // 1. Dapatkan user yang login
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                router.push('/login');
                return;
            }
            
            // 2. Dapatkan profil karyawan untuk ID yang benar
            const { data: karyawan } = await supabase.from('karyawan').select('id').eq('email', user.email).single();
            if (!karyawan) {
                setLoading(false);
                setPlans([]);
                return;
            }
            
            // 3. Ambil data rencana training menggunakan ID yang benar dan periode saat ini
            const { data: fetchedPlans, error } = await supabase
                .from('karyawan_training_plan')
                .select(`*, training_programs (*), training_progress_updates (*, created_at)`)
                .eq('karyawan_id', karyawan.id)
                .eq('periode', periode)
                .not('status', 'in', '("Selesai", "Kedaluwarsa", "Ditolak")')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching learning plan on client:", error);
                setPlans([]);
            } else {
                setPlans(fetchedPlans || []);
            }
            setLoading(false);
        }

        getLearningPlanData();
    }, [periode, router]); // <-- Jalankan ulang setiap kali 'periode' berubah

    const handlePeriodChange = () => {
        router.push(`/dashboard/learning-plan?bulan=${month}&tahun=${year}`);
    };
    
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
    }));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#022020]">Learning & Development Plan</h1>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-md">
                    <span className="font-semibold text-sm">Lihat Periode:</span>
                    <select value={month} onChange={e => setMonth(e.target.value)} className="select select-bordered select-sm">
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(e.target.value)} className="select select-bordered select-sm">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={handlePeriodChange} className="btn btn-sm btn-primary">Lihat</button>
                </div>
            </div>
            <p className="text-gray-600 mb-8">
                Lihat training yang direkomendasikan untuk Anda dan laporkan progres Anda di sini.
            </p>
            
            <div className="space-y-6">
                {loading ? (
                    <div className="text-center p-8"><span className="loading loading-spinner loading-lg"></span></div>
                ) : plans.length > 0 ? (
                    plans.map(plan => (
                        <TrainingPlanItem key={plan.id} plan={plan} />
                    ))
                ) : (
                    <div className="bg-white p-8 rounded-xl shadow-md text-center">
                        <h3 className="text-lg font-bold text-gray-700">Belum Ada Rencana Pengembangan</h3>
                        <p className="text-gray-500 mt-2">Tidak ada training yang 'Disarankan' atau 'Sedang Berjalan' untuk Anda pada periode ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
}