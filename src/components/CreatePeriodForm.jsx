'use client';

import { useState } from 'react';
import { createAssessmentPeriod } from '../app/actions';

export default function CreatePeriodForm({ onFinished }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await createAssessmentPeriod(formData);
        
        if (result.error) {
            alert(`Error: ${result.error}`);
        } else {
            alert(result.success);
            onFinished(); // Panggil fungsi onFinished untuk menutup modal
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="label"><span className="label-text">Nama Periode</span></label>
                <input type="text" name="nama_periode" className="input input-bordered w-full" placeholder="Contoh: Kuartal 4 2025" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label"><span className="label-text">Tanggal Mulai</span></label>
                    <input type="date" name="start_date" className="input input-bordered w-full" required />
                </div>
                <div>
                    <label className="label"><span className="label-text">Tanggal Berakhir</span></label>
                    <input type="date" name="end_date" className="input input-bordered w-full" required />
                </div>
            </div>
            <div className="pt-4 flex justify-end">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Memproses...' : 'Buat & Generate Penilai'}
                </button>
            </div>
        </form>
    );
}