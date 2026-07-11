import { signinwithpopup } from "./firebase.configuration";


export async function SignInAndRegisterWithGoogleSystem() {
    //Bagian sini untuk mencoba memanggil semua fungsi untuk kebutuhan sign in with google (menggunakan try catch)
    try {
        //menunggu respon dari sistem sign in with google 
        const waitresponfromsystemsigninwithgoogle = await signinwithpopup();

        //Pesan jika sistem sign in with google berhasil
        const messagesuccessforsigninwithgoogle = "Sign in with google Success"

        //Mengembalikan fungsi
        return waitresponfromsystemsigninwithgoogle;
    } catch (error: any) {
        // Detailed error logging untuk debugging
        console.error("=== Firebase Auth Error Details ===");
        console.error("Error Code:", error?.code);
        console.error("Error Message:", error?.message);
        console.error("Error Custom Data:", error?.customData);
        console.error("Full Error Object:", error);
        console.error("===================================");
        
        // Re-throw dengan pesan yang lebih informatif
        const errorMessage = error?.code 
            ? `Firebase: Error (${error.code}).`
            : error?.message || "Unknown authentication error";
        
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).code = error?.code;
        (enhancedError as any).originalError = error;
        throw enhancedError;
    }
}