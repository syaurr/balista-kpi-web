'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Modal from './Modal'; 
import CompanyValuesClient from './CompanyValuesClient'; 

export default function MyAssessmentsClient({ tasks }) {
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    useEffect(() => {
        const hasSeenInfo = localStorage.getItem('hasSeenBehavioralIntro_v1');
        if (!hasSeenInfo) {
            setIsInfoModalOpen(true);
        }
    }, []);

    const handleCloseModal = () => {
        localStorage.setItem('hasSeenBehavioralIntro_v1', 'true');
        setIsInfoModalOpen(false);
    };
    
    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Nama yang Dinilai</th>
                                <th>Tipe Penilaian</th>
                                <th>Periode</th>
                                <th className="text-center">Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(task => {
                                const isCompleted = task.behavioral_results.length > 0;
                                const isPeriodOpen = task.period.status === 'Open';
                                
                                return (
                                    <tr key={task.id} className="hover">
                                        <td>
                                            <div className="font-bold">{task.employee_to_assess.nama}</div>
                                            <div className="text-sm opacity-70">{task.employee_to_assess.posisi}</div>
                                        </td>
                                        <td><span className="badge badge-ghost">{task.assessor_type}</span></td>
                                        <td>{task.period.nama_periode}</td>
                                        <td className="text-center">
                                            {isCompleted ? <div className="badge badge-success">Selesai</div> : <div className="badge badge-warning">Menunggu</div>}
                                        </td>
                                        
                                        {/* --- AWAL PERBAIKAN --- */}
                                        <td>
                                            {/* Hanya tampilkan tombol aksi JIKA periode masih 'Open' */}
                                            {isPeriodOpen && (
                                                isCompleted ? (
                                                    // Jika sudah selesai, tampilkan tombol 'Edit'
                                                    <Link href={`/dashboard/my-assessments/${task.id}`} className="btn btn-sm btn-outline">
                                                        Edit Penilaian
                                                    </Link>
                                                ) : (
                                                    // Jika belum selesai, tampilkan tombol 'Isi'
                                                    <Link href={`/dashboard/my-assessments/${task.id}`} className="btn btn-sm btn-primary">
                                                        Isi Penilaian
                                                    </Link>
                                                )
                                            )}
                                        </td>
                                        {/* --- AKHIR PERBAIKAN --- */}
                                    </tr>
                                );
                            })}
                            {tasks.length === 0 && (
                                <tr><td colSpan="5" className="text-center italic py-4">Tidak ada tugas penilaian untuk Anda saat ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ... (Modal Pop-up Infografis tidak berubah) ... */}
            {isInfoModalOpen && (
                <Modal isOpen={isInfoModalOpen} onClose={handleCloseModal} title="Selamat Datang di Penilaian Behavioral">
                    {/* ... (isi modal) ... */}
                </Modal>
            )}
        </>
    );
}