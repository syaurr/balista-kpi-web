import { createClient } from "@supabase/supabase-js";

console.log("Function 'generate-certificate' (v_Hybrid_v1) has been initialized.");

function mapAspectName(internalName: string): string {
  const map: Record<string, string> = {
    "Amanah & Profesional": "Profesionalism -",
    "Leadership yang Menginspirasi": "Leadership -",
    "Terdepan untuk Pelanggan": "Customer Centric -",
    "Respek & Peduli": "Care & Respect -",
    "Inovasi Berkelanjutan": "Innovation -",
  };
  return map[internalName] || internalName + " -";
}

/**
 * Mengambil hanya nama depan dari nama lengkap.
 */
function getFirstName(fullName?: string): string {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

/**
 * Membuat format timestamp
 */
function getTimestamp() {
    const now = new Date();
    // Format tanggal: YYYY-MM-DD
    const date = now.toISOString().split('T')[0];
    // Format waktu: HH:MM GMT+7
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    return `System-generated | Final Result | ${date} ${time} GMT+7`;
}

Deno.serve(async (req: Request) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('DB_SERVICE_KEY') ?? ''
    );

    const { employeeName, aspectName, period } = await req.json();
    if (!employeeName || !aspectName || !period) {
      throw new Error("Data tidak lengkap.");
    }

    // 1. Proses data sesuai aturan Anda
    const firstName = getFirstName(employeeName);
    const mappedAspectName = mapAspectName(aspectName);
    const timestamp = getTimestamp();

    // 2. Baca template HTML (yang sudah kita perbarui)
    const htmlTemplate = `<!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <style>
            /* Impor font yang dibutuhkan */
            @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,700;1,400&family=Merriweather:wght@700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Darker+Grotesque:wght@300..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Spicy+Rice&display=swap');

            body {
                margin: 0;
                padding: 0;
                font-family: 'Poppins', sans-serif;
                -webkit-print-color-adjust: exact; /* Memaksa background dicetak */
                print-color-adjust: exact;
            }
            .certificate {
                /* Ukuran A4 Landscape */
                width: 11.693in;
                height: 8.268in;
                position: relative; /* Penting untuk positioning absolut */
                
                background-image: url('https://iuyjshctgtjbsgkymqqr.supabase.co/storage/v1/object/public/assets/background-certificate.png');
                
                background-size: cover;
                background-repeat: no-repeat;
            }
            
            /* Tempatkan semua teks dinamis di dalam 'div'
              dengan positioning absolut.
            */
            
            #nama-karyawan {
                position: absolute;
                width: 5.54in;
                height: 2.95in;
                left: 5.69in;
                top: 2.65in;
                
                font-family: 'Spicy Rice', serif;
                font-size: 75.5pt; /* pt (points) lebih baik untuk print */
                color: #ffffff;
                text-align: right;
                
                /* Mencegah teks turun baris jika terlalu panjang */
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            #nama-aspek {
                position: absolute;
                width: 3.1in;
                height: 0.27in;
                left: 6.97in;
                top: 5.37in;
                
                font-family: 'TAN Ashford', 'Merriweather', serif;
                font-size: 16.5pt;
                color: #f1d9a5;
                text-align: right;
                white-space: nowrap;
            }
            
            #periode {
                position: absolute;
                width: 1.13in;
                height: 0.26in;
                left: 10.1in;
                top: 5.38in;
                
                font-family: 'Poppins', sans-serif;
                font-size: 16pt;
                color: #ffffff;
                text-align: left;
                white-space: nowrap;
            }
            
            #timestamp {
                position: absolute;
                width: 3.94in;
                height: 0.12in;
                left: 0.61in;
                top: 7.87in;
                
                font-family: 'Poppins', sans-serif;
                font-style: italic;
                font-size: 7.8pt;
                color: #808b8b;
                text-align: left;
                white-space: nowrap;
            }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div id="nama-karyawan">{{NAMA_KARYAWAN}}</div>
            <div id="nama-aspek">{{NAMA_ASPEK}}</div>
            <div id="periode">{{PERIODE}}</div>
            <div id="timestamp">{{TIMESTAMP}}</div>
        </div>
    </body>
    </html>`

    // 3. Isi placeholder
    const populatedHtml = htmlTemplate
      .replace('{{NAMA_KARYAWAN}}', firstName)
      .replace('{{NAMA_ASPEK}}', mappedAspectName)
      .replace('{{PERIODE}}', period)
      .replace('{{TIMESTAMP}}', timestamp);

    // 4. Panggil Api2Pdf
    const pdfResponse = await fetch("https://v2018.api2pdf.com/chrome/html", {
      method: 'POST',
      headers: {
        'Authorization': Deno.env.get('API2PDF_KEY') ?? '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        html: populatedHtml,
        options: {
            printBackground: true,
            format: 'A4',
            landscape: true,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0
        },
        inlinePdf: false
      })
    });

    if (!pdfResponse.ok) {
      const errorBody = await pdfResponse.json();
      throw new Error(`Api2Pdf Error: ${errorBody.message || JSON.stringify(errorBody)}`);
    }
    
    // 5. Unduh PDF yang sudah jadi
    const responseData = await pdfResponse.json();
    const pdfUrl = responseData.pdf;
    if (!pdfUrl) throw new Error("Api2Pdf tidak mengembalikan URL PDF.");

    const pdfDownloadResponse = await fetch(pdfUrl);
    if (!pdfDownloadResponse.ok) throw new Error(`Failed to download PDF from URL: ${pdfUrl}`);
    
    const pdfBuffer = await pdfDownloadResponse.arrayBuffer();
    
    // 6. Buat nama file unik
    const safeAspectName = mappedAspectName.replace(/[^a-zA-Z0-9]/g, '-');
    const safeEmployee = firstName.replace(/\s/g, '-');
    const safePeriod = period.replace(/\s/g, '-');
    const filePath = `sertifikat-${safeEmployee}-${safeAspectName}-${safePeriod}.pdf`;

    // 7. Upload ke Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('sertifikat')
      .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) throw uploadError;

    // 8. Dapatkan URL publik
    const { data: urlData } = supabaseAdmin.storage
      .from('sertifikat')
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ certificateUrl: urlData.publicUrl }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("!!! EDGE FUNCTION CRASHED !!!", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});