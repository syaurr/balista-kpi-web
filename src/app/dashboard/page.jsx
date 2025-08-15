import { redirect } from 'next/navigation';
import { getDashboardData } from '../../lib/data';
import SignOutButton from '../../components/SignOutButton';
import ScoreCard from '../../components/ScoreCard';
import AreaDonutChart from '../../components/AreaDonutChart';

export default async function DashboardPage() {
  const { user, data, error } = await getDashboardData();
  if (error || !user) redirect('/login');

  let totalNilaiAkhir = data.rekap.reduce((sum, item) => sum + parseFloat(item.nilai_akhir || 0), 0);
  let totalBobotBulanan = data.rekap.reduce((sum, item) => {
    if (item.frekuensi && ['bulanan', 'mingguan', 'harian', 'per kebutuhan', 'per kasus'].some(f => item.frekuensi.toLowerCase().includes(f))) {
        return sum + item.bobot;
    }
    return sum;
  }, 0);
  const nilaiProporsional = totalBobotBulanan > 0 ? (totalNilaiAkhir / (totalBobotBulanan / 100.0)) : 0;
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#022020] mb-6">Dashboard Kinerja</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-[#6b1815] mb-4">Ringkasan Kinerja Bulanan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreCard title="Total Nilai Akhir Bulanan" value={totalNilaiAkhir} />
            <ScoreCard title="Nilai Akhir Proporsional" value={nilaiProporsional} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-[#6b1815] mb-3">Catatan Umum dari Penilai</h3>
            <p className="text-gray-600 italic">{data.summary.catatan_kpi}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-bold text-[#6b1815] mb-3">Rekomendasi Pengembangan</h3>
             <ul className="list-disc list-inside text-gray-600 space-y-2">
                {data.recommendations.map((rec, index) => <li key={index}>{rec.rekomendasi_text}</li>)}
                {data.recommendations.length === 0 && <p className="italic">Belum ada rekomendasi.</p>}
            </ul>
        </div>
      </div>
      
      {/* --- AWAL PERUBAHAN TABEL REKAPITULASI --- */}
      <section className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h3 className="text-lg font-bold text-[#6b1815] mb-4">Rekapitulasi Semua KPI</h3>
          <div className="overflow-x-auto max-h-[400px]"> {/* Beri tinggi maksimal agar bisa di-scroll */}
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#6b1815] text-white sticky top-0">
                      <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase w-12">No</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase">Nama KPI</th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase w-40">Frekuensi</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase w-24">Skor Aktual</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase w-20">Bobot</th>
                          <th className="px-4 py-3 text-center text-xs font-medium uppercase w-24">Nilai Akhir</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {data.rekap.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-4 text-center">{index + 1}</td>
                              <td className="px-4 py-4">{item.kpi_deskripsi}</td>
                              <td className="px-4 py-4">{item.frekuensi}</td>
                              <td className="px-4 py-4 text-center">{item.skor_aktual}</td>
                              <td className="px-4 py-4 text-center">{item.bobot}%</td>
                              <td className="px-4 py-4 text-center font-semibold">{parseFloat(item.nilai_akhir || 0).toFixed(2)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </section>
      {/* --- AKHIR PERUBAHAN TABEL REKAPITULASI --- */}

      <section className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-[#6b1815] mb-4">Kinerja per Area</h3>
        <div className="h-96 w-full">
            <AreaDonutChart areaScores={data.areaScores} userRole={user.role} />
        </div>
      </section>
    </div>
  );
}