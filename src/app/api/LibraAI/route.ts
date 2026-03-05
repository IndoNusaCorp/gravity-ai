import { LibraAI, LibraChatOptions, LibraResponse } from 'libra-ai-sdk';
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
Gunakan format penulisan akademis yang baku dan terstruktur:

1. **Judul Penelitian**
2. **Abstrak** (ringkasan singkat 150-250 kata)
3. **Kata Kunci** (5-7 kata kunci)
4. **BAB I - Pendahuluan** (Latar Belakang, Rumusan Masalah, Tujuan Penelitian, Manfaat Penelitian)
5. **BAB II - Tinjauan Pustaka** (Landasan Teori, Penelitian Terdahulu)
6. **BAB III - Metode Penelitian** (Pendekatan, Teknik Pengumpulan Data, Analisis Data)
7. **BAB IV - Hasil dan Pembahasan**
8. **BAB V - Kesimpulan dan Saran**
9. **Daftar Pustaka** (format APA)

Tulis dengan bahasa baku, formal, dan akademis. Berikan penjelasan yang mendalam pada setiap bagian. Gunakan heading/sub-heading dengan format markdown yang jelas.`,

        skripsi: `Buatkan draf skripsi lengkap tentang topik: "${topic}".
Gunakan format penulisan skripsi yang baku:

1. **Halaman Judul**
2. **Abstrak** (Bahasa Indonesia, 200-300 kata)
3. **BAB I - PENDAHULUAN**
   - 1.1 Latar Belakang Masalah
   - 1.2 Identifikasi Masalah
   - 1.3 Rumusan Masalah
   - 1.4 Tujuan Penelitian
   - 1.5 Manfaat Penelitian
4. **BAB II - TINJAUAN PUSTAKA**
   - 2.1 Landasan Teori
   - 2.2 Kerangka Berpikir
   - 2.3 Hipotesis (jika ada)
5. **BAB III - METODOLOGI PENELITIAN**
   - 3.1 Waktu dan Tempat Penelitian
   - 3.2 Metode Penelitian
   - 3.3 Populasi dan Sampel
   - 3.4 Instrumen Penelitian
   - 3.5 Teknik Analisis Data
6. **Daftar Pustaka** (format APA)

Tulis secara lengkap, mendalam, formal, dan akademis. Gunakan heading/sub-heading dengan format markdown.`,

        artikel: `Buatkan draf artikel ilmiah (journal paper) lengkap tentang topik: "${topic}".
Gunakan format standar publikasi jurnal ilmiah:

1. **Judul Artikel** (singkat, jelas, informatif)
2. **Abstrak** (150-250 kata, mencakup tujuan, metode, hasil, kesimpulan)
3. **Keywords** (5-7 kata kunci)
4. **1. Pendahuluan** (latar belakang, gap penelitian, tujuan)
5. **2. Tinjauan Literatur** (kajian teori & penelitian terdahulu)
6. **3. Metodologi** (desain penelitian, data, teknik analisis)
7. **4. Hasil dan Pembahasan** (temuan, analisis, interpretasi)
8. **5. Kesimpulan** (ringkasan, implikasi, saran)
9. **Daftar Pustaka** (format APA atau IEEE)

Tulis dengan gaya penulisan akademis yang ketat, menggunakan bahasa formal dan ilmiah. Gunakan heading/sub-heading dengan format markdown.`
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

        const libra = new LibraAI(process.env.LIBRAAI_API_KEY, 'https://www.libraai.site/');

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
        Kamu tidak boleh menjawab pertanyaan yang di luar konteks akademis (research, skripsi, artikel ilmiah).
        Kamu merespon dengan sopan, profesional, dan to the point tanpa basa basi.
        Berikan format teks yang rapi dan mudah dibaca (menggunakan markdown seperti bold, list, atau heading jika perlu).
        Kamu memberi link sumber dari internet yang terpercaya dan relevan dengan topik yang dibahas.
        Kamu menanyakan untuk memastikan apakah user ingin melanjutkan atau tidak.
        Kamu menanyakan untuk di buatkan research, skripsi, atau artikel ilmiah lagi atau tidak.
        Selalu ingat percakapan sebelumnya dan pastikan percakapan tetap relevan dan nyambung dengan konteks yang diberikan pada ===== RIWAYAT PERCAKAPAN SEBELUMNYA =====.
        ${historyContext}
        ${brainContext}
        `;

        const response = await libra.chat(finalPrompt, {
            systemPrompt: customInstruction,
            temperature: 0.7,
            maxTokens: isPaperMode ? 4096 : 2048,
            keeptalking: true,
            rememberPreviousConversation: true
        } as LibraChatOptions & { keeptalking?: boolean, rememberPreviousConversation?: boolean });

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error connecting to LibraAI:", error);
        return NextResponse.json({ error: "Failed to fetch LibraAI", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
