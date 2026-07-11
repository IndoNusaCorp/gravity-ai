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
    } catch (error) {
        console.error("Sign in with google system error, please try again", error);
        throw error;
    }
}