'use client'; // Gunakan client directive karena ada fungsi window.print()

import React from 'react';

export default function StrukturOrganisasiPage() {
    // 🧱 KOMPONEN 1: Kotak Jabatan (Node)
    const Node = ({ title, subtitle, bgClass, textClass = "text-white", borderClass = "border-transparent border-2", extraClass = "" }) => (
        <div className={`flex flex-col items-center justify-center p-3 text-center border-2 ${borderClass} ${bgClass} ${textClass} font-bold text-[12px] leading-tight rounded w-[170px] min-h-[70px] z-10 relative shadow-sm ${extraClass}`}>
            <span>{title}</span>
            {subtitle && <span className="font-medium italic text-[10px] mt-1">{subtitle}</span>}
        </div>
    );

    // 🧱 KOMPONEN 2: Garis Vertikal (VLine)
    const VLine = ({ dashed = false, h = "h-8", extraClass = "" }) => (
        <div className={`w-px ${h} ${dashed ? 'border-l-2 border-dashed border-gray-600' : 'bg-black'} ${extraClass} z-0`}></div>
    );

    // 🧱 KOMPONEN 3: Tiang Utama Per Kolom (TreeCol)
    const TreeCol = ({ children, position = "middle", width = "w-[200px]" }) => {
        return (
            <div className={`flex flex-col items-center relative ${width}`}>
                {/* Garis horizontal atas penyambung ke CEO */}
                {position === 'first' && <div className="absolute top-0 right-0 w-1/2 h-px border-t-2 border-black -z-10"></div>}
                {position === 'last' && <div className="absolute top-0 left-0 w-1/2 h-px border-t-2 border-black -z-10"></div>}
                {position === 'middle' && <div className="absolute top-0 w-full h-px border-t-2 border-black -z-10"></div>}
                
                {children}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            {/* Header Action */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#022020]">Struktur Organisasi</h1>
                <button 
                    onClick={() => window.print()} 
                    className="btn btn-outline btn-sm print:hidden"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0v3.396c0 .62.504 1.125 1.125 1.125h8.25c.621 0 1.125-.504 1.125-1.125V10.156z" />
                    </svg>
                    Cetak PDF
                </button>
            </div>

            {/* AREA CANVAS ORG CHART (Anti-Pecah & Scrollable) */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 overflow-x-auto w-full print:p-0 print:border-none print:shadow-none print:overflow-visible">
                {/* Lebar min-w sangat besar agar flexbox tidak saling gencet */}
                <div className="min-w-[1700px] mx-auto pb-10 flex flex-col items-center font-sans relative">
                    
                    {/* Judul Besar dalam Chart */}
                    <div className="flex justify-center mb-10">
                        <div className="bg-[#E3BE79] text-black text-3xl font-extrabold px-16 py-4 shadow-sm uppercase tracking-widest">
                            Struktur Organisasi
                        </div>
                    </div>

                    {/* --- ROOT: CEO --- */}
                    <div className="flex flex-col items-center">
                        <Node title="Direktur" subtitle="Chief Executive Officer" bgClass="bg-[#711612]" />
                        <VLine h="h-10" />
                    </div>

                    {/* --- CABANG UTAMA (7 Kolom) --- */}
                    <div className="flex justify-center items-start">
                        
                        {/* 1. HR */}
                        <TreeCol position="first" width="w-[200px]">
                            <VLine />
                            <Node title="Sumber Daya Manusia" subtitle="Human Resources" bgClass="bg-[#0a0a0a]" />
                            <VLine />
                            <Node title="Wakil Presiden Sumber Daya Manusia" subtitle="Human Resources Vice President" bgClass="bg-[#134e4a]" />
                        </TreeCol>

                        {/* 2. Purchasing */}
                        <TreeCol width="w-[200px]">
                            <VLine />
                            <Node title="Pembelian / Purchasing" bgClass="bg-[#0a0a0a]" />
                            <VLine />
                            <Node title="Eksekutif Pembelian & Pengadaan" subtitle="Purchasing Executive" bgClass="bg-[#85603F]" />
                            <VLine />
                            <div className="relative">
                                <Node title="Pengendali Operasional" subtitle="Operations Controller" bgClass="bg-[#E3BE79]" textClass="text-black" />
                                {/* Garis Putus-putus ke Gudang */}
                                <div className="absolute top-[80%] left-1/2 w-[390px] h-[190px] border-b-2 border-r-2 border-dashed border-gray-500 rounded-br -z-10"></div>
                            </div>
                        </TreeCol>

                        {/* 3. Business Analyst */}
                        <TreeCol width="w-[200px]">
                            <VLine />
                            <Node title="Analis Bisnis / Business Analyst" bgClass="bg-[#0a0a0a]" />
                            <VLine />
                            <Node title="Eksekutif Analis Bisnis" subtitle="Business Analyst Executive" bgClass="bg-[#85603F]" />
                            <VLine />
                            <div className="relative">
                                <Node title="Asisten Personal Eksekutif" subtitle="Executive Personal Assistant" bgClass="bg-[#E3BE79]" textClass="text-black" />
                                {/* Garis Putus-putus ke Gudang */}
                                <div className="absolute top-[80%] left-1/2 w-[190px] h-[115px] border-b-2 border-r-2 border-dashed border-gray-500 rounded-br -z-10"></div>
                            </div>
                            <VLine />
                            <Node title="Admin Sumber Daya Manusia Paruh Waktu" subtitle="Part-Time Human Resources Administrator" bgClass="bg-[#F3F4F6]" textClass="text-gray-600" borderClass="border-gray-300" />
                        </TreeCol>

                        {/* 4. TANGKAI TENGAH: Warehouse & Kitchen */}
                        <TreeCol width="w-[360px]">
                            <VLine h="h-[380px]" /> {/* Tiang panjang ke bawah */}
                            
                            {/* Pecah ke Gudang & Dapur */}
                            <div className="flex w-[360px] relative justify-center">
                                <div className="absolute top-0 left-[25%] right-[25%] h-px border-t-2 border-black -z-10"></div>
                                <div className="flex flex-col items-center w-1/2">
                                    <VLine />
                                    <Node title="Divisi Gudang" subtitle="(Warehouse Division)" bgClass="bg-[#0a0a0a]" />
                                    <VLine />
                                </div>
                                <div className="flex flex-col items-center w-1/2">
                                    <VLine />
                                    <Node title="Divisi Dapur Sentral" subtitle="(Central Kitchen Division)" bgClass="bg-[#0a0a0a]" />
                                    <VLine />
                                </div>
                            </div>

                            {/* Gabung kembali ke Kepala Dapur */}
                            <div className="flex w-[180px] relative justify-center h-6">
                                <div className="absolute top-0 left-0 right-0 h-px border-t-2 border-black"></div>
                                <div className="absolute top-0 left-0 w-px h-full bg-black"></div>
                                <div className="absolute top-0 right-0 w-px h-full bg-black"></div>
                            </div>
                            <VLine h="h-4" />
                            
                            <div className="relative bg-gray-50 print:bg-white z-20">
                                <Node title="Kepala Dapur dan Gudang" bgClass="bg-[#E3BE79]" textClass="text-black" />
                                {/* Garis Putus-putus ke Pemimpin Outlet */}
                                <div className="absolute top-1/2 left-[90%] w-[860px] h-px border-t-2 border-dashed border-gray-600 -z-10"></div>
                            </div>
                            <VLine />
                            
                            {/* Pecah ke 4 Crew Bawah (Overflow ke kiri dan kanan dengan -ml) */}
                            <div className="flex w-[720px] relative justify-center -ml-[180px]"> 
                                <div className="absolute top-0 left-[12.5%] right-[12.5%] h-px border-t-2 border-black -z-10"></div>
                                <div className="flex flex-col items-center w-1/4">
                                    <VLine />
                                    <Node title="Admin Gudang" subtitle="Warehouse Admin" bgClass="bg-[#588177]" />
                                </div>
                                <div className="flex flex-col items-center w-1/4">
                                    <VLine />
                                    <Node title="Staf Operasional Gudang & Distribusi" subtitle="Warehouse & Distribution Operator" bgClass="bg-[#588177]" />
                                </div>
                                <div className="flex flex-col items-center w-1/4">
                                    <VLine />
                                    <Node title="Asisten Juru Masak" subtitle="Cook Helper" bgClass="bg-[#588177]" />
                                </div>
                                <div className="flex flex-col items-center w-1/4">
                                    <VLine />
                                    <Node title="Pengantar Stok" subtitle="Driver" bgClass="bg-white" textClass="text-[#588177]" borderClass="border-dashed border-[#588177]" extraClass="border-[2px]" />
                                </div>
                            </div>
                        </TreeCol>

                        {/* 5. Finance */}
                        <TreeCol width="w-[200px]">
                            <VLine />
                            <Node title="Keuangan / Finance" bgClass="bg-[#0a0a0a]" />
                            <VLine />
                            <Node title="Eksekutif Keuangan" subtitle="Finance Executive" bgClass="bg-[#85603F]" />
                            <VLine />
                            <Node title="Staf Akuntansi" subtitle="Accounting Officer" bgClass="bg-[#E3BE79]" textClass="text-black" />
                            <VLine />
                            <Node title="Asisten Administrasi Keuangan Paruh Waktu" subtitle="Part-Time Admin Finance Assistant" bgClass="bg-[#F3F4F6]" textClass="text-gray-600" borderClass="border-gray-300" />
                        </TreeCol>

                        {/* 6. Marketing */}
                        <TreeCol width="w-[380px]">
                            <VLine />
                            <Node title="Pemasaran / Marketing" bgClass="bg-[#0a0a0a]" />
                            <VLine />
                            <Node title="Ahli Strategi Pemasaran" subtitle="Marketing Strategist" bgClass="bg-[#85603F]" />
                            <VLine />
                            <div className="flex w-full relative justify-center">
                                <div className="absolute top-0 left-[25%] right-[25%] h-px border-t-2 border-black -z-10"></div>
                                
                                {/* Social Media Branch */}
                                <div className="flex flex-col items-center w-[200px]">
                                    <VLine />
                                    <Node title="Ahli Strategi Media Sosial" subtitle="Social Media Strategist" bgClass="bg-[#E3BE79]" textClass="text-black" />
                                    <VLine />
                                    <div className="flex w-[350px] relative justify-center -ml-[75px]"> 
                                        <div className="absolute top-0 left-[25%] right-[25%] h-px border-t-2 border-black -z-10"></div>
                                        <div className="flex flex-col items-center w-[175px]">
                                            <VLine />
                                            <Node title="Desainer Grafis Paruh Waktu" subtitle="Part-Time Graphic Designer" bgClass="bg-[#F3F4F6]" textClass="text-gray-600" borderClass="border-gray-300" />
                                        </div>
                                        <div className="flex flex-col items-center w-[175px]">
                                            <VLine />
                                            <Node title="Kreator Konten Paruh Waktu" subtitle="Part-Time Content Creator" bgClass="bg-[#F3F4F6]" textClass="text-gray-600" borderClass="border-gray-300" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Digital Ops Branch */}
                                <div className="flex flex-col items-center w-[180px]">
                                    <VLine />
                                    <Node title="Spesialis Operasional Digital" subtitle="Digital Operation Specialist" bgClass="bg-[#E3BE79]" textClass="text-black" />
                                </div>
                            </div>
                        </TreeCol>

                        {/* 7. Outlet */}
                        <TreeCol position="last" width="w-[200px]">
                            <VLine />
                            <Node title="Outlet" bgClass="bg-[#0a0a0a]" />
                            <VLine />
                            <Node title="Manajer Operasi Area" subtitle="Area Operations Manager" bgClass="bg-[#85603F]" />
                            <VLine />
                            <Node title="Supervisor Operasi Area" subtitle="Area Operations Supervisor" bgClass="bg-[#E3BE79]" textClass="text-black" />
                            <VLine h="h-[215px]" /> {/* Jeda panjang menuju Pemimpin Outlet */}
                            <div className="relative bg-gray-50 print:bg-white z-10">
                                <Node title="Pemimpin Outlet" subtitle="Outlet Leader" bgClass="bg-[#E3BE79]" textClass="text-black" />
                            </div>
                            <VLine />
                            <Node title="Karyawan Outlet" subtitle="Outlet Crew" bgClass="bg-[#588177]" />
                        </TreeCol>
                        
                    </div>
                </div>
            </div>

            {/* Keterangan / Legend */}
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex gap-3 print:hidden shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
                <div className="flex flex-col gap-1">
                    <p><strong>Garis Solid (Utuh):</strong> Menandakan alur komando atau pelaporan langsung struktural.</p>
                    <p><strong>Garis Putus-Putus:</strong> Menandakan alur koordinasi fungsional antar divisi (contoh: Operasional & PA berkoordinasi ke Gudang, atau Dapur berkoordinasi ke Outlet).</p>
                </div>
            </div>
        </div>
    );
}