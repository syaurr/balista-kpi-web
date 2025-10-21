'use client';

// Komponen helper untuk kartu Balista & Priangan (Tidak Berubah)
function ValueCard({ title, description, brand }) {
  return (
    <div className={`card ${brand === 'balista' ? 'bg-blue-50' : 'bg-yellow-50'} shadow`}>
      <div className="card-body">
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  );
}

// --- PERBAIKAN: Komponen TINGKAT PIRAMIDA (PyramidTier) ---
// Deskripsi sekarang ada di dalam, dan 'height' otomatis
function PyramidTier({ titleId, titleEn, description, icon, colorClass, widthClass, zIndex }) {
  return (
    <div 
      className={`relative flex items-center p-6 text-white shadow-lg ${colorClass} ${widthClass}`} // Padding diubah, 'group' dihapus
      style={{ 
        clipPath: 'polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)', 
        zIndex: zIndex 
      }}
    >
      <div className="flex-shrink-0 p-3 bg-white/30 rounded-full mr-4">
        {icon}
      </div>
      <div className="flex-grow">
        <h3 className="text-xl font-bold">{titleId}</h3>
        <em className="text-lg -mt-1 block opacity-90">{titleEn}</em>
        {/* --- PERBAIKAN: Deskripsi sekarang selalu terlihat --- */}
        <p className="text-sm opacity-90 mt-2">{description}</p>
      </div>
      {/* Pop-up hover di samping telah dihapus */}
    </div>
  );
}

// --- Komponen Tampilan Mobile (Dibuat terpisah agar lebih bersih) ---
function MobileValueItem({ titleId, titleEn, description, icon, colorClass }) {
  return (
     <div className={`card shadow-xl border w-full max-w-sm ${colorClass} text-white`}>
      <div className="card-body items-center text-center">
        <div className="p-3 bg-white/30 rounded-full">
          {icon}
        </div>
        <h3 className="card-title text-xl font-bold mt-2">{titleId}</h3>
        <em className="text-lg -mt-1 block opacity-90">{titleEn}</em>
        <p className="text-sm opacity-90 mt-2">{description}</p>
      </div>
    </div>
  );
}

