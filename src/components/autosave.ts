//komponen auto save (tersimpan di localstorage)

import { deleteDoc, doc } from "firebase/firestore";
import { Authentication, LastDocument } from "@/firebase/firebase.configuration";

//awalan kunci penyimpanan di localstorage. Kunci sebenarnya selalu diakhiri
//document_id dari URL, supaya tiap dokumen punya slot sendiri dan tidak
//saling menimpa seperti dulu waktu kuncinya masih satu untuk seluruh aplikasi.
const AUTOSAVE_PREFIX = "gravity-ai-autosave";

//susun kunci autosave milik satu dokumen
const autosaveKey = (documentId: string) => `${AUTOSAVE_PREFIX}-${documentId}`;

//bentuk gambar yang diupload ke atas kertas
export type UploadedImage = {
    id: string;
    src: string;
    x: number;
    y: number;
};

//bentuk data yang disimpan: jumlah halaman + isi tiap halaman + gambar upload
type AutoSaveData = {
    pageNumber: number;
    halaman: string[];
    images: UploadedImage[];
    savedAt: number;
    //nama dokumen ikut disimpan karena aslinya cuma ada di URL,
    //sementara homepage perlu menyusun ulang alamat tiap dokumen
    name: string;
};

//bentuk ringkas untuk daftar dokumen di homepage
export type AutoSaveEntry = AutoSaveData & { documentId: string };

export function AutoSave(documentId: string, name: string, pageNumber: number, images: UploadedImage[] = []) {
    //Tujuan auto save adalah localstorage
    const autosaveatlocalstorage = (key: string, value: string) => localStorage.setItem(key, value);

    //set auto save berfungsi untuk beberapa detik bakal auto save ke localstorage
    const setautosave = setTimeout(() => {
        //ambil isi naskah dari tiap halaman editor yang sedang tampil
        const halaman: string[] = [];
        for (let i = 0; i < pageNumber; i++) {
            const editor = document.getElementById(`main-editor-${i}`);
            halaman.push(editor ? editor.innerHTML : "");
        }

        //logika if else untuk autosave
        try {
            const autosavetolocalstorage: AutoSaveData = { pageNumber, halaman, images, savedAt: Date.now(), name };
            autosaveatlocalstorage(autosaveKey(documentId), JSON.stringify(autosavetolocalstorage));
            console.log("auto save berhasil");
        } catch (error) {
            //gagal biasanya karena localstorage penuh atau diblokir browser
            console.log("auto save gagal", error);
        }
    }, 5000); //secara default 5 detik

    //kembalikan id timer supaya pemanggil bisa membatalkannya saat user masih mengetik
    return setautosave;
}

//komponen restore, dipakai saat halaman pertama kali dibuka
export function RestoreAutoSave(documentId: string): AutoSaveData | null {
    try {
        const tersimpan = localStorage.getItem(autosaveKey(documentId));
        if (!tersimpan) return null;

        const data = JSON.parse(tersimpan) as AutoSaveData;
        if (!Array.isArray(data.halaman) || typeof data.pageNumber !== "number") return null;

        //naskah lama (sebelum gambar & nama ikut disimpan) tetap bisa dipulihkan
        return {
            ...data,
            images: Array.isArray(data.images) ? data.images : [],
            name: typeof data.name === "string" ? data.name : "untitled",
        };
    } catch (error) {
        console.log("restore auto save gagal", error);
        return null;
    }
}

//kumpulkan semua dokumen tersimpan, dipakai homepage untuk daftar "Dokumen terakhir".
//localStorage tidak bisa dicari berdasarkan awalan, jadi kuncinya ditelusuri satu per satu.
export function ListAutoSaves(): AutoSaveEntry[] {
    const entries: AutoSaveEntry[] = [];

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(`${AUTOSAVE_PREFIX}-`)) continue;

            const documentId = key.slice(AUTOSAVE_PREFIX.length + 1);
            const data = RestoreAutoSave(documentId);
            if (data) entries.push({ ...data, documentId });
        }
    } catch (error) {
        console.log("baca daftar dokumen gagal", error);
    }

    //yang paling baru disimpan tampil paling atas
    return entries.sort((a, b) => b.savedAt - a.savedAt);
}

//komponen hapus, dipakai kalau user mau membuang satu dokumen.
//Satu naskah bisa hidup di dua tempat, jadi keduanya dibersihkan di sini
//supaya pemanggilnya tidak perlu ingat menghapus dua kali.
//userId dioper dari pemanggil (Authentication.currentUser) supaya jelas terlihat
//di tempat tombol hapus ditekan bahwa penghapusan Firestore bergantung pada akun
export async function ClearAutoSave(documentId: string, userId?: string) {
    //localStorage duluan: tidak butuh jaringan dan tidak mungkin gagal,
    //jadi ruang penyimpanannya langsung lega walau Firestore-nya bermasalah
    try {
        localStorage.removeItem(autosaveKey(documentId));
        localStorage.removeItem(settingsKey(documentId, "font"));
        localStorage.removeItem(settingsKey(documentId, "paper"));
    } catch (error) {
        console.log("hapus auto save gagal", error);
    }

    //salinan di Firestore hanya ada kalau user pernah menekan tombol Simpan,
    //dan hanya bisa dihapus oleh pemiliknya sendiri. Kalau pemanggilnya tidak
    //mengoper uid, dibaca sendiri dari sesi yang sedang aktif.
    const uid = userId ?? Authentication.currentUser?.uid;
    if (!uid) return;

    try {
        await deleteDoc(
            doc(LastDocument, "create_document", "last_document", uid, documentId)
        );
    } catch (error) {
        console.log("hapus dokumen di Firestore gagal", error);
    }
}

//kunci penyimpanan untuk pengaturan (font & kertas)
const SETTINGS_KEY = "gravity-ai-setting";

//Pengaturan juga per-dokumen, seperti Google Docs: font & ukuran kertas
//melekat pada naskahnya, bukan pada aplikasinya.
const settingsKey = (documentId: string, name: string) => `${SETTINGS_KEY}-${name}-${documentId}`;

//Pengaturan toolbar tidak ikut tersimpan di innerHTML editor, jadi disimpan
//terpisah. Tiap komponen memakai namanya sendiri: "font" dan "paper".
export function SaveSettings(documentId: string, name: string, settings: Record<string, unknown>) {
    try {
        localStorage.setItem(settingsKey(documentId, name), JSON.stringify(settings));
    } catch (error) {
        console.log("simpan pengaturan gagal", error);
    }
}

export function RestoreSettings<T>(documentId: string, name: string): T | null {
    try {
        const tersimpan = localStorage.getItem(settingsKey(documentId, name));
        if (!tersimpan) return null;

        return JSON.parse(tersimpan) as T;
    } catch (error) {
        console.log("baca pengaturan gagal", error);
        return null;
    }
}
