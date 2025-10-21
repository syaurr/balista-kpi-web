'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
// --- PERBAIKAN: Path yang benar dari folder 'components' ---
import { submitBehavioralAssessment } from '../app/actions';

export default function AssessmentFormComponent({ assessmentTask, aspects, initialResults }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const initialScores = initialResults.reduce((acc, result) => {
        acc[result.aspect_id] = { score: result.score, comment: result.comment || '' };
        return acc;
    }, {});
    
    const [formData, setFormData] = useState(initialScores);

    const handleInputChange = (aspectId, type, value) => {
        setFormData(prev => ({
            ...prev,
            [aspectId]: { ...prev[aspectId], [type]: value }
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const formPayload = new FormData();
        formPayload.append('relationshipId', assessmentTask.id);
        aspects.forEach(aspect => {
            const aspectData = formData[aspect.id] || { score: 0, comment: '' };
            formPayload.append('aspectId', aspect.id);
            formPayload.append(`score_${aspect.id}`, aspectData.score);
            formPayload.append(`comment_${aspect.id}`, aspectData.comment);
        });

        const result = await submitBehavioralAssessment(formPayload);

        if (result.error) {
            alert(`Error: ${result.error}`);
        } else {
            alert(result.success);
            router.push('/dashboard/my-assessments');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-8">
            {aspects.map(aspect => (
                <div key={aspect.id} className="p-4 border rounded-lg">
                    <h3 className="font-bold text-lg">{aspect.nama_aspek}</h3>
                    <p className="text-sm text-gray-500 mb-4">{aspect.deskripsi}</p>
                    
                    <div className="flex items-center gap-4">
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={formData[aspect.id]?.score || 0}
                            onChange={(e) => handleInputChange(aspect.id, 'score', parseInt(e.target.value, 10))}
                            className="range range-primary" 
                        />
                        <div className="font-bold text-xl w-16 text-center">
                            {formData[aspect.id]?.score || 0}
                        </div>
                    </div>

                    <label className="label mt-4"><span className="label-text font-medium">Komentar (Opsional)</span></label>
                    <textarea 
                        className="textarea textarea-bordered w-full"
                        placeholder="Berikan contoh spesifik atau masukan pengembangan..."
                        value={formData[aspect.id]?.comment || ''}
                        onChange={(e) => handleInputChange(aspect.id, 'comment', e.target.value)}
                    ></textarea>
                </div>
            ))}
            <div className="flex justify-end pt-4">
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan Penilaian'}
                </button>
            </div>
        </form>
    );
}