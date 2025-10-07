import Link from 'next/link';

// Komponen untuk kartu menu
function AdminMenuCard({ href, title, description, icon }) {
    return (
        <Link href={href} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center space-x-4">
                <div className="bg-teal-100 p-3 rounded-full">
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[#033f3f] group-hover:text-teal-600">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
            </div>
        </Link>
    );
}

export default function AdminDashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 mb-8">Selamat datang di pusat kendali Sistem Kinerja Karyawan.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AdminMenuCard 
                    href="/dashboard/admin/kpi-management"
                    title="Manajemen Master KPI"
                    description="Tambah, edit, atau nonaktifkan KPI untuk semua posisi."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                />
                <AdminMenuCard 
                    href="/dashboard/admin/assessment"
                    title="Input Penilaian KPI"
                    description="Isi dan perbarui skor KPI bulanan untuk setiap karyawan."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                />
                <AdminMenuCard 
                    href="/dashboard/admin/training"
                    title="Manajemen Training"
                    description="Kelola semua program training yang tersedia untuk karyawan."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
                />
                {/* --- MENU BARU 1 --- */}
                <AdminMenuCard 
                    href="/dashboard/admin/training-oversight"
                    title="Monitoring Training"
                    description="Pantau dan verifikasi progres training seluruh karyawan."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                />
                {/* --- MENU BARU 2 --- */}
                <AdminMenuCard 
                    href="/dashboard/admin/system-actions"
                    title="Aksi Sistem"
                    description="Jalankan proses otomatis seperti rekomendasi training bulanan."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                />
                 <AdminMenuCard 
                    href="/dashboard/admin/users"
                    title="Manajemen Pengguna"
                    description="Kelola data karyawan dan peran akses mereka di sistem."
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 004.773-9.805L17.5 7.5a2.5 2.5 0 015 0v.5a3.5 3.5 0 01-3.5 3.5h-.5a3.5 3.5 0 01-3.5-3.5V7.5" /></svg>}
                />
            </div>
        </div>
    );
}