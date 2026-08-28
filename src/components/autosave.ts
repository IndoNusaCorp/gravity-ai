//komponen auto save (tersimpan di localstorage)

//kunci penyimpanan di localstorage
const AUTOSAVE_KEY = "gravity-ai-autosave";

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
};

export function AutoSave(pageNumber: number, images: UploadedImage[] = []) {
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
            const autosavetolocalstorage: AutoSaveData = { pageNumber, halaman, images, savedAt: Date.now() };
            autosaveatlocalstorage(AUTOSAVE_KEY, JSON.stringify(autosavetolocalstorage));
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
export function RestoreAutoSave(): AutoSaveData | null {
    try {
        const tersimpan = localStorage.getItem(AUTOSAVE_KEY);
        if (!tersimpan) return null;

        const data = JSON.parse(tersimpan) as AutoSaveData;
        if (!Array.isArray(data.halaman) || typeof data.pageNumber !== "number") return null;

        //naskah lama (sebelum gambar ikut disimpan) tetap bisa dipulihkan
        return { ...data, images: Array.isArray(data.images) ? data.images : [] };
    } catch (error) {
        console.log("restore auto save gagal", error);
        return null;
    }
}

//komponen hapus, dipakai kalau user mau mulai naskah baru dari kosong
export function ClearAutoSave() {
    try {
        localStorage.removeItem(AUTOSAVE_KEY);
        localStorage.removeItem(`${SETTINGS_KEY}-font`);
        localStorage.removeItem(`${SETTINGS_KEY}-paper`);
    } catch (error) {
        console.log("hapus auto save gagal", error);
    }
}

//kunci penyimpanan untuk pengaturan (font & kertas)
const SETTINGS_KEY = "gravity-ai-setting";

//Pengaturan toolbar tidak ikut tersimpan di innerHTML editor, jadi disimpan
//terpisah. Tiap komponen memakai namanya sendiri: "font" dan "paper".
export function SaveSettings(name: string, settings: Record<string, unknown>) {
    try {
        localStorage.setItem(`${SETTINGS_KEY}-${name}`, JSON.stringify(settings));
    } catch (error) {
        console.log("simpan pengaturan gagal", error);
    }
}

export function RestoreSettings<T>(name: string): T | null {
    try {
        const tersimpan = localStorage.getItem(`${SETTINGS_KEY}-${name}`);
        if (!tersimpan) return null;

        return JSON.parse(tersimpan) as T;
    } catch (error) {
        console.log("baca pengaturan gagal", error);
        return null;
    }
}
