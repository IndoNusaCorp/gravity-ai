import { LibraAI } from 'libra-ai-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { Brain } from './brain';

// Fungsi helper untuk merakit prompt khusus sesuai kebutuhan
// 1. generate research
function generateResearchPrompt(topic: string) {
    return `Buatkan riset komprehensif mengenai topik: "${topic}". Berikan struktur yang jelas, mulai dari Latar Belakang, Tujuan, Pembahasan Utama, hingga Kesimpulan. Pastikan penjelasannya mendalam dan berbasis fakta.`;
}

// 2. generate skripsi
function generateSkripsiPrompt(topic: string) {
    return `Buatkan kerangka atau draf skripsi tentang topik: "${topic}". Susun secara sistematis mencakup Bab 1 (Pendahuluan: Latar Belakang, Rumusan Masalah, Tujuan), Bab 2 (Tinjauan Pustaka), dan Bab 3 (Metode Penelitian).`;
}

// 3. generate artikel ilmiah
function generateArtikelPrompt(topic: string) {
    return `Buatkan draf artikel ilmiah tentang topik: "${topic}". Gunakan format standar publikasi akademik: Abstrak, Pendahuluan, Tinjauan Literatur, Pemaparan/Diskusi, dan Kesimpulan.`;
}

// 4. generate dokumen paper (versi lengkap untuk ditulis langsung ke paper editor)
function generatePaperPrompt(topic: string, docType: string) {
    const templates: Record<string, string> = {
        research: `Buatkan dokumen riset lengkap dan mendalam mengenai topik: "${topic}".
        Gunakan format penulisan akademis yang baku dan terstruktur.

        BAGIAN PERTAMA yang WAJIB kamu tulis adalah HALAMAN SAMPUL (cover page) dengan format PERSIS seperti ini:

        ---COVER_PAGE_START---
        TITLE: [Judul Penelitian yang Relevan tentang ${topic}]
        DOCTYPE: PENELITIAN
        DESCRIPTION: Disusun untuk memenuhi tugas penelitian ilmiah
        AUTHOR: [Nama Peneliti]
        NIM: [NIM Peneliti]
        DEPARTMENT: [Program Studi]
        FACULTY: [Fakultas]
        UNIVERSITY: [Nama Universitas]
        YEAR: [Tahun]
        ---COVER_PAGE_END---

        Setelah halaman sampul, lanjutkan dengan isi dokumen menggunakan heading markdown:

        ## Abstrak
        (ringkasan singkat 150-250 kata)

        ## Kata Kunci
        (5-7 kata kunci yang relevan)

        ## BAB I - Pendahuluan
        ### 1.1 Latar Belakang
        ### 1.2 Rumusan Masalah
        ### 1.3 Tujuan Penelitian
        ### 1.4 Manfaat Penelitian

        ## BAB II - Tinjauan Pustaka
        ### 2.1 Landasan Teori
        ### 2.2 Penelitian Terdahulu

        ## BAB III - Metode Penelitian
        ### 3.1 Pendekatan Penelitian
        ### 3.2 Teknik Pengumpulan Data
        ### 3.3 Analisis Data

        ## BAB IV - Hasil dan Pembahasan

        ## BAB V - Kesimpulan dan Saran

        ## Daftar Pustaka
        (format APA)

        PENTING:
        - WAJIB mulai dengan blok ---COVER_PAGE_START--- dan ---COVER_PAGE_END--- persis seperti format di atas.
        - Isi field dalam kurung siku [...] dengan data placeholder yang relevan.
        - Gunakan heading markdown (#, ##, ###) untuk setiap judul dan sub-judul setelah cover page.
        - WAJIB tulis SEMUA BAB secara LENGKAP dari BAB I sampai BAB V tanpa ada yang dilewati.
        - Setiap sub-bab (1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3, dst.) HARUS ditulis dengan paragraf panjang minimal 3-5 kalimat per sub-bab.
        - JANGAN berhenti di tengah-tengah. Dokumen HARUS selesai sampai Daftar Pustaka.
        - Tulis paragraf dengan lengkap dan mendalam. Gunakan bullet list (-) untuk daftar item. Tulis dengan bahasa baku, formal, dan akademis.`,

        skripsi: `Buatkan draf skripsi lengkap tentang topik: "${topic}".
        Gunakan format penulisan akademis yang baku dan terstruktur.

        BAGIAN PERTAMA yang WAJIB kamu tulis adalah HALAMAN SAMPUL (cover page) dengan format PERSIS seperti ini:

        ---COVER_PAGE_START---
        TITLE: [Judul Skripsi yang Relevan tentang ${topic}]
        DOCTYPE: SKRIPSI
        DESCRIPTION: Diajukan untuk memenuhi salah satu syarat memperoleh gelar Sarjana
        AUTHOR: [Nama Mahasiswa]
        NIM: [NIM Mahasiswa]
        DEPARTMENT: [Program Studi]
        FACULTY: [Fakultas]
        UNIVERSITY: [Nama Universitas]
        YEAR: [Tahun]
        ---COVER_PAGE_END---

        Setelah halaman sampul, lanjutkan dengan isi dokumen menggunakan heading markdown:

        ## Abstrak
        (Bahasa Indonesia, 200-300 kata)

        ## BAB I - PENDAHULUAN
        ### 1.1 Latar Belakang Masalah
        ### 1.2 Identifikasi Masalah
        ### 1.3 Rumusan Masalah
        ### 1.4 Tujuan Penelitian
        ### 1.5 Manfaat Penelitian

        ## BAB II - TINJAUAN PUSTAKA
        ### 2.1 Landasan Teori
        ### 2.2 Kerangka Berpikir
        ### 2.3 Hipotesis

        ## BAB III - METODOLOGI PENELITIAN
        ### 3.1 Waktu dan Tempat Penelitian
        ### 3.2 Metode Penelitian
        ### 3.3 Populasi dan Sampel
        ### 3.4 Instrumen Penelitian
        ### 3.5 Teknik Analisis Data

        ## Daftar Pustaka
        (format APA)

        PENTING:
        - WAJIB mulai dengan blok ---COVER_PAGE_START--- dan ---COVER_PAGE_END--- persis seperti format di atas.
        - Isi field dalam kurung siku [...] dengan data placeholder yang relevan.
        - Gunakan heading markdown (#, ##, ###) untuk setiap judul dan sub-judul setelah cover page.
        - WAJIB tulis SEMUA BAB secara LENGKAP dari BAB I Pendahuluan (1.1 sampai 1.5), BAB II Tinjauan Pustaka (2.1 sampai 2.3), BAB III Metodologi (3.1 sampai 3.5), sampai Daftar Pustaka.
        - Setiap sub-bab HARUS ditulis dengan paragraf panjang minimal 3-5 kalimat per sub-bab. JANGAN hanya menulis judul sub-bab tanpa isi.
        - JANGAN berhenti di tengah-tengah. Dokumen HARUS selesai sampai Daftar Pustaka.
        - Tulis setiap bagian dengan lengkap, mendalam, formal, dan akademis. Gunakan paragraf yang panjang dan mendetail. Gunakan bullet list (-) untuk daftar item.`,

        artikel: `Buatkan draf artikel ilmiah (journal paper) lengkap tentang topik: "${topic}".
        Gunakan format penulisan akademis yang baku dan terstruktur.

        BAGIAN PERTAMA yang WAJIB kamu tulis adalah HALAMAN SAMPUL (cover page) dengan format PERSIS seperti ini:

        ---COVER_PAGE_START---
        TITLE: [Judul Artikel Ilmiah yang Singkat, Jelas, dan Informatif tentang ${topic}]
        DOCTYPE: ARTIKEL ILMIAH
        DESCRIPTION: Disusun untuk memenuhi tugas penulisan artikel ilmiah
        AUTHOR: [Nama Penulis]
        NIM: [NIM Penulis]
        DEPARTMENT: [Program Studi]
        FACULTY: [Fakultas]
        UNIVERSITY: [Nama Universitas]
        YEAR: [Tahun]
        ---COVER_PAGE_END---

        Setelah halaman sampul, lanjutkan dengan isi dokumen menggunakan heading markdown:

        ## Abstrak
        (150-250 kata, mencakup tujuan, metode, hasil, kesimpulan)

        ## Keywords
        (5-7 kata kunci)

        ## 1. Pendahuluan
        (latar belakang, gap penelitian, tujuan)

        ## 2. Tinjauan Literatur
        ### 2.1 Kajian Teori
        ### 2.2 Penelitian Terdahulu

        ## 3. Metodologi
        ### 3.1 Desain Penelitian
        ### 3.2 Data dan Sumber Data
        ### 3.3 Teknik Analisis

        ## 4. Hasil dan Pembahasan
        ### 4.1 Temuan Penelitian
        ### 4.2 Analisis dan Interpretasi

        ## 5. Kesimpulan
        (ringkasan, implikasi, saran untuk penelitian selanjutnya)

        ## Daftar Pustaka
        (format APA atau IEEE)

        PENTING:
        - WAJIB mulai dengan blok ---COVER_PAGE_START--- dan ---COVER_PAGE_END--- persis seperti format di atas.
        - Isi field dalam kurung siku [...] dengan data placeholder yang relevan.
        - Gunakan heading markdown (#, ##, ###) untuk setiap judul dan sub-judul setelah cover page.
        - WAJIB tulis SEMUA bagian secara LENGKAP dari Abstrak, Pendahuluan, Tinjauan Literatur (2.1, 2.2), Metodologi (3.1, 3.2, 3.3), Hasil dan Pembahasan (4.1, 4.2), Kesimpulan, sampai Daftar Pustaka.
        - Setiap sub-bab HARUS ditulis dengan paragraf panjang minimal 3-5 kalimat per sub-bab. JANGAN hanya menulis judul sub-bab tanpa isi.
        - JANGAN berhenti di tengah-tengah. Dokumen HARUS selesai sampai Daftar Pustaka.
        - Tulis dengan gaya penulisan akademis yang ketat. Gunakan bahasa formal dan ilmiah. Tulis paragraf yang lengkap dan mendalam. Gunakan bullet list (-) untuk daftar item.`
    };
    return templates[docType] || templates.research;
}

