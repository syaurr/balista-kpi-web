// app/components/KpiDetailDialog.jsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchKpiDetailsForArea, fetchAreaNote, saveAreaNote } from '../app/actions';
import Modal from './Modal';

export default function KpiDetailDialog({ areaName, onClose }) {
    const searchParams = useSearchParams();
    const karyawanId = searchParams.get('karyawanId');
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');

    const [kpiDetails, setKpiDetails] = useState([]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (karyawanId && bulan && tahun && areaName) {
            const periode = `${new Date(0, bulan - 1).toLocaleString('id-ID', { month: 'long' })} ${tahun}`;
            
            const loadData = async () => {
                setLoading(true);
                const [detailsData, noteData] = await Promise.all([
                    fetchKpiDetailsForArea(karyawanId, periode, areaName),
                    fetchAreaNote(karyawanId, periode, areaName)
                ]);
                setKpiDetails(detailsData);
                setNote(noteData);
                setLoading(false);
            };
            loadData();
        }
    }, [karyawanId, bulan, tahun, areaName]);

    const handleSaveNote = async () => {
        const periode = `${new Date(0, bulan - 1).toLocaleString('id-ID', { month: 'long' })} ${tahun}`;
        const result = await saveAreaNote(karyawanId, periode, areaName, note);
        if (result.success) {
            setMessage(result.success);
            setTimeout(() => setMessage(''), 2000); // Hilangkan pesan setelah 2 detik
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Detail Kinerja Area: ${areaName}`}>
            {loading ? (
                <div className="text-center p-8">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-gray-800 mb-2">KPI di Area Ini:</h4>
                        <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md space-y-3">
                            {kpiDetails.length > 0 ? kpiDetails.map((item, index) => (
                                <div key={index} className="border-b pb-2 last:border-b-0">
                                    <p className="font-semibold text-gray-700">{item.kpi_master.kpi_deskripsi}</p>
                                    <p className="text-sm text-gray-500">Skor Diberikan: <span className="font-bold text-blue-600">{item.nilai}</span></p>
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
                            placeholder="Tuliskan evaluasi spesifik untuk area ini..."
                        />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <button onClick={handleSaveNote} className="btn btn-primary">Simpan Catatan</button>
                        {message && <p className="text-sm text-green-600 font-semibold animate-pulse">{message}</p>}
                    </div>
                </div>
            )}
        </Modal>
    );
}