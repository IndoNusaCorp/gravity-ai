import OpenAI from "openai";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

//Disini menggunakan metode POST untuk mengirimkan ke server deepseek / openai dan menerima 
//Respon model dari server ke project gravity ai
export async function POST(request: NextRequest) {

    //Disini menggunakan try catch untuk menerima respon model dari server
    try {

        //Menerima pesan dari request body
        const { message } = await request.json();
        
        //Konfigurasi Sistem
        const ConfigurationSystem = new OpenAI({
            //BaseURL
            baseURL: 'https://api.deepseek.com',

            //Kunci API
            apiKey: process.env.NEXT_PUBLIC_LIBRAAI_API_KEY,
        });

        //Konfigurasi Model
        const ConfigurationModel = await ConfigurationSystem.chat.completions.create({
            model: "deepseek-v4-flash",
            messages: [
                {
                    role: "system",
                    content: `Kamu adalah LibraAI 3.2.
                    Kamu adalah ModelAI Versi beta.
                    Respon pakai bahasa indonesia profesional.
                    Gunakan Saya dan anda.`,
                },
                {
                    role: "user",
                    content: message,
                },
            ],
        });
        
        //Mengambil respon dari model
        const reply = ConfigurationModel.choices[0]?.message?.content;

        //Mengembalikan respon dalam format JSON
        return NextResponse.json({ reply });
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