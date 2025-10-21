'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BehavioralRadarChart from './BehavioralRadarChart';

// --- KOMPONEN UTAMA DASHBOARD ---
export default function BehavioralDashboardClient({ user, initialData, allPeriods, activePeriod, error }) {
    const router = useRouter();
    const [selectedPeriod, setSelectedPeriod] = useState(activePeriod);
    
    const { behavioralScores, pendingTaskCount, certificates, comments } = initialData || {};

    const handlePeriodChange = () => {
        router.push(`/dashboard/behavioral?periode=${selectedPeriod}`);
    };

    const totalBehavioralScore = useMemo(() => {
        if (!behavioralScores || behavioralScores.length === 0) return 0;
        const sum = behavioralScores.reduce((acc, item) => acc + item.final_score, 0);
        return sum / behavioralScores.length;
    }, [behavioralScores]);

    // --- AWAL PERBAIKAN: Mengelompokkan Komentar per Aspek ---
    const groupedComments = useMemo(() => {
        // --- PERBAIKAN: Filter juga untuk string "undefined" ---
        const validComments = (comments || []).filter(c => 
            c.comment && 
            c.comment.trim() !== '' && 
            c.comment.trim().toLowerCase() !== 'undefined'
        );
        
        return validComments.reduce((acc, comment) => {
            const aspectName = comment.behavioral_aspects?.nama_aspek || 'Komentar Lainnya';
            
            if (!acc[aspectName]) {
                acc[aspectName] = [];
            }
            
            acc[aspectName].push(comment.comment);
            return acc;
        }, {});

    }, [comments]);
    // --- AKHIR PERBAIKAN ---

    if (error) {
        return <div className="alert alert-error">{error}</div>
    }

    return (
        <div className="space-y-8">
            {/* Filter Periode */}
            <div className="flex justify-end items-center">
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-md">
                    <span className="font-semibold text-sm">Lihat Periode:</span>
                    <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="select select-bordered select-sm">
                        {allPeriods.map(p => <option key={p.nama_periode} value={p.nama_periode}>{p.nama_periode}</option>)}
                    </select>
                    <button onClick={handlePeriodChange} className="btn btn-sm btn-primary">Lihat</button>
                </div>
            </div>

            {/* Notifikasi Tugas */}
            {pendingTaskCount > 0 && (
                <div className="alert alert-warning shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <h3 className="font-bold">Tugas Penilaian Menunggu!</h3>
                        <div className="text-xs">Anda memiliki {pendingTaskCount} penilaian behavioral yang perlu diselesaikan.</div>
                    </div>
                    <Link href="/dashboard/my-assessments" className="btn btn-sm">Lihat Tugas</Link>
                </div>
            )}

            {/* Panel Skor Behavioral */}
            <div className="card bg-white shadow-xl border">
                <div className="card-body">
                    <h2 className="card-title text-[#6b1815]">Skor Penilaian Behavioral</h2>
                    
                    <div className="text-center mb-4">
                        <div className="text-gray-500">Skor Rata-rata Total</div>
                        <div className="text-6xl font-bold text-teal-600">{totalBehavioralScore.toFixed(2)}</div>
                    </div>
                    
                    {behavioralScores && behavioralScores.length > 0 ? (
                        <div className="w-full h-96 md:h-[500px]">
                            {/* Memanggil komponen chart yang sudah di-import */}
                            <BehavioralRadarChart scores={behavioralScores} />
                        </div>
                    ) : (
                        <p className="italic text-gray-500 text-center py-16">
                            Hasil akan muncul setelah periode penilaian ditutup.
                        </p>
                    )}
                </div>
            </div>

            <div className="card bg-white shadow-xl border">
                <div className="card-body">
                    <h2 className="card-title text-[#6b1815]">Masukan Anonim per Aspek</h2>
                    {Object.keys(groupedComments).length > 0 ? (
                        <div className="max-h-96 overflow-y-auto space-y-6 pr-2">
                            {Object.entries(groupedComments).map(([aspectName, commentList]) => (
                                <div key={aspectName}>
                                    <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">{aspectName}</h4>
                                    <div className="space-y-2">
                                        {commentList.map((comment, index) => (
                                            <div key={index} className="chat chat-start">
                                                <div className="chat-bubble bg-gray-100 text-gray-800">
                                                    {comment}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="italic text-gray-500">Anda belum menerima komentar atau masukan untuk periode ini.</p>
                    )}
                </div>
            </div>

            {/* Panel Sertifikat */}
            <div className="card bg-white shadow-xl border">
                <div className="card-body">
                    <h2 className="card-title text-[#6b1815]">Pencapaian & Sertifikat</h2>
                    {certificates && certificates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {certificates.map(cert => (
                                <div key={cert.id} className="p-4 bg-teal-50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-teal-800">Skor Tertinggi:</p>
                                        <p className="text-sm">{cert.behavioral_aspects.nama_aspek}</p>
                                    </div>
                                    <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                                        Unduh
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="italic text-gray-500">Anda belum mendapatkan sertifikat pencapaian untuk periode ini.</p>
                    )}
                </div>
            </div>
        </div>
    );
}