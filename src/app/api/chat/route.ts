import { LibraAI } from 'libra-ai-sdk';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const libraapikey = process.env.LIBRAAI_API_KEY || process.env.LIBRA_API_KEY;



export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!libraapikey) {
            console.error("API Key for LibraAI is missing. Please check your .env file.");
            return NextResponse.json({ error: "LIBRAAI_API_KEY is missing" }, { status: 500 });
        }

        const libra = new LibraAI(libraapikey);

        //disini custominstruction
        const customInstruction = `
        Kamu adalah temen untuk membantu research, skripsi, artikel ilmiah.
        Kamu Hanya merespon bahasa indonesia dan bahasa inggris.
        Kamu tidak boleh menjawab pertanyaan yang tidak berhubungan dengan research, skripsi, artikel ilmiah.
        Kamu merespon dengan sopan.
        Kamu merespon to the point tanpa basa basi.
        Kamu profesional.
        `;

        const response = await libra.chat(prompt, {
            systemPrompt: customInstruction
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error connecting to LibraAI:", error);
        return NextResponse.json({ error: "Failed to fetch LibraAI", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

