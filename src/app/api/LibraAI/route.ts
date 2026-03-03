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




export async function POST(req: NextRequest) {
    try {
        // Tambahkan parameter 'type' atau 'action' dari frontend jika ada
        const { prompt, type } = await req.json();

        if (!process.env.LIBRAAI_API_KEY) {
            console.error("API Key for LibraAI is missing. Please check your .env file.");
            return NextResponse.json({ error: "LIBRAAI_API_KEY is missing" }, { status: 500 });
        }

        const libra = new LibraAI(process.env.LIBRAAI_API_KEY, 'https://www.libraai.site/');

        // Tentukan prompt mana yang akan dieksekusi berdasarkan 'type' dkk
        let finalPrompt = prompt;
        if (type === 'research') {
            finalPrompt = generateResearchPrompt(prompt);
        } else if (type === 'skripsi') {
            finalPrompt = generateSkripsiPrompt(prompt);
        } else if (type === 'artikel') {
            finalPrompt = generateArtikelPrompt(prompt);
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
        ${brainContext}
        `;

        const response = await libra.chat(finalPrompt, {
            systemPrompt: customInstruction,
            temperature: 0.7,
            maxTokens: 2048
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error connecting to LibraAI:", error);
        return NextResponse.json({ error: "Failed to fetch LibraAI", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
