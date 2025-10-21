'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Modal from './Modal'; // Import Modal
import CompanyValuesClient from './CompanyValuesClient'; // Import "Infografis" kita

export default function MyAssessmentsClient({ tasks }) {
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    // Cek localStorage saat komponen dimuat
    useEffect(() => {
        const hasSeenInfo = localStorage.getItem('hasSeenBehavioralIntro_v1');
        if (!hasSeenInfo) {
            // Jika belum pernah lihat, tampilkan modal
            setIsInfoModalOpen(true);
        }
    }, []); // Array kosong berarti ini hanya berjalan satu kali saat load

    const handleCloseModal = () => {
        // Tandai bahwa user sudah melihat info ini
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
                                        <td>
                                            {/* --- PERBAIKAN: Tombol hanya muncul jika belum selesai DAN periode masih Open --- */}
                                            {!isCompleted && isPeriodOpen && (
                                                <Link href={`/dashboard/my-assessments/${task.id}`} className="btn btn-sm btn-primary">
                                                    Isi Penilaian
                                                </Link>
                                            )}
                                        </td>
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

            {isInfoModalOpen && (
                <Modal isOpen={isInfoModalOpen} onClose={handleCloseModal} title="Selamat Datang di Penilaian Behavioral">
                    <p className="text-gray-600 mb-4">Sebelum memulai, mohon pahami nilai-nilai inti (ALTRI) dan nilai-nilai merk yang menjadi dasar penilaian kita.</p>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <CompanyValuesClient />
                    </div>
                    <div className="mt-6 text-right">
                        <button className="btn btn-primary" onClick={handleCloseModal}>
                            Saya Mengerti
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}