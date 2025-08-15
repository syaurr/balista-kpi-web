'use client';
import { useEffect, useState } from 'react';
import { fetchKpiDetailsForArea, fetchAreaNote } from '../app/actions';

export default function KpiDetailDialog({ areaName, onClose }) {
    const [details, setDetails] = useState([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col" style={{height: '90vh'}}>
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-[#6b1815]">Detail KPI untuk Area: {areaName}</h2>
                </div>
                
                {/* --- AWAL PERUBAHAN: Gabungkan Tabel & Catatan --- */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Detail KPI:</h3>
                        {loading ? <p>Loading...</p> : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">No</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama KPI</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">Frekuensi</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Skor Aktual</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Bobot</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Nilai Akhir</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {details.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-4 text-center text-sm">{index + 1}</td>
                                            <td className="px-4 py-4 text-sm text-gray-700">{item.kpi_deskripsi}</td>
                                            <td className="px-4 py-4 text-sm">{item.frekuensi}</td>
                                            <td className="px-4 py-4 text-sm text-center">{item.skor_aktual}</td>
                                            <td className="px-4 py-4 text-sm text-center">{item.bobot}%</td>
                                            <td className="px-4 py-4 text-sm text-center font-semibold">{parseFloat(item.nilai_akhir).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Catatan/Rekomendasi untuk Area Ini:</h3>
                        <textarea 
                            value={note}
                            rows="5"
                            className="w-full border rounded-md p-2 bg-gray-100"
                            placeholder="Tidak ada catatan."
                            readOnly={true} // <-- DIKUNCI DI SINI
                        />
                    </div>
                </div>
                {/* --- AKHIR PERUBAHAN --- */}

                <div className="p-4 bg-gray-100 flex justify-end">
                    <button onClick={() => onClose(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">
                        Tutup
                    </button>
                    {/* Tombol Simpan Dihapus Total */}
                </div>
            </div>
        </div>
    );
}