export default function CompanyValuesClient() {
  return (
    <div role="tablist" className="tabs tabs-lifted tabs-lg">
      
      {/* --- TAB 1: NILAI INTI ALTRI --- */}
      <input type="radio" name="values_tabs" role="tab" className="tab" aria-label="ALTRI" defaultChecked />
      <div role="tabpanel" className="tab-content bg-white border-base-300 rounded-box p-6 overflow-hidden">
        <h2 className="text-2xl font-bold text-center mb-6">Nilai Inti Perusahaan PT Altri Sejahtera Indonesia</h2>
        
        {/* --- Tampilan Piramida Desktop (Hanya di layar 'lg' ke atas) --- */}
        <div className="hidden lg:flex flex-col items-center -space-y-2 py-4"> {/* -space-y-2 untuk tumpang tindih */}
          <PyramidTier 
            titleId="Amanah & Profesional" titleEn="(Profesionalism)" 
            description="Kami menjaga setiap komitmen, etika kerja, dan kualitas melalui tindakan yang bertanggung jawab dan dapat dipercaya."
            colorClass="bg-teal-700" widthClass="w-[30rem]" zIndex={5}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
          />
          <PyramidTier 
            titleId="Leadership yang Menginspirasi" titleEn="(Leadership)"
            description="Kami memimpin dengan memberi teladan, bertanggung jawab, dan menginspirasi tim untuk mencapai hasil terbaik."
            colorClass="bg-green-600" widthClass="w-[34rem]" zIndex={4}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 9.11c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
          />
          <PyramidTier 
            titleId="Terdepan untuk Pelanggan" titleEn="(Customer Centric)"
            description="Kami selalu menempatkan kebutuhan dan kepuasan pelanggan sebagai prioritas utama dalam setiap keputusan dan layanan."
            colorClass="bg-blue-600" widthClass="w-[38rem]" zIndex={3}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <PyramidTier 
            titleId="Respek & Peduli" titleEn="(Care & Respect)"
            description="Kami saling peduli dan menghargai antar sesama tim untuk membangun lingkungan kerja yang suportif dan harmonis."
            colorClass="bg-red-600" widthClass="w-[42rem]" zIndex={2}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
          />
          <PyramidTier 
            titleId="Inovasi Berkelanjutan" titleEn="(Innovation)"
            description="Kami terbuka terhadap ide-ide baru, berani berinovasi, dan terus berusaha untuk melakukan perbaikan berkelanjutan."
            colorClass="bg-orange-600" widthClass="w-[46rem]" zIndex={1}
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
          />
        </div>

        {/* --- Tampilan Stacked (Tumpuk) untuk Layar Kecil (Mobile) --- */}
        <div className="lg:hidden flex flex-col items-center gap-4 py-6">
          <MobileValueItem 
              titleId="Amanah & Profesional" titleEn="(Profesionalism)" 
              description="Kami menjaga setiap komitmen, etika kerja, dan kualitas melalui tindakan yang bertanggung jawab dan dapat dipercaya."
              colorClass="bg-teal-700" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
          />
          <MobileValueItem 
              titleId="Leadership yang Menginspirasi" titleEn="(Leadership)"
              description="Kami memimpin dengan memberi teladan, bertanggung jawab, dan menginspirasi tim untuk mencapai hasil terbaik."
              colorClass="bg-green-600" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 9.11c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
          />
          <MobileValueItem 
              titleId="Terdepan untuk Pelanggan" titleEn="(Customer Centric)"
              description="Kami selalu menempatkan kebutuhan dan kepuasan pelanggan sebagai prioritas utama dalam setiap keputusan dan layanan."
              colorClass="bg-blue-600" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <MobileValueItem 
              titleId="Respek & Peduli" titleEn="(Care & Respect)"
              description="Kami saling peduli dan menghargai antar sesama tim untuk membangun lingkungan kerja yang suportif dan harmonis."
              colorClass="bg-red-600" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
          />
          <MobileValueItem 
              titleId="Inovasi Berkelanjutan" titleEn="(Innovation)"
              description="Kami terbuka terhadap ide-ide baru, berani berinovasi, dan terus berusaha untuk melakukan perbaikan berkelanjutan."
              colorClass="bg-orange-600" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
          />
        </div>
      </div>
      
      {/* --- TAB 2 & 3 (Tidak Berubah) --- */}
      <input type="radio" name="values_tabs" role="tab" className="tab" aria-label="Balista" />
      <div role="tabpanel" className="tab-content bg-white border-base-300 rounded-box p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Nilai Inti Merk (Balista Sushi & Tea)</h2>
        <div className="flex justify-center mb-4">
          <img src="/balista.png" alt="Balista Logo" style={{ width: '150px', height: '100px' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ValueCard 
            brand="balista"
            title="Produk yang Terjangkau"
            description="Kami menyajikan hidangan Jepang dan minuman berkualitas dengan harga terjangkau."
          />
          <ValueCard 
            brand="balista"
            title="Kebersamaan yang Hangat"
            description="Kami menciptakan suasana hangat untuk dinikmati bersama orang terdekat."
          />
          <ValueCard 
            brand="balista"
            title="Hidangan yang Sehat"
            description="Kami menyajikan makanan bergizi seimbang dengan bahan segar untuk hidup lebih sehat."
          />
        </div>
      </div>

      <input type="radio" name="values_tabs" role="tab" className="tab" aria-label="Priangan" />
      <div role="tabpanel" className="tab-content bg-white border-base-300 rounded-box p-6">
        <h2 className="text-2xl font-bold text-center">Nilai Inti Merk (Kopi Priangan)</h2>
        <div className="flex justify-center">
           <img src="/kopri.png" alt="Kopi Priangan Logo" style={{ width: '200px', height: '200px' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ValueCard 
            brand="priangan"
            title="Ngopi Bernuansa Nostalgia"
            description="Kami menghadirkan suasana ngopi tempo dulu khas Priangan dengan sentuhan modern."
          />
          <ValueCard 
            brand="priangan"
            title="Produk yang Terjangkau"
            description="Kami menyajikan kopi dan makanan pendamping berkualitas dengan harga terjangkau."
          />
          <ValueCard 
            brand="priangan"
            title="Kebersamaan yang Hangat"
            description="Kami menciptakan ruang hangat bagi semua kalangan untuk menikmati kebersamaan."
          />
          <ValueCard 
            brand="priangan"
            title="Inovasi dengan Sentuhan Tradisi"
            description="Kami mengembangkan menu dan layanan baru tanpa meninggalkan cita rasa khas Priangan."
          />
        </div>
      </div>

    </div>
  );
}