'use client';

import { useState } from 'react';

export default function ClientPage({ action }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [details, setDetails] = useState([]); // <-- State baru untuk menampung detail
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [year, setYear] = useState(new Date().getFullYear().toString());

    const handleGenerate = async () => {
        setLoading(true);
        setMessage(null);
        setDetails([]); // <-- Reset detail setiap kali dijalankan

        const monthName = new Date(0, parseInt(month, 10) - 1).toLocaleString('id-ID', { month: 'long' });
        const periode = `${monthName} ${year}`;
        
        const confirm = window.confirm(`Anda akan membuat rekomendasi training untuk semua karyawan berdasarkan kinerja periode "${periode}". Proses ini tidak dapat dibatalkan. Lanjutkan?`);
        
        if (confirm) {
            const result = await action(periode);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: result.success });
                if (result.details) setDetails(result.details); // <-- Simpan detail ke state
            }
        }
        setLoading(false);
    };

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: (i + 1).toString(),
        label: new Date(0, i).toLocaleString('id-ID', { month: 'long' })
    }));

    return (
        <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
                <label className="font-semibold">Pilih Periode Kinerja:</label>
                <select value={month} onChange={e => setMonth(e.target.value)} className="select select-bordered select-sm">
                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={year} onChange={e => setYear(e.target.value)} className="select select-bordered select-sm">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            
            <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">
                {loading ? 'Memproses...' : 'Jalankan Proses Rekomendasi'}
            </button>
            
            {message && (
                <div className={`mt-4 p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* --- TAMPILAN DETAIL BARU --- */}
            {details.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-bold mb-2">Detail Rekomendasi yang Dibuat:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 max-h-48 overflow-y-auto">
                        {details.map((detail, index) => <li key={index}>{detail}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
}
