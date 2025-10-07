'use client';
import { useState } from 'react';

// --- Sub-komponen di dalam file yang sama untuk kerapian ---

function ProfileView({ userData, earnedBadgeIds, allBadges }) {
    if (!userData) return <p>Gagal memuat data profil.</p>;
    const progressPercentage = (userData.xp || 0) % 100;
    return (
        <div className="space-y-8 mt-6">
            <div className="card bg-base-100 shadow-xl border"><div className="card-body">
                <h2 className="card-title text-2xl">{userData.nama}</h2><p>{userData.posisi}</p>
                <div className="space-y-2 mt-4">
                    <div className="flex justify-between font-bold"><span className="text-teal-700">Level {userData.level}</span><span className="text-gray-500">{userData.xp} XP</span></div>
                    <progress className="progress progress-success w-full h-4" value={progressPercentage} max="100"></progress>
                    <div className="text-sm text-right text-gray-500">{progressPercentage} / 100 XP menuju Level selanjutnya</div>
                </div>
            </div></div>
            <div className="card bg-base-100 shadow-xl border"><div className="card-body">
                <h3 className="card-title mb-4">Badge Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {allBadges.map(badge => (
                        <div key={badge.id} className={`text-center p-4 rounded-lg ${!earnedBadgeIds.includes(badge.id) ? 'grayscale opacity-60 bg-gray-100' : ''}`}>
                            <span className="text-5xl">{earnedBadgeIds.includes(badge.id) ? '🏆' : '❓'}</span>
                            <h4 className="font-bold mt-2">{badge.nama_badge}</h4><p className="text-xs text-gray-500">{badge.deskripsi}</p>
                        </div>
                    ))}
                </div>
            </div></div>
        </div>
    );
}

function DirectoryView({ directoryData }) {
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    
    // Fungsi helper untuk format tanggal
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6 min-h-[60vh]">
            {/* Kolom Kiri: Daftar Karyawan (Tidak ada perubahan) */}
            <div className="md:col-span-1 border-r pr-6 max-h-[60vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-700 mb-4 sticky top-0 bg-white pb-2">Daftar Karyawan</h3>
                <div className="space-y-2">
                    {directoryData.map(emp => (
                        <button key={emp.id} onClick={() => setSelectedEmployee(emp)}
                            className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${selectedEmployee?.id === emp.id ? 'bg-teal-100 text-teal-800 font-bold' : 'hover:bg-gray-100'}`}>
                            {emp.nama}<span className="block text-xs text-gray-400">{emp.posisi}</span>
                        </button>
                    ))}
                </div>
            </div>
            {/* Kolom Kanan: Detail Training (Dengan Perbaikan) */}
            <div className="md:col-span-2 max-h-[60vh] overflow-y-auto">
                {selectedEmployee ? (
                     <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-[#033f3f] mb-4">{selectedEmployee.nama}</h2>
                        {selectedEmployee.karyawan_training_plan.length > 0 ? selectedEmployee.karyawan_training_plan.map(plan => (
                             <div key={plan.id} className="collapse collapse-arrow bg-base-100 border">
                                <input type="checkbox" />
                                <div className="collapse-title font-medium text-sm">
                                    {plan.training_programs.nama_program}
                                    {/* --- PERBAIKAN 1: WARNA STATUS DINAMIS --- */}
                                    <div className={`badge badge-sm ml-2 ${
                                        plan.status === 'Selesai' ? 'badge-success' :
                                        plan.status === 'Sedang Berjalan' ? 'badge-info' :
                                        plan.status === 'Menunggu Verifikasi' ? 'badge-warning' : 'badge-neutral'
                                    }`}>{plan.status}</div>
                                </div>
                                <div className="collapse-content">
                                     <ul className="list-disc list-inside text-sm text-gray-600 pl-4 space-y-2">
                                        {plan.training_progress_updates
                                            .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
                                            .map(progress => (
                                            <li key={progress.id}>
                                                {progress.deskripsi_progress}
                                                <span className="text-xs italic text-gray-400"> ({formatDate(progress.created_at)})</span>
                                                {/* --- PERBAIKAN 2: TOMBOL LIHAT BUKTI --- */}
                                                {progress.file_bukti_url && (
                                                    <a href={progress.file_bukti_url} target="_blank" rel="noopener noreferrer" className="link link-primary ml-2 text-xs">
                                                        Lihat Bukti
                                                    </a>
                                                )}
                                            </li>
                                        ))}
                                        {plan.training_progress_updates.length === 0 && <li className="italic">Belum ada progres.</li>}
                                    </ul>
                                </div>
                            </div>
                        )) : <p className="text-gray-500 italic">Karyawan ini belum memiliki rencana training.</p>}
                    </div>
                ) : <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg"><p className="text-gray-500">Pilih karyawan untuk melihat detail.</p></div>}
            </div>
        </div>
    );
}

function LeaderboardView({ leaderboardData }) {
    const getRankIcon = (rank) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank);
    return (
        <div className="overflow-x-auto mt-6">
            <table className="table w-full">
                <thead><tr><th>Peringkat</th><th>Nama Karyawan</th><th>Posisi</th><th className="text-center">Level</th><th className="text-center">Total XP</th></tr></thead>
                <tbody>
                    {leaderboardData.map((employee, index) => (
                        <tr key={employee.id} className="hover">
                            <th className="text-center text-lg font-bold">{getRankIcon(index + 1)}</th>
                            <td><div className="font-bold">{employee.nama}</div></td>
                            <td>{employee.posisi}</td>
                            <td className="text-center"><div className="badge badge-primary font-semibold">Level {employee.level}</div></td>
                            <td className="text-center font-bold text-success">{employee.xp} XP</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Komponen Utama
export default function CommunityClient({ userData, earnedBadgeIds, allBadges, directoryData, leaderboardData }) {
    return (
        <div className="space-y-10">
            {/* Bagian 1: Profil */}
            <ProfileView userData={userData} earnedBadgeIds={earnedBadgeIds} allBadges={allBadges} />
            {/* Bagian 2: Leaderboard */}
            <div>
                <h2 className="text-2xl font-bold text-[#6b1815] mb-4">Leaderboard</h2>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <LeaderboardView leaderboardData={leaderboardData} />
                </div>
            </div>
            {/* Bagian 3: Direktori */}
            <div>
                <h2 className="text-2xl font-bold text-[#6b1815] mb-4">Training Directory</h2>
                 <div className="bg-white p-6 rounded-xl shadow-md">
                    <DirectoryView directoryData={directoryData} />
                </div>
            </div>
        </div>
    );
}