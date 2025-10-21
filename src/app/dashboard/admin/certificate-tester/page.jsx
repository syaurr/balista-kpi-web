'use client';

import { useState } from 'react';
import { invokeCertificateGenerator } from '../../../actions';

export default function CertificateTesterPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setResult(null);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const employeeName = formData.get('employeeName');
        const aspectName = formData.get('aspectName');
        const period = formData.get('period');
        
        const response = await invokeCertificateGenerator(employeeName, aspectName, period);

        if (response.error) {
            setError(response.error);
        } else {
            setResult(response.success.certificateUrl);
        }
        setLoading(false);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Uji Coba Pembangkit Sertifikat</h1>
            <div className="card bg-white shadow-xl border">
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label"><span className="label-text">Nama Karyawan</span></label>
                            <input type="text" name="employeeName" defaultValue="Tasya Urfah" className="input input-bordered w-full" required />
                        </div>
                         <div>
                            <label className="label"><span className="label-text">Nama Aspek</span></label>
                            <input type="text" name="aspectName" defaultValue="Inovasi Berkelanjutan" className="input input-bordered w-full" required />
                        </div>
                         <div>
                            <label className="label"><span className="label-text">Periode</span></label>
                            <input type="text" name="period" defaultValue="Kuartal 4 2025" className="input input-bordered w-full" required />
                        </div>
                        <div className="card-actions justify-end">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Membuat Sertifikat...' : 'Generate Sertifikat'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {result && (
                <div className="alert alert-success mt-6">
                    <h3 className="font-bold">Berhasil!</h3>
                    <p>Sertifikat berhasil dibuat. Buka link di bawah ini:</p>
                    <a href={result} target="_blank" rel="noopener noreferrer" className="link">{result}</a>
                </div>
            )}
            {error && (
                <div className="alert alert-error mt-6">
                    <h3 className="font-bold">Gagal!</h3>
                    <p>Pesan Error dari Server:</p>
                    <pre className="text-xs whitespace-pre-wrap">{error}</pre>
                </div>
            )}
        </div>
    );
}