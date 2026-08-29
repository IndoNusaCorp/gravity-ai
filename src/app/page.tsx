"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { Authentication, LastDocument } from "../firebase/firebase.configuration";
import {
  FileText,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Clock,
  Moon,
  Sun,
  User,
  X,
  Trash2,
} from "lucide-react";
import { ClearAutoSave, ListAutoSaves } from "@/components/autosave";

//bentuk satu baris dokumen di daftar "dokumen terakhir"
type DocumentItem = {
  id: string;
  title: string;
  snippet: string;
  pageCount: number;
  savedAt: number;
  //alamat dokumennya, disusun dari nama + id yang tersimpan bersama naskah
  href: string;
};

//ubah innerHTML editor jadi teks polos supaya bisa dipakai judul & cuplikan
function getPlainText(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return (container.textContent || "").replace(/\s+/g, " ").trim();
}

//format waktu simpan jadi kalimat yang gampang dibaca
function formatSavedTime(savedAt: number) {
  const elapsed = Date.now() - savedAt;
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;

  return new Date(savedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

//tombol ganti tema, dipisah supaya tidak ikut render sebelum mounting selesai
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  //next-themes baru tahu tema asli setelah render di browser
  useEffect(() => setIsMounted(true), []);

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Ganti tema"
      className="p-2.5 rounded-full text-[#0D0606] dark:text-[#D9E4D1] hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10 transition-colors"
    >
      {isMounted && resolvedTheme === "dark" ? (
        <Sun className="w-[18px] h-[18px]" />
      ) : (
        <Moon className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}

//kertas mini yang jadi thumbnail dokumen — meniru bentuk halaman di editor
function PaperPreview({ snippet }: { snippet: string }) {
  return (
    <div className="relative h-40 sm:h-44 overflow-hidden bg-[#D9E4D1] dark:bg-[#0D0606] border-b border-[#0D0606]/10 dark:border-[#D9E4D1]/10">
      <div className="absolute inset-x-4 top-4 bottom-0 bg-white/50 dark:bg-white/5 rounded-t-sm shadow-sm px-3 pt-3">
        <p className="text-[7px] leading-[1.5] text-[#0D0606]/60 dark:text-[#D9E4D1]/50 line-clamp-[12] break-words">
          {snippet}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  //daftar dokumen dibaca dari localStorage, jadi hanya tersedia di browser
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  //kata kunci pencarian dan mode tampilan (grid seperti Docs, atau daftar)
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  //foto profil dari akun yang sedang masuk, dipakai di pojok kanan atas
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    //tiap dokumen punya kuncinya sendiri sekarang, jadi daftarnya bisa lebih dari satu
    const semua = ListAutoSaves();

    setDocuments(
      semua.flatMap((saved) => {
        if (saved.halaman.length === 0) return [];

        //cuplikan diambil dari seluruh isi naskah
        const fullText = saved.halaman.map(getPlainText).join(" ").trim();
        if (!fullText) return [];

        //pakai nama yang diberi user; kalau masih bawaan, jatuh ke baris pertama naskah
        const firstLine = getPlainText(saved.halaman[0]);
        const title =
          saved.name && saved.name !== "untitled"
            ? saved.name
            : firstLine.slice(0, 60) || "Dokumen Tanpa Judul";

        return [{
          id: saved.documentId,
          title,
          snippet: fullText.slice(0, 400),
          pageCount: saved.pageNumber,
          savedAt: saved.savedAt,
          href: `/create_document/${encodeURIComponent(saved.name || "untitled")}/${saved.documentId}`,
        }];
      })
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    //pola yang sama dipakai di BottomBar untuk membaca akun yang sedang masuk
    const unsubscribe = onAuthStateChanged(Authentication, async (user) => {
      setPhotoURL(user?.photoURL || null);

      //naskah di Firestore hanya bisa dibaca kalau ada akun yang masuk,
      //karena aturannya membatasi tiap dokumen pada uid pemiliknya
      if (!user) return;

      try {
        //create_document/last_document/<uid> — satu dokumen per naskah tersimpan
        const snapshot = await getDocs(
          collection(LastDocument, "create_document", "last_document", user.uid)
        );

        const dariFirestore = snapshot.docs.flatMap((entry) => {
          const saved = entry.data() as {
            name?: string;
            pageNumber?: number;
            halaman?: string[];
            savedAt?: number;
          };

          const halaman = Array.isArray(saved.halaman) ? saved.halaman : [];
          if (halaman.length === 0) return [];

          const fullText = halaman.map(getPlainText).join(" ").trim();
          if (!fullText) return [];

          const firstLine = getPlainText(halaman[0]);
          const name = saved.name || "untitled";
          const title =
            name !== "untitled"
              ? name
              : firstLine.slice(0, 60) || "Dokumen Tanpa Judul";

          return [{
            id: entry.id,
            title,
            snippet: fullText.slice(0, 400),
            pageCount: saved.pageNumber ?? halaman.length,
            savedAt: saved.savedAt ?? 0,
            href: `/create_document/${encodeURIComponent(name)}/${entry.id}`,
          }];
        });

        //gabungkan dengan yang sudah dibaca dari localStorage. Satu naskah bisa
        //ada di dua tempat, jadi yang dipakai versi dengan waktu simpan terbaru.
        setDocuments((sebelumnya) => {
          const gabungan = new Map<string, DocumentItem>();

          for (const item of [...sebelumnya, ...dariFirestore]) {
            const lama = gabungan.get(item.id);
            if (!lama || item.savedAt > lama.savedAt) gabungan.set(item.id, item);
          }

          return [...gabungan.values()].sort((a, b) => b.savedAt - a.savedAt);
        });
      } catch (error) {
        console.log("baca dokumen dari Firestore gagal", error);
      }
    });

    return () => unsubscribe();
  }, []);

  //dokumen yang sedang menunggu konfirmasi hapus. Menghapus naskah tidak bisa
  //dibatalkan, jadi selalu lewat dialog dulu — bukan langsung dari sekali klik.
  const [pendingDelete, setPendingDelete] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteDocument = async (item: DocumentItem) => {
    setIsDeleting(true);

    //naskah bisa hidup di dua tempat; keduanya dibersihkan di dalam ClearAutoSave.
    //uid diambil di sini supaya terlihat jelas bahwa penghapusan salinan Firestore
    //bergantung pada akun yang sedang masuk.
    const user = Authentication.currentUser;
    await ClearAutoSave(item.id, user?.uid);

    setDocuments((sebelumnya) => sebelumnya.filter((doc) => doc.id !== item.id));
    setPendingDelete(null);
    setIsDeleting(false);
  };

  //saring dokumen berdasarkan kata kunci di judul maupun isi naskah
  const filteredDocuments = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return documents;

    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(keyword) ||
        doc.snippet.toLowerCase().includes(keyword)
    );
  }, [documents, searchQuery]);

  return (
    <div className="min-h-screen bg-[#D9E4D1]/50 dark:bg-[#0D0606]/50 font-sans transition-colors duration-300">
      {/* Bilah atas — logo, pencarian, akun */}
      <header className="sticky top-0 z-40 animate-fade-in-down backdrop-blur-xl bg-[#D9E4D1]/70 dark:bg-[#0D0606]/70 border-b border-[#0D0606]/10 dark:border-[#D9E4D1]/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center gap-3 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[#0D0606] dark:bg-[#D9E4D1] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#D9E4D1] dark:text-[#0D0606]" />
            </div>
            {/* Nama produk disembunyikan di layar kecil supaya kolom cari dapat ruang */}
            <span className="hidden sm:block font-semibold tracking-tight text-[#0D0606] dark:text-[#D9E4D1]">
              Gravity AI
            </span>
          </Link>

          {/* Kolom pencarian */}
          <div className="flex-1 min-w-0 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0D0606]/40 dark:text-[#D9E4D1]/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Telusuri dokumen"
              className="w-full h-11 pl-11 pr-10 rounded-full text-sm bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 text-[#0D0606] dark:text-[#D9E4D1] placeholder:text-[#0D0606]/40 dark:placeholder:text-[#D9E4D1]/40 border border-transparent focus:border-[#0D0606]/20 dark:focus:border-[#D9E4D1]/20 focus:bg-[#0D0606]/[0.03] dark:focus:bg-[#D9E4D1]/5 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#0D0606]/50 dark:text-[#D9E4D1]/50 hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            {/* Avatar akun; ikon biasa dipakai kalau belum masuk */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 flex items-center justify-center">
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoURL} alt="Foto profil" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-[#0D0606]/50 dark:text-[#D9E4D1]/50" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Baris "mulai dokumen baru" */}
        <section className="pt-8 pb-10 animate-fade-in-up stagger-1">
          <h2 className="text-sm font-medium text-[#0D0606] dark:text-[#D9E4D1] mb-4">
            Mulai dokumen baru
          </h2>

          <Link
            href="/create_document"
            className="group block w-[132px] active:scale-[0.97] transition-transform duration-200"
          >
            <div className="h-[172px] rounded-lg border border-[#0D0606]/15 dark:border-[#D9E4D1]/15 bg-white/50 dark:bg-[#D9E4D1]/5 flex items-center justify-center group-hover:border-[#0D0606]/50 dark:group-hover:border-[#D9E4D1]/50 transition-colors">
              <Plus className="w-8 h-8 text-[#0D0606]/40 dark:text-[#D9E4D1]/40 group-hover:text-[#0D0606] dark:group-hover:text-[#D9E4D1] transition-colors" />
            </div>
            <p className="mt-2.5 text-sm font-medium text-[#0D0606] dark:text-[#D9E4D1]">
              Kosong
            </p>
          </Link>
        </section>

        {/* Daftar dokumen terakhir */}
        <section className="pb-16">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-medium text-[#0D0606] dark:text-[#D9E4D1]">
              Dokumen terakhir
            </h2>

            {/* Pengalih tampilan grid / daftar */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10">
              <button
                onClick={() => setViewMode("grid")}
                aria-label="Tampilan grid"
                className={`p-2 rounded-full transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#0D0606] dark:bg-[#D9E4D1] text-[#D9E4D1] dark:text-[#0D0606]"
                    : "text-[#0D0606]/50 dark:text-[#D9E4D1]/50 hover:text-[#0D0606] dark:hover:text-[#D9E4D1]"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="Tampilan daftar"
                className={`p-2 rounded-full transition-colors ${
                  viewMode === "list"
                    ? "bg-[#0D0606] dark:bg-[#D9E4D1] text-[#D9E4D1] dark:text-[#0D0606]"
                    : "text-[#0D0606]/50 dark:text-[#D9E4D1]/50 hover:text-[#0D0606] dark:hover:text-[#D9E4D1]"
                }`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Keadaan kosong: belum ada naskah sama sekali */}
          {!isLoading && documents.length === 0 && (
            <div className="py-20 text-center animate-scale-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#0D0606]/40 dark:text-[#D9E4D1]/40" />
              </div>
              <p className="mt-4 text-sm font-medium text-[#0D0606] dark:text-[#D9E4D1]">
                Belum ada dokumen
              </p>
              <p className="mt-1.5 text-sm text-[#0D0606]/60 dark:text-[#D9E4D1]/60">
                Dokumen yang kamu tulis akan muncul di sini.
              </p>
            </div>
          )}

          {/* Keadaan kosong: ada dokumen, tapi tidak cocok dengan pencarian */}
          {!isLoading && documents.length > 0 && filteredDocuments.length === 0 && (
            <div className="py-20 text-center animate-fade-in">
              <p className="text-sm font-medium text-[#0D0606] dark:text-[#D9E4D1]">
                Tidak ada yang cocok dengan &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="mt-1.5 text-sm text-[#0D0606]/60 dark:text-[#D9E4D1]/60">
                Coba kata kunci lain.
              </p>
            </div>
          )}

          {/* Tampilan grid — kartu dengan pratinjau kertas */}
          {viewMode === "grid" && filteredDocuments.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* relative supaya tombol hapus bisa mengambang di atas kartu */}
                  <div className="relative">
                    <Link
                      href={doc.href}
                      className="group block rounded-lg overflow-hidden border border-[#0D0606]/15 dark:border-[#D9E4D1]/15 hover:border-[#0D0606]/50 dark:hover:border-[#D9E4D1]/50 transition-colors"
                    >
                      <PaperPreview snippet={doc.snippet} />

                      <div className="p-3 bg-white/40 dark:bg-[#D9E4D1]/5">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 mt-0.5 shrink-0 text-[#0D0606]/60 dark:text-[#D9E4D1]/60" />
                          {/* pr-6 memberi ruang supaya judul panjang tidak tertutup tombol hapus */}
                          <p className="text-sm font-medium leading-snug text-[#0D0606] dark:text-[#D9E4D1] line-clamp-2 pr-6">
                            {doc.title}
                          </p>
                        </div>
                        <p className="mt-2 text-xs text-[#0D0606]/50 dark:text-[#D9E4D1]/50">
                          {formatSavedTime(doc.savedAt)}
                        </p>
                      </div>
                    </Link>

                    {/* Tombol hapus berada di luar Link — kalau di dalam, kliknya
                        ikut membuka dokumen sekalipun sudah preventDefault */}
                    <button
                      onClick={() => setPendingDelete(doc)}
                      aria-label={`Hapus ${doc.title}`}
                      title="Hapus dokumen"
                      className="absolute bottom-2.5 right-2 p-1.5 rounded-full text-[#0D0606]/40 dark:text-[#D9E4D1]/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tampilan daftar — satu baris per dokumen */}
          {viewMode === "list" && filteredDocuments.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-[#0D0606]/10 dark:border-[#D9E4D1]/10 divide-y divide-[#0D0606]/10 dark:divide-[#D9E4D1]/10">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 pr-2 bg-white/40 dark:bg-[#D9E4D1]/5 hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/10 transition-colors animate-fade-in"
                >
                  <Link
                    href={doc.href}
                    className="flex flex-1 min-w-0 items-center gap-3 px-4 py-3.5"
                  >
                    <FileText className="w-4 h-4 shrink-0 text-[#0D0606]/60 dark:text-[#D9E4D1]/60" />

                    <p className="flex-1 min-w-0 truncate text-sm font-medium text-[#0D0606] dark:text-[#D9E4D1]">
                      {doc.title}
                    </p>

                    {/* Jumlah halaman disembunyikan di layar kecil supaya judul tidak terpotong */}
                    <span className="hidden sm:block shrink-0 text-xs text-[#0D0606]/50 dark:text-[#D9E4D1]/50">
                      {doc.pageCount} halaman
                    </span>

                    <span className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[#0D0606]/50 dark:text-[#D9E4D1]/50">
                      <Clock className="w-3.5 h-3.5" />
                      {formatSavedTime(doc.savedAt)}
                    </span>
                  </Link>

                  <button
                    onClick={() => setPendingDelete(doc)}
                    aria-label={`Hapus ${doc.title}`}
                    title="Hapus dokumen"
                    className="shrink-0 p-2 rounded-full text-[#0D0606]/40 dark:text-[#D9E4D1]/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Konfirmasi hapus — naskah yang sudah dibuang tidak bisa dikembalikan */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !isDeleting && setPendingDelete(null)}
            className="absolute inset-0 bg-[#0D0606]/40 backdrop-blur-sm animate-fade-in"
          />

          <div className="relative w-full max-w-sm p-6 rounded-2xl bg-[#D9E4D1] dark:bg-[#0D0606] border border-[#0D0606]/10 dark:border-[#D9E4D1]/10 shadow-xl animate-scale-in">
            <h3 className="text-base font-semibold text-[#0D0606] dark:text-[#D9E4D1]">
              Hapus dokumen?
            </h3>
            <p className="mt-2 text-sm text-[#0D0606]/70 dark:text-[#D9E4D1]/70">
              &ldquo;{pendingDelete.title}&rdquo; akan dihapus permanen. Tindakan ini
              tidak bisa dibatalkan.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full text-sm font-medium text-[#0D0606] dark:text-[#D9E4D1] hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteDocument(pendingDelete)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Menghapus…" : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
