'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addTrainingProgram } from '../app/actions';

export default function AddTrainingForm({ allAreas, onFinished }) {
    const [isPaid, setIsPaid] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const result = await addTrainingProgram(formData);

        if (result.error) {
            alert(`Error: ${result.error}`);
        } else {
            alert(result.success);
            if (onFinished) onFinished();
            
            if (result.shouldRedirect) {
                router.push('/dashboard/learning-plan');
            } else {
                router.refresh();
            }
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500">
                Gunakan form ini untuk mengusulkan training eksternal. Training gratis akan langsung dimulai, training berbayar memerlukan persetujuan Admin.
            </p>
            
            <div><label className="block text-sm font-medium">Nama Program</label><input type="text" name="nama_program" className="input input-bordered w-full mt-1" required /></div>
            <div><label className="block text-sm font-medium">Penyedia</label><input type="text" name="penyedia" className="input input-bordered w-full mt-1" /></div>
            <div><label className="block text-sm font-medium">Link Akses/Informasi</label><input type="url" name="link_akses" className="input input-bordered w-full mt-1" /></div>

            <div>
                <label className="block text-sm font-medium">Area KPI Terkait (Opsional)</label>
                <div className="bg-gray-50 p-2 rounded-md max-h-32 overflow-y-auto grid grid-cols-2 gap-2 mt-1">
                    {allAreas.map(area => (
                        <label key={area} className="label cursor-pointer space-x-2 justify-start">
                            <input type="checkbox" name="linked_areas" value={area} className="checkbox checkbox-sm" />
                            <span className="label-text text-sm">{area}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">Biaya</label>
                <select name="biaya" onChange={(e) => setIsPaid(e.target.value === 'Berbayar')} defaultValue="Gratis" className="select select-bordered w-full mt-1">
                    <option value="Gratis">Gratis</option>
                    <option value="Berbayar">Berbayar</option>
                </select>
            </div>

            {isPaid && (
                <div>
                    <label className="block text-sm font-medium">Perkiraan Biaya (Rp)</label>
                    <input type="number" name="biaya_nominal" className="input input-bordered w-full mt-1" placeholder="Contoh: 500000" required />
                </div>
            )}
            
            <div className="pt-4">
                <button type="submit" className="btn btn-primary w-full shadow-md" disabled={loading}>
                    {loading ? 'Mengirim...' : 'Ajukan Training'}
                </button>
            </div>
        </form>
    );
}