export async function POST(req: NextRequest) {
    try {
        // Tambahkan parameter 'type' atau 'action' dari frontend jika ada
        const { prompt, type, history } = await req.json();

        if (!process.env.LIBRAAI_API_KEY) {
            console.error("API Key for LibraAI is missing. Please check your .env file.");
            return NextResponse.json({ error: "LIBRAAI_API_KEY is missing" }, { status: 500 });
        }

        const libra = new LibraAI({ apiKey: process.env.LIBRAAI_API_KEY });

        // Tentukan prompt mana yang akan dieksekusi berdasarkan 'type' dkk
        let finalPrompt = prompt;
        let isPaperMode = false;
        if (type === 'research') {
            finalPrompt = generateResearchPrompt(prompt);
        } else if (type === 'skripsi') {
            finalPrompt = generateSkripsiPrompt(prompt);
        } else if (type === 'artikel') {
            finalPrompt = generateArtikelPrompt(prompt);
        } else if (type === 'paper_research') {
            finalPrompt = generatePaperPrompt(prompt, 'research');
            isPaperMode = true;
        } else if (type === 'paper_skripsi') {
            finalPrompt = generatePaperPrompt(prompt, 'skripsi');
            isPaperMode = true;
        } else if (type === 'paper_artikel') {
            finalPrompt = generatePaperPrompt(prompt, 'artikel');
            isPaperMode = true;
        }

        // Susun riwayat obrolan (chat history) agar AI mengingat konteks percakapan
        let historyContext = "";
        if (history && Array.isArray(history) && history.length > 0) {
            historyContext = `
        === RIWAYAT PERCAKAPAN SEBELUMNYA ===
        ${history.map((msg: any) => `${msg.role === 'user' ? 'User' : 'Kamu (LibraAI)'}: ${msg.content}`).join('\n        ')}
        =====================================
            `;
        }

        // Panggil fungsi Brain untuk mendapatkan konteks tambahan
        let brainContext = "";
        try {
            const brainResult = await Brain(prompt);

            // Memotong/membatasi hasil output JSON DuckDuckGo agar tidak terlalu panjang (menghindari token limit dari AI)
            const referenceData = JSON.stringify(brainResult.duckDuckGoResult).substring(0, 1500);

            // Logika berdasarkan hasil klasifikasi KNN
            if (brainResult.knnPrediction === 'umum') {
                // Jika topiknya terdeteksi di luar konteks akademis
                brainContext = `
        Peringatan: Berdasarkan analisis prioritas topik (Algoritma KNN), pertanyaan pengguna ini kemungkinan besar DI LUAR KONTEKS akademis (research, skripsi, artikel ilmiah).
        Harap ingatkan pengguna bahwa kamu hanya difokuskan untuk membantu pembuatan research, skripsi, dan artikel ilmiah, KECUALI jika pengguna secara eksplisit menyebutkan dirinya sebagai developer yang sedang mengetes sistem.`;
            } else if (brainResult.knnPrediction === 'fitur_akademik') {
                brainContext = `
        Pemberitahuan: Berdasarkan Algoritma KNN, pengguna sedang menggunakan salah satu "Fitur Akademik Tambahan" (contoh: Sitasi, Paraphrase Text, Math Equation, Abstrak, Chat dengan PDF, Virtual Advisor/Kritikus AI, Data to Markdown Table, atau Smart Outline Builder).
        Kamu HARUS LAKUKAN TUGAS TERSEBUT SECARA LANGSUNG tanpa bertele-tele. Formatlah output dengan rapi (gunakan code block untuk rumus, list untuk pustaka/outline, markdown table untuk data, atau paragraf formal untuk kritik/abstrak).
        Referensi tambahan dari pencarian (jika ada): ${referenceData}`;
            } else {
                // Jika topiknya relevan
                brainContext = `
        Berikut adalah referensi data tambahan hasil pencarian internal (DuckDuckGo & Algoritma KNN) yang relevan dengan pertanyaan/topik:
        - Kategori Topik (Prediksi KNN): ${brainResult.knnPrediction}
        - Referensi Data Mentah dari API DuckDuckGo: ${referenceData}
        Gunakan data referensi di atas untuk memberikan jawaban yang lebih akurat dan terpercaya.`;
            }
        } catch (err) {
            console.error("Gagal mengeksekusi fungsi Brain:", err);
        }

        // Setup custom instruction (system prompt) agar LibraAI tahu perannya
        const customInstruction = `
        Kamu adalah teman untuk membantu research, skripsi, artikel ilmiah di aplikasi Gravity-AI, inget ya kamu adalah teman bukan asisten.
        Kamu hanya merespon dalam bahasa Indonesia atau bahasa Inggris.
        Kamu tidak boleh menjawab pertanyaan yang di luar konteks akademis (research, skripsi, artikel ilmiah) KECUALI pengguna sedang menggunakan fitur tambahan (Paraphrase, Citation, Math, Upload PDF, Advisor, Tabel, Outline).
        Kamu merespon dengan sopan, profesional, dan to the point tanpa basa basi.
        Berikan format teks yang rapi dan mudah dibaca (menggunakan markdown seperti bold, list, code block untuk rumus, atau heading jika perlu).
        Kamu memberi link sumber dari internet yang terpercaya dan relevan dengan topik yang dibahas (jika diminta).
        Kamu menanyakan untuk memastikan apakah user ingin melanjutkan atau tidak.
        Kamu menanyakan untuk di buatkan research, skripsi, atau artikel ilmiah lagi atau tidak, KECUALI saat sedang mengeksekusi fitur tambahan spesifik.
        Selalu ingat percakapan sebelumnya dan pastikan percakapan tetap relevan dan nyambung dengan konteks yang diberikan pada ===== RIWAYAT PERCAKAPAN SEBELUMNYA =====.
        ${isPaperMode ? `
        PENTING: Kamu sedang dalam MODE PAPER. Kamu HARUS langsung menulis dokumen tanpa kalimat pembuka atau basa-basi apapun.
        JANGAN tulis kalimat seperti "Tentu, ini draf..." atau "Berikut adalah..." atau "Ini dia...". 
        LANGSUNG mulai dari blok ---COVER_PAGE_START--- tanpa kata pengantar apapun.
        JANGAN tambahkan komentar atau catatan penutup setelah dokumen selesai.
        KRITIS: Kamu WAJIB menulis dokumen secara LENGKAP dari awal hingga akhir. JANGAN pernah berhenti di tengah jalan.
        Tulis SETIAP BAB dan SETIAP SUB-BAB dengan isi paragraf yang lengkap dan mendetail (minimal 3-5 kalimat per sub-bab).
        Jika ada BAB I, BAB II, BAB III, BAB IV, BAB V — SEMUA harus ditulis lengkap sampai Daftar Pustaka.
        Kamu TIDAK BOLEH melewatkan atau mengosongkan sub-bab manapun.
        Jika ada yang menanyakan model mu apa dan versimu berapa kasih tau saja
` : ''}
        ${historyContext}
        ${brainContext}
        `;

        const fullPrompt = `${customInstruction}\n\nUser Question/Prompt:\n${finalPrompt}`;

        const response = await libra.chat(fullPrompt);

        if (response.status === "error") {
            throw new Error(response.error || "Unknown error from LibraAI");
        }

        // Return in the format expected by the frontend
        return NextResponse.json({
            success: true,
            data: {
                message: response.content,
                model: response.model
            }
        });
    } catch (error) {
        console.error("Error connecting to LibraAI:", error);
        return NextResponse.json({ error: "Failed to fetch LibraAI", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
