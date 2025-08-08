'use client';
import { useEffect, useState } from 'react';
import { fetchKpiDetailsForArea, fetchAreaNote, saveAreaNote } from '../app/actions';

export default function KpiDetailDialog({ areaName, onClose, userRole }) {
    const [details, setDetails] = useState([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);

    const isAdmin = userRole === 'Admin';

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [detailsResult, noteResult] = await Promise.all([
                fetchKpiDetailsForArea(areaName),
                fetchAreaNote(areaName)
            ]);
            
            if (!detailsResult.error) setDetails(detailsResult.data);
            setNote(noteResult.note);
            setLoading(false);
        }
        loadData();
    }, [areaName]);

    const handleSaveNote = async () => {
        const { success, error } = await saveAreaNote(areaName, note);
        if (success) {
            alert('Catatan berhasil disimpan!');
            onClose(true);
        } else {
            alert('Error: ' + error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col" style={{height: '90vh'}}>
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-[#6b1815]">Detail & Catatan untuk Area: {areaName}</h2>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {/* ... (Tabel detail tidak berubah) ... */}
                </div>
                <div className="p-6 border-t bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catatan/Rekomendasi untuk Area Ini</label>
                    <textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows="4"
                        className="w-full border rounded-md p-2"
                        placeholder={isAdmin ? "Tuliskan catatan atau rekomendasi..." : "Tidak ada catatan."}
                        readOnly={!isAdmin} // <-- KUNCI PERBAIKAN DI SINI
                    />
                </div>
                <div className="p-4 bg-gray-100 flex justify-end space-x-3">
                    <button onClick={() => onClose(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Tutup</button>
                    {/* Tombol Simpan hanya muncul untuk Admin */}
                    {isAdmin && (
                        <button onClick={handleSaveNote} className="bg-[#033f3f] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#022c2c]">
                            Simpan Catatan
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}