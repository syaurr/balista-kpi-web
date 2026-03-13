'use client';

import { useState } from 'react';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import Image from 'next/image';
import UserSwitcher from './UserSwitcher';

/**
 * Komponen NavLink untuk membungkus Link dengan styling yang konsisten
 */
function NavLink({ href, icon, text, isSidebarOpen, activeColor = "text-gray-600" }) {
  return (
    <Link href={href} className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-teal-100 transition-colors group">
      <div className={`${activeColor} group-hover:text-teal-700 transition-colors`}>
        {icon}
      </div>
      <span className={`ml-4 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100 whitespace-nowrap' : 'opacity-0 hidden'}`}>
        {text}
      </span>
    </Link>
  );
}

export default function Sidebar({ 
    karyawan, 
    isAdmin, 
    isAssessor, 
    isSuperAssessor, 
    bisaNyamar // <--- TANGKAP DISINI
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Kalkulasi Level & XP (Hanya ditampilkan jika bukan Admin Non-Penilaian)
    const currentLevel = Math.floor((karyawan?.xp || 0) / 100) + 1;
    const currentXpInLevel = (karyawan?.xp || 0) % 100;
    const progressPercentage = (currentXpInLevel / 100) * 100;

    return (
        <aside className={`bg-white shadow-md flex flex-col p-4 transition-all duration-300 ease-in-out h-screen sticky top-0 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            
            {/* Header & Toggle Logo */}
            <div className="mb-4 flex items-center justify-between">
               <div className={`flex items-center overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                   <Image src="/logo.png" alt="Logo" width={40} height={40} className="mr-2 flex-shrink-0"/>
                   <div>
                        <h1 className="text-lg font-bold text-[#022020] whitespace-nowrap">Balista KPI</h1>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider -mt-1">Performance System</p>
                   </div>
               </div>
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-600 transition-transform ${!isSidebarOpen && 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                   </svg>
               </button>
            </div>
            
            {/* Profil & Sign Out */}
            <div className={`mb-6 p-2 bg-gray-50 rounded-xl transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                 <p className="text-sm font-semibold text-gray-700 text-center truncate px-2">Hi, {karyawan?.nama}</p>
                 <SignOutButton />
            </div>

            {/* Leveling System (Disembunyikan untuk Tria karena Admin Non-Penilaian) */}
            {isSidebarOpen && !isSuperAssessor && (
                <div className="mb-8 px-2">
                    <div className="flex justify-between text-xs font-bold text-teal-700 mb-1">
                        <span>Level {currentLevel}</span>
                        <span>{currentXpInLevel}/100 XP</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            )}
            
            {/* Navigasi Utama */}
            <nav className="flex-grow space-y-1 overflow-y-auto no-scrollbar">
                
                {/* 1. ADMIN PANEL (Bisa diakses Tria & Tasya) */}
                {isAdmin && (
                     <NavLink 
                        href="/dashboard/admin" 
                        isSidebarOpen={isSidebarOpen} 
                        text="Admin Panel" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} 
                     />
                )}
                
                {/* 2. PENILAIAN TIM (Hanya Tria, Garin, Nabila, Fauzia. TASYA TIDAK) */}
                {(isSuperAssessor || isAssessor) && (
                    <NavLink 
                        href="/dashboard/assessment" 
                        isSidebarOpen={isSidebarOpen} 
                        text="Assess Team" 
                        activeColor="text-orange-600"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>} 
                    />
                )}

                <div className="border-t my-2 border-gray-100"></div>

                {/* 3. MENU USER (Tampil untuk semua kecuali Admin Non-Penilaian/Tria) */}
                {!isSuperAssessor && (
                    <>
                        <NavLink 
                            href="/dashboard" 
                            isSidebarOpen={isSidebarOpen} 
                            text="My KPI" 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>} 
                        />
                        
                        <NavLink 
                            href="/dashboard/behavioral" 
                            isSidebarOpen={isSidebarOpen} 
                            text="Behavioral" 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} 
                        />
                    </>
                )}
                
                {/* 4. MENU UMUM (Selalu Tampil) */}
                <NavLink href="/dashboard/training" isSidebarOpen={isSidebarOpen} text="Training" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>} />

                <NavLink href="/dashboard/community" isSidebarOpen={isSidebarOpen} text="Community" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                
                <NavLink href="/dashboard/company-values" isSidebarOpen={isSidebarOpen} text="Core Values" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
            </nav>
            {bisaNyamar && (
                <div className="mt-auto p-2">
                    <UserSwitcher currentEmail={karyawan?.email} />
                </div>
            )}
        </aside>
    );
}