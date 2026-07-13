import { connecttolibradrivestorage } from "./firebase.configuration";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import { Authentication } from "./firebase.configuration";
import { getDownloadURL } from "firebase/storage";

//File Ekstensi yang didukung untuk disimpan ke libradrive
const supportedFileExtensions = [".docx", ".pdf"];

//Simpan File ke Libra Drive (Logika backend)

//configuration untuk fungsi menyimpan file ke libradrive
//Fungsi ini hanya membuat storageRef dan mengembalikannya, TIDAK melakukan upload atau delete
export async function ConfigurationSaveFileToLibraDrive(file: File, collectionName: string) {
    //Mengkoneksikan ke sistem auth untuk mengambil user id
    const user = Authentication.currentUser;

    //Mengkoneksikan Ke Storage LibraDrive
    const connectstorage = connecttolibradrivestorage;

    //FolderName untuk membuat folder
    const folderName = collectionName ? collectionName.trim() : "Recent Documents";
    
    //Cek apakah user sudah login
    if (!user) {
        //Jika terdeteksi belum login maka akan keluar pesan user belum login dan menyuruh user untuk login
        throw new Error("User belum login, silahkan login terlebih dahulu");
    }

    //Letak Sistem LibraDrive - mengembalikan referensi storage
    const storageRef = ref(connecttolibradrivestorage, `LibraDrive/${user.uid}/${folderName}/${file.name}`);

    //Mengembalikan storageRef agar bisa digunakan oleh fungsi Save dan Delete
    return storageRef;
}

//Fungsi untuk menyimpan file ke libradrive
export async function SaveFileToLibraDrive(file: File, collectionName: string) {
    //Sistem akan mulai pengecekan apakah file yang diupload sudah sesuai dengan ekstensi file yang sudah di tentukan atau belum
    //Default file extention adalah docx dan pdf
    const CheckFileExtension = supportedFileExtensions.some(ext => file.name.endsWith(ext));

    //Logika Jika File tidak sesuai dengan ekstensi
    if (!CheckFileExtension) {
        throw new Error("Sistem tidak menerima file jenis ini, silahkan coba lagi dengan file berformat docx atau pdf");
    }

    //Mencoba untuk Simpan File Ke LibraDrive
    try {
        //Menghubungkan Sistem konfigurasi dan Menghubungkan Sistem LibraDrive
        const storageRef = await ConfigurationSaveFileToLibraDrive(file, collectionName);

        //Sistem terpenting untuk simpan file ke libradrive via uploadBytes
        const SaveFileResult = await uploadBytes(storageRef, file);

        console.log("File berhasil diupload ke LibraDrive:", SaveFileResult.metadata.fullPath);

        //Function supaya setelah di simpan di libra drive hasil simpan file dari gravity ai bisa di preview
        const PreviewFile = await getDownloadURL(storageRef);

        return SaveFileResult;
    } catch (error) {
        //Pesan error ke Console
        console.error("Error saat menyimpan file:", error);
        throw error;
    }
}

export async function DeleteFileFromLibraDrive(file: File, collectionName: string) {
    //Mencoba untuk Delete File Dari LibraDrive
    try {
        //Menghubungkan ke configuration dan mendapatkan storageRef
        const storageRef = await ConfigurationSaveFileToLibraDrive(file, collectionName);

        //Sistem untuk menghapus file dari libradrive via deleteObject
        await deleteObject(storageRef);

        console.log("File berhasil dihapus dari LibraDrive");
    } catch (error) {
        //Pesan error ke Console
        console.error("Error saat delete file:", error);
        throw error;
    }
}