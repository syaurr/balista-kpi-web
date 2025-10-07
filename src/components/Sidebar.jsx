'use client';

import { useState } from 'react';
import Link from 'next/link';
import SignOutButton from './SignOutButton';

function NavLink({ href, icon, text, isSidebarOpen }) {
  return (
    <Link href={href} className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-teal-100 transition-colors group">
      {icon}
      <span className={`ml-4 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100 whitespace-nowrap' : 'opacity-0 hidden'}`}>
        {text}
      </span>
    </Link>
  );
}

export default function Sidebar({ karyawan, isAdmin }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const currentLevel = Math.floor((karyawan?.xp || 0) / 100) + 1;
    const xpForNextLevel = 100;
    const currentXpInLevel = (karyawan?.xp || 0) % 100;
    const progressPercentage = (currentXpInLevel / xpForNextLevel) * 100;

    return (
        <aside className={`bg-white shadow-md flex flex-col p-4 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            
            <div className="mb-4 flex items-center justify-between">
                <div className={`flex items-center overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <img src="/logo.png" alt="Logo" className="h-10 w-10 mr-2 flex-shrink-0"/>
                    <div>
                        <h1 className="text-lg font-bold text-[#022020] whitespace-nowrap">Balista KPI</h1>
                    </div>
                </div>

                {isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-full hover:bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                )}
                
                {!isSidebarOpen && (
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                )}
            </div>
            
            <div className={`mb-8 space-y-2 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                 <p className="text-l text-gray-500 text-center">Welcome, {karyawan?.nama}</p>
                 <SignOutButton />
            </div>

            <div className={`mb-8 space-y-2 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="text-center">
                    <div className="font-bold text-teal-700">Level {currentLevel}</div>
                    <progress className="progress progress-success w-full" value={progressPercentage} max="100"></progress>
                    <div className="text-xs text-gray-500">{currentXpInLevel} / {xpForNextLevel} XP</div>
                </div>
            </div>
            
            {/* Navigasi */}
            <nav className="flex-grow space-y-2">
                <NavLink href="/dashboard" isSidebarOpen={isSidebarOpen} text="Dashboard" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>} />
                <NavLink href="/dashboard/training" isSidebarOpen={isSidebarOpen} text="Training" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>} />
                <NavLink href="/dashboard/community" isSidebarOpen={isSidebarOpen} text="CommAch" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                {/* --- PERUBAHAN DI SINI --- */}
                {isAdmin && (
                     <NavLink href="/dashboard/admin" isSidebarOpen={isSidebarOpen} text="Admin Section" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 group-hover:text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                )}
            </nav>
        </aside>
    );
}