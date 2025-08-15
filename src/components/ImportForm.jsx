'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // <-- 1. Import useRouter
import { importFromExcel } from '../app/actions';

export default function ImportForm() {
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter(); // <-- 2. Inisialisasi router

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const result = await importFromExcel(formData);

        if (result?.error) {
            setMessage({ type: 'error', text: result.error });
        } else if (result?.success) {
            setMessage({ type: 'success', text: result.success });
            event.target.reset();
            
            // --- 3. INI DIA KUNCI PERBAIKANNYA ---
            // Memerintahkan Next.js untuk memuat ulang data di halaman saat ini
            router.refresh(); 
        }
        
        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-[#6b1815] mb-4">Impor dari Excel</h3>
            <form onSubmit={handleSubmit}>
                <input 
                    type="file" 
                    name="excelFile" 
                    accept=".xlsx, .xls" 
                    className="file-input file-input-bordered file-input-sm w-full max-w-xs" 
                    required 
                />
                <button 
                    type="submit" 
                    className="btn btn-sm btn-primary ml-2"
                    disabled={loading}
                >
                    {loading ? 'Mengimpor...' : 'Impor'}
                </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
                Pastikan kolom Excel: Nama Program, Penyedia, Topik Utama, Link Akses/Informasi Program, Biaya, Status, Tanggal Mulai, Tanggal Berakhir, Posisi (dipisah koma).
            </p>
            {message && (
                <div className={`mt-4 p-3 rounded-md text-sm ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}