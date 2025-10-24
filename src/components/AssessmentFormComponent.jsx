'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { submitBehavioralAssessment } from '../app/actions';

export default function AssessmentFormComponent({ assessmentTask, aspects, initialResults }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const initialScores = initialResults.reduce((acc, result) => {
        acc[result.aspect_id] = { score: result.score, comment: result.comment || '' };
        return acc;
    }, {});
    
    const [formData, setFormData] = useState(initialScores);

    // --- AWAL PERBAIKAN ---
    const handleInputChange = (aspectId, type, value) => {
        setFormData(prev => ({
            ...prev,
            [aspectId]: {
                // Ambil nilai skor sebelumnya, atau default ke 0
                score: prev[aspectId]?.score || 0,
                // Ambil nilai komentar sebelumnya, atau default ke string kosong
                comment: prev[aspectId]?.comment || '',
                // Timpa nilai yang sedang diubah (baik 'score' atau 'comment')
                [type]: value
            }
        }));
    };
    // --- AKHIR PERBAIKAN ---

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const formPayload = new FormData();
        formPayload.append('relationshipId', assessmentTask.id);
        aspects.forEach(aspect => {
            // Logika ini sekarang aman karena handleInputChange sudah memastikan
            // 'score' dan 'comment' selalu ada.
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
            
            <div className="alert bg-teal-50 border border-teal-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-teal-600 shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                    <h3 className="font-bold text-teal-800">Panduan Skala Penilaian</h3>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                        <li><span className="font-semibold">90-100:</span> Sangat Baik</li>
                        <li><span className="font-semibold">76-89:</span> Baik</li>
                        <li><span className="font-semibold">70-75:</span> Cukup</li>
                        <li><span className="font-semibold">60-69:</span> Kurang</li>
                        <li><span className="font-semibold">1-59:</span> Sangat Kurang</li>
                    </ul>
                </div>
            </div>

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
                        // Logika ini juga sekarang aman
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