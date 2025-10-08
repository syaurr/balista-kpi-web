// Hapus import 'generateTrainingRecommendations' dari sini
import ClientPage from './ClientPage';

export default function SystemActionsPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-[#022020] mb-6">Aksi Sistem</h1>
            <p className="text-gray-600 mb-8">
                Jalankan proses otomatis untuk seluruh sistem dari halaman ini.
            </p>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-[#6b1815] mb-4">Rekomendasi Training Otomatis</h2>
                <p className="mb-4">
                    Klik tombol di bawah untuk menganalisis kinerja semua karyawan pada periode yang dipilih dan secara otomatis
                    menambahkan training yang relevan ke dalam "Learning & Development Plan" mereka.
                </p>
                {/* --- PERBAIKAN: Panggil komponen tanpa prop 'action' --- */}
                <ClientPage />
            </div>
        </div>
    );
}