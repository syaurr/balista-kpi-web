'use client';

import { useState, useEffect } from 'react';
import { fetchKpiDetailsForArea, fetchAreaNote, saveAreaNote } from '../app/actions';
import Modal from './Modal';

// --- PERBAIKAN: Terima 'karyawanId' dan 'periode' dari props, hapus 'useSearchParams' ---
export default function KpiDetailDialog({ areaName, onClose, userRole, karyawanId, periode }) {
    const [kpiDetails, setKpiDetails] = useState([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const isAdmin = userRole?.toLowerCase() === 'admin';

    useEffect(() => {
        // Logika sekarang bergantung pada props, bukan URL
        if (karyawanId && periode && areaName) {
            const loadData = async () => {
                setLoading(true);
                const [detailsResult, noteResult] = await Promise.all([
                    fetchKpiDetailsForArea(karyawanId, periode, areaName),
                    fetchAreaNote(karyawanId, periode, areaName)
                ]);

                if (detailsResult && !detailsResult.error) setKpiDetails(detailsResult.data || []);
                if (noteResult && !noteResult.error) setNote(noteResult.note || '');
                
                setLoading(false);
            };
            loadData();
        } else {
            setLoading(false);
            console.warn("Props (karyawanId, periode, areaName) tidak lengkap.");
        }
    }, [karyawanId, periode, areaName]); // <-- Dependency sekarang adalah props

    const handleSaveNote = async () => {
        const result = await saveAreaNote(karyawanId, periode, areaName, note);
        if (result.success) {
            setMessage(result.success);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <Modal isOpen={true} onClose={() => onClose(false)} title={`Detail Kinerja Area: ${areaName}`}>
            {loading ? (
                <div className="text-center p-8"><span className="loading loading-spinner loading-lg"></span></div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-gray-800 mb-2">KPI di Area Ini:</h4>
                        <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md space-y-3">
                            {kpiDetails.length > 0 ? kpiDetails.map((item, index) => (
                                <div key={index} className="border-b pb-2 last:border-b-0">
                                    <p className="font-semibold text-gray-700">{item.kpi_deskripsi}</p>
                                    <p className="text-sm text-gray-500">Skor Diberikan: <span className="font-bold text-blue-600">{item.skor_aktual}</span></p>
                                </div>
                            )) : <p className="text-sm italic text-gray-500">Tidak ada KPI yang dinilai pada periode ini untuk area ini.</p>}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 mb-2">Catatan & Evaluasi Area:</h4>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows="4"
                            className="textarea textarea-bordered w-full"
                            placeholder={isAdmin ? "Tuliskan evaluasi..." : "Tidak ada catatan dari penilai."}
                            readOnly={!isAdmin}
                        />
                    </div>
                    {isAdmin && (
                        <div className="flex justify-between items-center pt-2">
                            <button onClick={handleSaveNote} className="btn btn-primary">Simpan Catatan</button>
                            {message && <p className="text-sm text-green-600 font-semibold">{message}</p>}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}