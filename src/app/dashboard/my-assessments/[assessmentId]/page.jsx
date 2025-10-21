import { createClient } from '../../../../utils/supabase/server';
import { cookies } from 'next/headers';
import AssessmentFormComponent from '../../../../components/AssessmentFormComponent';
import { redirect } from 'next/navigation';

async function getFormData(assessmentId) {
    const supabase = createClient(cookies());
    const { data: assessmentTask } = await supabase
        .from('behavioral_assessors')
        .select('*, employee_to_assess:karyawan!employee_id(nama)')
        .eq('id', assessmentId)
        .single();
    
    if (!assessmentTask) return { error: 'Tugas penilaian tidak ditemukan.' };

    const { data: aspects } = await supabase.from('behavioral_aspects').select('*').eq('is_active', true);
    const { data: initialResults } = await supabase.from('behavioral_results').select('*').eq('assessor_relationship_id', assessmentId);

    return { assessmentTask, aspects: aspects || [], initialResults: initialResults || [], error: null };
}

export default async function AssessmentFormPage({ params }) {
    const { assessmentTask, aspects, initialResults, error } = await getFormData(params.assessmentId);

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020]">Form Penilaian Behavioral</h1>
            <p className="text-gray-600 mb-4">Anda sedang menilai: <span className="font-bold">{assessmentTask.employee_to_assess.nama}</span></p>
            <AssessmentFormComponent 
                assessmentTask={assessmentTask}
                aspects={aspects}
                initialResults={initialResults}
            />
        </div>
    );
}