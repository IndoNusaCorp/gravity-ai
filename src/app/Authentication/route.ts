import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase Client
const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseAnonKey);
};

export async function POST(req: NextRequest) {
    const supabase = getSupabaseClient();

    try {
        // Ambil data dari body request
        const getuser = await req.json();

        // fetch data authentication from supabase (for login feature)
        const { data: loginAuth, error } = await supabase.auth.signInWithPassword({
            email: getuser.email,
            password: getuser.password,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ loginAuth });
    } catch (error) {
        console.error("Error connecting to supabase:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// fetch data authentication from supabase (for register feature)
export async function GET(req: NextRequest) {
    const supabase = getSupabaseClient();

    try {
        let getuser;
        // Catatan: Standar HTTP GET biasanya tidak membawa body, melainkan dikirim sebagai parameter URL.
        // Kode di bawah ini mengambil dari URL params terlebih dahulu (misal: ?email=x&password=y), 
        // namun jika kosong akan tetap mencoba fallback membaca req.json() (hanya jika ada body).
        const email = req.nextUrl.searchParams.get("email");
        const password = req.nextUrl.searchParams.get("password");
        const username = req.nextUrl.searchParams.get("username");

        if (email && password) {
            getuser = { email, password, username };
        } else {
            getuser = await req.json();
        }

        const { data: registerAuth, error } = await supabase.auth.signUp({
            email: getuser.email,
            password: getuser.password,
            // Simpan 'username' ke dalam metadata profil user
            options: {
                data: {
                    username: getuser.username
                }
            }
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ registerAuth });
    } catch (error) {
        console.error("Error connecting to supabase:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}