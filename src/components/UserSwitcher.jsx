// src/components/UserSwitcher.jsx
'use client';
import { setImpersonate, stopImpersonate } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function UserSwitcher({ currentEmail }) {
    const router = useRouter();
    
    // Tria dihapus dari list agar tidak ter-testing
    const users = [
        { name: 'Nabila (Assessor)', email: 'nabila.officebalista@gmail.com' },
        { name: 'Garin (Assessor)', email: 'rizqigarin@gmail.com' },
        { name: 'Fauzia (Assessor)', email: 'fauziarahmadini9@gmail.com' },
        { name: 'Reza (Bawahan)', email: 'rezarifki450@gmail.com' },
        { name: 'Nisa (Bawahan)', email: 'nisamputrii@gmail.com' },
        { name: 'Tria', email: 'mustikar.tria@gmail.com' }
    ];

    return (
        <div className="bg-gray-100 p-2 rounded-lg border border-gray-200">
            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Switch View</p>
            <select 
                className="select select-xs select-bordered w-full text-[10px]"
                onChange={async (e) => {
                    if (e.target.value === 'stop') {
                        await stopImpersonate();
                    } else {
                        await setImpersonate(e.target.value);
                    }
                    router.refresh();
                }}
                value={currentEmail}
            >
                <option value="stop">--- Akun Asli ---</option>
                {users.map(u => (
                    <option key={u.email} value={u.email}>{u.name}</option>
                ))}
            </select>
        </div>
    );
}