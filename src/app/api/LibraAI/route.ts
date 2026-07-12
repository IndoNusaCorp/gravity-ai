import OpenAI from "openai";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

//Disini menggunakan metode POST untuk mengirimkan ke server deepseek / openai dan menerima 
//Respon model dari server ke project gravity ai
export async function POST(request: NextRequest) {

    //Disini menggunakan try catch untuk menerima respon model dari server
    try {

        //Menerima pesan dari request body (message wajib, type & history opsional)
        const { message, type, history } = await request.json();
        
        //Konfigurasi Sistem
        const ConfigurationSystem = new OpenAI({
            //BaseURL
            baseURL: 'https://api.deepseek.com',

            //Kunci API
            apiKey: process.env.NEXT_PUBLIC_LIBRAAI_API_KEY,
        });

        //System prompt default
        let systemPrompt = `Kamu adalah LibraAI 3.2.
                    Kamu adalah Model AI Versi beta.
                    Respon pakai bahasa indonesia profesional.
                    Gunakan Saya dan anda.`;

        //System prompt khusus untuk fitur Buat Paper
        if (type === 'paper_research') {
            systemPrompt = `Kamu adalah LibraAI 3.2, Teman AI akademis.
                    Tugasmu adalah membantu membuat paper research ilmiah yang lengkap dan profesional.
                    Gunakan struktur: Judul, Abstrak, Pendahuluan, Tinjauan Pustaka, Metodologi, Hasil dan Pembahasan, Kesimpulan, Daftar Pustaka (Dengan format APA Style dan untuk IEEE optional).
                    Gunakan bahasa Indonesia akademis yang baku, ilmiah, dan objektif.
                    Format output menggunakan Markdown.
                    Jangan terbalik strukturnya, Harus pas.`;
        } else if (type === 'paper_skripsi') {
            systemPrompt = `Kamu adalah LibraAI 3.2, Teman AI akademis.
                    Tugasmu adalah membantu membuat draf skripsi yang lengkap dan profesional.
                    Gunakan struktur: Judul, Abstrak, BAB I Pendahuluan, BAB II Tinjauan Pustaka, BAB III Metodologi Penelitian, BAB IV Hasil dan Pembahasan, BAB V Kesimpulan dan Saran, Daftar Pustaka (Dengan format APA Style dan untuk IEEE optional).
                    Gunakan bahasa Indonesia akademis yang baku, ilmiah, dan objektif.
                    Format output menggunakan Markdown.
                    Jangan terbalik strukturnya, Harus pas.`;
        } else if (type === 'paper_artikel') {
            systemPrompt = `Kamu adalah LibraAI 3.2, Teman AI akademis.
                    Tugasmu adalah membantu membuat artikel ilmiah yang lengkap dan profesional.
                    Gunakan struktur: Judul, Abstrak, Kata Kunci, Pendahuluan, Metode, Hasil, Pembahasan, Kesimpulan, Daftar Pustaka (Dengan format APA Style dan untuk IEEE optional).
                    Gunakan bahasa Indonesia akademis yang baku, ilmiah, dan objektif.
                    Format output menggunakan Markdown.
                    Jangan terbalik strukturnya, Harus pas.`;
        }

        //Menyusun array messages untuk dikirim ke DeepSeek
        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
            { role: "system", content: systemPrompt },
        ];

        //Menyertakan conversation history jika ada
        if (Array.isArray(history) && history.length > 0) {
            for (const msg of history) {
                if (msg.content && (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system')) {
                    messages.push({ role: msg.role, content: msg.content });
                }
            }
        }

        //Menambahkan pesan user saat ini
        messages.push({ role: "user", content: message });

        //Konfigurasi Model
        const ConfigurationModel = await ConfigurationSystem.chat.completions.create({
            model: "deepseek-v4-pro",
            messages,
            thinking: {"type": "enabled"},
            reasoning_effort: "medium",
            stream: true
        } as any);

        // Menggunakan ReadableStream untuk mengirim SSE (Server-Sent Events) ke frontend
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            //Memulai Server Sent Events (SSE) dan mengirimkannya ke frontend
            async start(controller) {
                try {
                    //Loop untuk menerima chunk dari model AI (bagian-bagian)
                    for await (const chunk of ConfigurationModel as any) {
                        const choice = chunk.choices?.[0];
                        if (!choice) continue;

                        const delta = choice.delta as any;
                        if (delta?.reasoning_content) {
                            // Kirim potongan pemikiran (reasoning)
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`));
                        }
                        if (delta?.content) {
                            // Kirim potongan konten (jawaban)
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`));
                        }
                    }
                    // Kirim sinyal selesai
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        // Mengembalikan response stream
        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        //Pesan error di console
        console.error("Sistem LibraAI gagal merespon", error);

        //Mengembalikan pesan error dalam format JSON
        return NextResponse.json(
            { error: "Sistem LibraAI Gagal, Silahkan Coba lagi" },
            { status: 500 }
        );
    }
}