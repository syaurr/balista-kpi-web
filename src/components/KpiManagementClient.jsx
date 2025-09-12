'use client';
import { useState, useMemo } from 'react';
import Modal from './Modal';
import { addOrUpdateKpi, deactivateKpi } from '../app/actions';
import { useRouter } from 'next/navigation';

function LinkModal({ kpi, onClose }) {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Link Referensi untuk: ${kpi.kpi_deskripsi}`}>
            <div className="space-y-3">
                <p className="text-sm text-gray-600">Pilih link di bawah ini untuk membukanya di tab baru:</p>
                <ul className="list-disc list-inside bg-gray-50 p-4 rounded-md">
                    {kpi.kpi_links.map(link => (
                        <li key={link.id}>
                            <a href={link.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {link.link_url}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </Modal>
    );
}

// Komponen Form untuk Tambah/Edit KPI
function KpiForm({ kpi, allPositions, selectedPosition, onFinished }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await addOrUpdateKpi(formData);
        if (result.error) {
            alert(`Error: ${result.error}`);
        } else {
            alert(result.success);
            onFinished();
        }
        setLoading(false);
    };

    // Gabungkan link menjadi satu string dengan baris baru
    const linksText = kpi?.kpi_links?.map(link => link.link_url).join('\n') || '';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {kpi?.id && <input type="hidden" name="id" value={kpi.id} />}
            <div><label className="block text-sm font-medium">Deskripsi KPI</label><textarea name="kpi_deskripsi" defaultValue={kpi?.kpi_deskripsi} rows="3" className="mt-1 block w-full border rounded-md p-2" required /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Area Kerja / Tanggung Jawab</label><input type="text" name="area_kerja" defaultValue={kpi?.area_kerja} className="mt-1 block w-full border rounded-md p-2" /></div>
                <div><label className="block text-sm font-medium">Area</label><input type="text" name="area" defaultValue={kpi?.area} className="mt-1 block w-full border rounded-md p-2" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Posisi</label><select name="posisi" defaultValue={kpi?.posisi || selectedPosition} className="mt-1 block w-full border rounded-md p-2 bg-gray-100" readOnly>{allPositions.map(p => <option key={p.posisi} value={p.posisi}>{p.posisi}</option>)}</select></div>
                <div><label className="block text-sm font-medium">Frekuensi</label><input type="text" name="frekuensi" defaultValue={kpi?.frekuensi} className="mt-1 block w-full border rounded-md p-2" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium">Bobot (%)</label><input type="number" name="bobot" defaultValue={kpi?.bobot} className="mt-1 block w-full border rounded-md p-2" /></div>
                 <div><label className="block text-sm font-medium">Target Standar</label><input type="text" name="target_standar" defaultValue={kpi?.target_standar} className="mt-1 block w-full border rounded-md p-2" /></div>
            </div>
            <div><label className="block text-sm font-medium">Link Referensi (pisahkan dengan baris baru)</label><textarea name="referensi_links" defaultValue={linksText} rows="3" className="mt-1 block w-full border rounded-md p-2" /></div>
            <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading} className="btn w-full bg-[#4f7979] hover:bg-[#033f3f] text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">{loading ? 'Menyimpan...' : 'Simpan Data KPI'}</button>
            </div>
        </form>
    );
}

export default function KpiManagementClient({ initialKpis, allPositions }) {
    const [selectedPosition, setSelectedPosition] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKpi, setEditingKpi] = useState(null);
    const [showInactive, setShowInactive] = useState(false);
    const [linkModalKpi, setLinkModalKpi] = useState(null);
    const router = useRouter();

    const handleOpenModal = (kpi = null) => {
        setEditingKpi(kpi);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingKpi(null);
        router.refresh();
    };

    const handleDeactivate = async (kpi) => {
        if (window.confirm(`Yakin ingin menonaktifkan KPI: "${kpi.kpi_deskripsi}"?`)) {
            const formData = new FormData();
            formData.append('id', kpi.id);
            const result = await deactivateKpi(formData);
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                alert(result.success);
                router.refresh();
            }
        }
    };

    const filteredAndSortedKpis = useMemo(() => {
        if (!selectedPosition) return [];
        let kpis = initialKpis.filter(kpi => kpi.posisi === selectedPosition);
        if (!showInactive) {
            kpis = kpis.filter(kpi => kpi.is_active);
        }
        kpis.sort((a, b) => {
            if (a.is_active && !b.is_active) return -1;
            if (!a.is_active && b.is_active) return 1;
            const areaA = a.area || '';
            const areaB = b.area || '';
            return areaA.localeCompare(areaB);
        });
        return kpis;
    }, [selectedPosition, showInactive, initialKpis]);

    return (
        <div>
            <div className="mb-6 bg-white p-6 rounded-xl shadow-md">
                <label htmlFor="posisi-filter" className="block text-lg font-bold text-gray-700 mb-2">Pilih Posisi</label>
                <select id="posisi-filter" value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} className="select select-bordered w-full max-w-xs">
                    <option value="" disabled>Pilih posisi untuk dikelola...</option>
                    {allPositions.map(p => <option key={p.posisi} value={p.posisi}>{p.posisi}</option>)}
                </select>
            </div>

            {selectedPosition && (
                <div>
                    <div className="mb-6 flex justify-between items-center">
                        <div className="form-control"><label className="label cursor-pointer space-x-2"><input type="checkbox" checked={showInactive} onChange={() => setShowInactive(!showInactive)} className="checkbox checkbox-primary" /><span className="label-text">Tampilkan KPI nonaktif</span></label></div>
                        <button onClick={() => handleOpenModal(null)} className="btn btn-neutral shadow-md hover:shadow-lg transition-shadow">Tambah KPI Baru</button>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#6b1815] text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-center">No</th>
                                        <th className="px-4 py-3 text-left">Area</th>
                                        <th className="px-4 py-3 text-left">Area Kerja</th>
                                        <th className="px-4 py-3 text-left">KPI</th>
                                        <th className="px-4 py-3 text-left">Target/Standar</th>
                                        <th className="px-4 py-3 text-left">Link Ref</th>
                                        <th className="px-4 py-3 text-left">Frekuensi</th>
                                        <th className="px-4 py-3 text-center">Bobot</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {filteredAndSortedKpis.map((kpi, index) => (
                                        <tr key={kpi.id} className={!kpi.is_active ? 'bg-gray-100 text-gray-400' : ''}>
                                            <td className="px-4 py-4 text-center">{index + 1}</td>
                                            <td className="px-4 py-4">{kpi.area}</td>
                                            <td className="px-4 py-4">{kpi.area_kerja}</td>
                                            <td className="px-4 py-4 whitespace-normal">{kpi.kpi_deskripsi}</td>
                                            <td className="px-4 py-4 whitespace-normal">{kpi.target_standar}</td>
                                            <td className="px-4 py-4">
                                                {/* --- AWAL PERBAIKAN LOGIKA LINK --- */}
                                                {kpi.kpi_links && kpi.kpi_links.length === 1 && (
                                                    // Jika link hanya satu, tampilkan langsung
                                                    <a href={kpi.kpi_links[0].link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                        Lihat
                                                    </a>
                                                )}
                                                {kpi.kpi_links && kpi.kpi_links.length > 1 && (
                                                    // Jika link lebih dari satu, tampilkan tombol untuk membuka modal
                                                    <button onClick={() => setLinkModalKpi(kpi)} className="btn btn-xs btn-outline">
                                                        Lihat ({kpi.kpi_links.length})
                                                    </button>
                                                )}
                                                {/* --- AKHIR PERBAIKAN LOGIKA LINK --- */}
                                            </td>
                                            <td className="px-4 py-4">{kpi.frekuensi}</td>
                                            <td className="px-4 py-4 text-center">{kpi.bobot}%</td>
                                            <td className="px-4 py-4 text-center"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ kpi.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>{kpi.is_active ? 'Aktif' : 'Non-Aktif'}</span></td>
                                            <td className="px-4 py-4 text-right space-x-2">
                                                <button onClick={() => handleOpenModal(kpi)} className="btn btn-xs">Edit</button>
                                                {kpi.is_active && (<button onClick={() => handleDeactivate(kpi)} className="btn btn-xs btn-ghost text-red-600">Nonaktifkan</button>)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingKpi ? 'Edit Master KPI' : 'Tambah Master KPI Baru'}>
                    <KpiForm kpi={editingKpi} allPositions={allPositions} selectedPosition={selectedPosition} onFinished={handleCloseModal} />
                </Modal>
            )}

            {linkModalKpi && (
                <LinkModal kpi={linkModalKpi} onClose={() => setLinkModalKpi(null)} />
            )}
        </div>
    );
}