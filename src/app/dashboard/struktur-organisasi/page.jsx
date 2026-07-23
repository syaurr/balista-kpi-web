'use client';

import React, { useState, useRef, useEffect } from 'react';

// --- DATA STRUKTUR ORGANISASI ---
// Menggunakan struktur data hirarki agar garis otomatis terbentuk sempurna
const orgData = {
    title: "Direktur",
    subtitle: "Chief Executive Officer",
    bg: "bg-[#711612]",
    text: "text-white",
    children: [
        {
            title: "Wakil Presiden SDM",
            subtitle: "Human Resources VP",
            bg: "bg-[#134e4a]",
            text: "text-white",
            children: [
                { title: "Admin SDM Paruh Waktu", subtitle: "Part-Time HR Admin", bg: "bg-gray-100", text: "text-gray-600 border border-gray-300" }
            ]
        },
        {
            title: "Eksekutif Pembelian",
            subtitle: "Purchasing Executive",
            bg: "bg-[#85603F]",
            text: "text-white",
            children: [
                { title: "Pengendali Operasional", subtitle: "Operations Controller", bg: "bg-[#E3BE79]", text: "text-gray-900" }
            ]
        },
        {
            title: "Eksekutif Analis Bisnis",
            subtitle: "Business Analyst Exec",
            bg: "bg-[#85603F]",
            text: "text-white",
            children: [
                { title: "Asisten Personal Eksekutif", subtitle: "Executive PA", bg: "bg-[#E3BE79]", text: "text-gray-900" }
            ]
        },
        {
            title: "Kepala Dapur & Gudang",
            subtitle: "Warehouse & Kitchen Head",
            bg: "bg-[#E3BE79]",
            text: "text-gray-900",
            children: [
                { title: "Admin Gudang", subtitle: "Warehouse Admin", bg: "bg-[#588177]", text: "text-white" },
                { title: "Staf Ops Gudang", subtitle: "Warehouse Operator", bg: "bg-[#588177]", text: "text-white" },
                { title: "Asisten Juru Masak", subtitle: "Cook Helper", bg: "bg-[#588177]", text: "text-white" },
                { title: "Pengantar Stok", subtitle: "Driver", bg: "bg-white", text: "text-[#588177] border-2 border-dashed border-[#588177]" }
            ]
        },
        {
            title: "Eksekutif Keuangan",
            subtitle: "Finance Executive",
            bg: "bg-[#85603F]",
            text: "text-white",
            children: [
                {
                    title: "Staf Akuntansi",
                    subtitle: "Accounting Officer",
                    bg: "bg-[#E3BE79]",
                    text: "text-gray-900",
                    children: [
                        { title: "Admin Keuangan (PT)", subtitle: "Part-Time Finance", bg: "bg-gray-100", text: "text-gray-600 border border-gray-300" }
                    ]
                }
            ]
        },
        {
            title: "Ahli Strategi Pemasaran",
            subtitle: "Marketing Strategist",
            bg: "bg-[#85603F]",
            text: "text-white",
            children: [
                {
                    title: "Ahli Strategi Media Sosial",
                    subtitle: "Social Media Strategist",
                    bg: "bg-[#E3BE79]",
                    text: "text-gray-900",
                    children: [
                        { title: "Desainer Grafis (PT)", subtitle: "Part-Time Graphic Designer", bg: "bg-gray-100", text: "text-gray-600 border border-gray-300" },
                        { title: "Kreator Konten (PT)", subtitle: "Part-Time Content Creator", bg: "bg-gray-100", text: "text-gray-600 border border-gray-300" }
                    ]
                },
                { title: "Spesialis Ops Digital", subtitle: "Digital Ops Specialist", bg: "bg-[#E3BE79]", text: "text-gray-900" }
            ]
        },
        {
            title: "Manajer Operasi Area",
            subtitle: "Area Ops Manager",
            bg: "bg-[#85603F]",
            text: "text-white",
            children: [
                {
                    title: "Supervisor Operasi Area",
                    subtitle: "Area Ops Supervisor",
                    bg: "bg-[#E3BE79]",
                    text: "text-gray-900",
                    children: [
                        {
                            title: "Pemimpin Outlet",
                            subtitle: "Outlet Leader",
                            bg: "bg-[#E3BE79]",
                            text: "text-gray-900",
                            children: [
                                { title: "Karyawan Outlet", subtitle: "Outlet Crew", bg: "bg-[#588177]", text: "text-white" }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

// --- KOMPONEN KARTU JABATAN ---
const TreeNode = ({ node }) => (
    <li>
        <div className="flex flex-col items-center group relative z-10">
            <div className={`flex flex-col items-center justify-center p-3 w-[160px] min-h-[75px] rounded-lg shadow-sm transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-lg cursor-pointer ${node.bg} ${node.text}`}>
                <span className="font-bold text-[12px] leading-snug text-center">{node.title}</span>
                {node.subtitle && <span className="text-[10px] opacity-90 mt-1 text-center font-medium italic">{node.subtitle}</span>}
            </div>
        </div>
        
        {/* Render Anak (Cabang Bawah) jika ada */}
        {node.children && node.children.length > 0 && (
            <ul>
                {node.children.map((child, i) => (
                    <TreeNode key={i} node={child} />
                ))}
            </ul>
        )}
    </li>
);


export default function ModernOrgChart() {
    // State untuk fitur interaktif Google Maps (Pan & Zoom)
    const [scale, setScale] = useState(0.7); // Mulai sedikit di-zoom out agar muat
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Fungsi Mouse untuk Panning
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    // Fungsi Roda Mouse untuk Zoom
    const handleWheel = (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const zoomAmount = e.deltaY > 0 ? -0.1 : 0.1;
            setScale((prev) => Math.min(Math.max(0.3, prev + zoomAmount), 2));
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-6 bg-white">
            
            {/* Header & Toolbar */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#022020]">Struktur Organisasi</h1>
                    <p className="text-sm text-gray-500 mt-1">Scroll/Tarik untuk menggeser. Gunakan tombol di kanan untuk Zoom.</p>
                </div>
                
                {/* Modern Toolbar */}
                <div className="flex gap-2 bg-gray-100 p-1.5 rounded-lg border border-gray-200">
                    <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="p-2 bg-white rounded shadow-sm hover:bg-gray-50 transition" title="Zoom Out">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                    </button>
                    <button onClick={() => { setScale(0.7); setPan({x:0, y:0}); }} className="px-4 py-2 bg-white rounded shadow-sm text-sm font-medium hover:bg-gray-50 transition" title="Reset Posisi">
                        Reset
                    </button>
                    <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 bg-white rounded shadow-sm hover:bg-gray-50 transition" title="Zoom In">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </button>
                </div>
            </div>

            {/* AREA CANVAS INTERAKTIF */}
            <div 
                ref={containerRef}
                className="flex-1 bg-slate-50 border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden relative cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ 
                    // Membuat efek grid titik-titik (dot background) agar terlihat modern
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }}
            >
                {/* Wadah Transformasi */}
                <div 
                    className="absolute inset-0 flex justify-center items-start origin-top"
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        paddingTop: '40px'
                    }}
                >
                    {/* ROOT BUNGKUSAN POHON */}
                    <div className="org-tree">
                        <ul>
                            <TreeNode node={orgData} />
                        </ul>
                    </div>
                </div>
            </div>

            {/* SUNTIKAN CSS KHUSUS UNTUK GARIS (DIJAMIN TIDAK AKAN PUTUS/MENGGANTUNG) */}
            <style jsx global>{`
                .org-tree ul {
                    display: flex;
                    position: relative;
                    padding-top: 24px;
                    justify-content: center;
                }
                .org-tree li {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    padding: 24px 8px 0 8px;
                }
                /* Garis Horizontal Penghubung Antar Saudara */
                .org-tree li::before, .org-tree li::after {
                    content: '';
                    position: absolute; 
                    top: 0; 
                    right: 50%;
                    border-top: 2px solid #94a3b8; /* Warna garis abu-abu rapi */
                    width: 50%; 
                    height: 24px;
                }
                .org-tree li::after {
                    right: auto; 
                    left: 50%;
                    border-left: 2px solid #94a3b8;
                }
                /* Hapus garis untuk anak tunggal */
                .org-tree li:only-child::after, .org-tree li:only-child::before {
                    display: none;
                }
                .org-tree li:only-child { 
                    padding-top: 0; 
                }
                /* Sudut membulat (rounded) pada garis pertama dan terakhir */
                .org-tree li:first-child::before, .org-tree li:last-child::after {
                    border: 0 none;
                }
                .org-tree li:last-child::before {
                    border-right: 2px solid #94a3b8;
                    border-radius: 0 8px 0 0;
                }
                .org-tree li:first-child::after {
                    border-radius: 8px 0 0 0;
                }
                /* Garis Vertikal Turun dari Parent ke Children */
                .org-tree ul ul::before {
                    content: '';
                    position: absolute; 
                    top: 0; 
                    left: 50%;
                    border-left: 2px solid #94a3b8;
                    width: 0; 
                    height: 24px;
                    transform: translateX(-50%);
                }
            `}</style>
        </div>
    );
}
