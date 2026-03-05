// disini brain menggunakan KNN (K-Nearest Neighbors)
// API DUCKDUCK GO untuk browser kebutuhan research, skripsi, artikel ilmiah

import LibraAI from "libra-ai-sdk";

export type DataPoint = {
    keywords: string[];
    label: string;
};

// Data training berisi sekumpulan keyword (kata kunci) yang mengindikasikan 
// bahwa sebuah query berkaitan dengan pembuatan research, skripsi, atau artikel ilmiah.
const TrainingData: DataPoint[] = [
    // Topik Skripsi & Penelitian
    { keywords: ['skripsi', 'bab', 'pendahuluan', 'tinjauan', 'pustaka', 'metode', 'penelitian', 'rumusan', 'masalah', 'latar belakang', 'draf'], label: 'skripsi' },
    { keywords: ['kualitatif', 'kuantitatif', 'wawancara', 'kuisioner', 'sampel', 'populasi', 'hipotesis', 'variabel', 'uji', 'validitas'], label: 'skripsi' },
    { keywords: ['proposal', 'seminar', 'sidang', 'revisi', 'dosen', 'pembimbing', 'abstrak', 'kesimpulan', 'saran'], label: 'skripsi' },

    // Topik Research / Riset Umum
    { keywords: ['riset', 'research', 'analisis', 'studi', 'kasus', 'dampak', 'pengaruh', 'hubungan', 'efektivitas', 'implementasi'], label: 'research' },
    { keywords: ['teknologi', 'informasi', 'sistem', 'aplikasi', 'perancangan', 'pengembangan', 'evaluasi', 'perbandingan'], label: 'research' },
    { keywords: ['data', 'algoritma', 'model', 'prediksi', 'klasifikasi', 'akurasi', 'optimasi', 'kinerja'], label: 'research' },

    // Topik Artikel Ilmiah / Jurnal
    { keywords: ['artikel', 'ilmiah', 'jurnal', 'publikasi', 'paper', 'literatur', 'review', 'sitasi', 'referensi', 'daftar pustaka'], label: 'artikel' },
    { keywords: ['format', 'ieee', 'apa', 'harvard', 'penulisan', 'kutipan', 'plagiarisme', 'turnitin', 'mendeley'], label: 'artikel' },
    { keywords: ['konferensi', 'prosiding', 'scopus', 'sinta', 'peer', 'reviewed', 'metodologi', 'hasil', 'pembahasan'], label: 'artikel' },

    // Pertanyaan umum / percakapan santai (Di luar research)
    { keywords: ['halo', 'hai', 'siapa', 'kamu', 'apa', 'kabar', 'selamat', 'pagi', 'siang', 'malam', 'nama', 'developer', 'bantu', 'tolong'], label: 'umum' },
    { keywords: ['berita', 'hari', 'ini', 'cuaca', 'film', 'lagu', 'musik', 'rekomendasi', 'makan', 'resep', 'cara', 'membuat', 'game'], label: 'umum' },
];



/**
 * Fungsi untuk menghitung jarak kemiripan teks menggunakan jaccard similarity
 * (Kita modifikasi dari euclidean distance agar cocok untuk data teks).
 */
function calculateTextDistance(queryWords: string[], trainingWords: string[]): number {
    const intersection = queryWords.filter(word => trainingWords.includes(word));
    // Semakin banyak kata yang sama, semakin kecil jaraknya ("0" berarti identik)
    // Jarak = 1 - (jumlah kata beririsan / jumlah total kata training)
    return 1 - (intersection.length / trainingWords.length);
}

/**
 * Fungsi fetch DuckDuckGo:
 * Mengambil data referensi dari DuckDuckGo
 */
export async function fetchDuckDuckGo(query: string) {
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
    });
    if (!response.ok) {
        throw new Error('Gagal mengambil data dari DuckDuckGo API');
    }
    return await response.json();
}

/**
 * Fungsi Brain:
 * Mengintegrasikan K-Nearest Neighbors (KNN) dengan hasil pencarian API DuckDuckGo
 */
export async function Brain(
    query: string,
    k: number = 3,
    trainingData: DataPoint[] = TrainingData
) {
    // Parsing query menjadi array kata-kata (lowercase, hapus tanda baca)
    const queryWords = query.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);

    // 1. Hitung jarak (Kemiripan Teks) ke semua titik data training
    const distances = trainingData.map(point => ({
        label: point.label,
        dist: calculateTextDistance(queryWords, point.keywords)
    }));

    // 2. Urutkan berdasarkan jarak terdekat (dist terkecil) dan ambil k tetangga teratas
    const nearest = distances.sort((a, b) => a.dist - b.dist).slice(0, k);

    // 3. Voting (ambil label yang paling banyak muncul dari k tetangga)
    const votes = nearest.reduce((acc, p) => {
        // Berikan bobot lebih jika jaraknya lebih dekat (opsional, tapi membuat KNN lebih akurat)
        const weight = 1 - p.dist;
        acc[p.label] = (acc[p.label] || 0) + weight; // Menggunakan weighted voting
        return acc;
    }, {} as Record<string, number>);

    // Prediksi label berdasarkan voting tertinggi
    let predictedLabel = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);

    // Jika probabilitas / bobot sangat rendah atau 0, anggap sebagai query 'umum' (out of context)
    const maxVote = votes[predictedLabel];
    if (maxVote === 0) {
        predictedLabel = 'umum';
    }

    // 4. Integrasikan API DUCKDUCKGO
    // Jika ternyata kategori yang diprediksi adalah umum, mari kita tetap cari referensi dari DuckDuckGo
    // namun kita instruksikan AI nanti bahwa ini masuk kategori "umum/out of context"
    const searchQuery = `${query}`;
    const searchResult = await fetchDuckDuckGo(searchQuery);

    // 5. Kembalikan hasil kalkulasi KNN beserta output dari duckduckgo
    return {
        query: query,
        knnPrediction: predictedLabel,
        duckDuckGoResult: searchResult
    };
}

