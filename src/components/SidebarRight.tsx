"use client";

import { motion } from "framer-motion";
import { Settings, Printer, Palette, Layers, FileText, Image, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Authentication } from "../firebase/firebase.configuration";
import { AuthModal, AuthType } from "./AuthModal";

interface SidebarRightProps {
    onImageUpload?: (src: string) => void;
}

export function SidebarRight({ onImageUpload }: SidebarRightProps) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalType, setAuthModalType] = useState<AuthType>("login");

    //state untuk fitur download
    const [isDownload, setIsDownload] = useState(true);

    //State untuk koneksikan Authentication ke SidebarRight
    const [username, getusername] = useState<string | null>(null);
    const [email, getemail] = useState<string | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [password, getpassword] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // State untuk menyimpan warna kertas
    const [paperColor, setPaperColor] = useState("#ffffff");
    // State untuk menyimpan jenis/ukuran kertas (default A4)
    const [paperType, setPaperType] = useState("a4");

    const [uploadImage, setUploadImage] = useState<string | null>(null);

    // Daftar semua jenis/ukuran kertas yang tersedia (ada 30 jenis) beserta ukurannya dalam piksel
    const paperTypes = [
        { value: "a4", label: "A4 (210 x 297 mm)", width: "794px" },
        { value: "a3", label: "A3 (297 x 420 mm)", width: "1123px" },
        { value: "a5", label: "A5 (148 x 210 mm)", width: "559px" },
        { value: "b4", label: "B4 (250 x 353 mm)", width: "945px" },
        { value: "b5", label: "B5 (176 x 250 mm)", width: "665px" },
        { value: "letter", label: "Letter (8.5 x 11 in)", width: "816px" },
        { value: "legal", label: "Legal (8.5 x 14 in)", width: "816px" },
        { value: "tabloid", label: "Tabloid (11 x 17 in)", width: "1056px" },
        { value: "executive", label: "Executive (7.25 x 10.5 in)", width: "696px" },
        { value: "hvs", label: "HVS / Folio (8.5 x 13 in)", width: "816px" },
        { value: "f4", label: "F4 (210 x 330 mm)", width: "794px" },
        { value: "statement", label: "Statement (5.5 x 8.5 in)", width: "528px" },
        { value: "a6", label: "A6 (105 x 148 mm)", width: "397px" },
        { value: "a2", label: "A2 (420 x 594 mm)", width: "1587px" },
        { value: "a1", label: "A1 (594 x 841 mm)", width: "2245px" },
        { value: "a0", label: "A0 (841 x 1189 mm)", width: "3179px" },
        { value: "b6", label: "B6 (125 x 176 mm)", width: "472px" },
        { value: "b3", label: "B3 (353 x 500 mm)", width: "1334px" },
        { value: "b2", label: "B2 (500 x 707 mm)", width: "1890px" },
        { value: "b1", label: "B1 (707 x 1000 mm)", width: "2673px" },
        { value: "b0", label: "B0 (1000 x 1414 mm)", width: "3780px" },
        { value: "c4", label: "C4 (229 x 324 mm)", width: "865px" },
        { value: "c5", label: "C5 (162 x 229 mm)", width: "612px" },
        { value: "c6", label: "C6 (114 x 162 mm)", width: "431px" },
        { value: "dl", label: "DL (110 x 220 mm)", width: "416px" },
        { value: "monarch", label: "Monarch (3.875 x 7.5 in)", width: "372px" },
        { value: "10x15", label: "10x15 cm", width: "378px" },
        { value: "13x18", label: "13x18 cm", width: "491px" },
        { value: "quarto", label: "Quarto", width: "768px" },
        { value: "ledger", label: "Ledger", width: "1632px" },
    ];

    const downloadPaper = async (type: "pdf" | "docx") => {
        // 1. Cek izin download
        if (!isDownload) {
            console.warn("Download belum diizinkan.");
            return;
        }

        // Kumpulkan semua elemen kertas (mulai dari index 0 sampai tidak ada)
        const pages: HTMLElement[] = [];
        let index = 0;
        let p = document.getElementById(`main-editor-${index}`);
        while (p) {
            pages.push(p);
            index++;
            p = document.getElementById(`main-editor-${index}`);
        }

        if (pages.length === 0) {
            alert("Tidak ada kertas untuk di-download.");
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 10);
        const selectedFileName = `GravityAI_Document_${timestamp}`;

        if (type === "pdf") {
            try {
                // Gunakan dynamic import agar library ini hanya diload di sisi client
                // @ts-ignore
                const html2pdfModule = await import("html2pdf.js");
                const html2pdf = (html2pdfModule.default ? html2pdfModule.default : html2pdfModule) as any;

                // Buat container virtual untuk print
                const printContainer = document.createElement("div");
                // Harus di-append ke body agar html2canvas bisa mengkalkulasi style (seperti tinggi/lebar)
                printContainer.style.position = "absolute";
                printContainer.style.top = "-9999px";
                printContainer.style.left = "-9999px";
                printContainer.style.background = "white";
                printContainer.style.color = "black";
                document.body.appendChild(printContainer);

                // Fungsi bantuan untuk menghapus efek dark mode pada hasil print PDF
                const stripDarkClasses = (el: HTMLElement) => {
                    const classesToRemove = Array.from(el.classList).filter(c => c.startsWith('dark:'));
                    if (classesToRemove.length > 0) {
                        el.classList.remove(...classesToRemove);
                    }
                    // Jika elemen ini punya warna text spesifik putih, timpa dengan hitam
                    const computedColor = window.getComputedStyle(el).color;
                    if (computedColor === 'rgb(255, 255, 255)' || computedColor === '#ffffff' || el.classList.contains('text-white')) {
                        el.style.setProperty('color', '#18181b', 'important'); // Paksakan teks gelap
                    }

                    Array.from(el.children).forEach(child => {
                        stripDarkClasses(child as HTMLElement);
                    });
                };

                pages.forEach((pageDom, i) => {
                    // Clone sehingga kita tidak merusak DOM asli
                    const clone = pageDom.cloneNode(true) as HTMLElement;
                    
                    // Buang dark mode classes pada clone
                    stripDarkClasses(clone);
                    
                    // Reset styling agar pas dengan cetakan PDF
                    clone.style.width = "794px"; // Lebar kertas A4 statis agar margin konsisten
                    clone.style.minHeight = "auto";
                    clone.style.margin = "0";
                    clone.style.boxShadow = "none";
                    clone.style.border = "none";
                    clone.style.padding = "40px"; // Simulasi margin kertas
                    clone.style.background = "white"; // Paksa kertas putih

                    printContainer.appendChild(clone);

                    // Beri break per halaman kecuali halaman terakhir
                    if (i < pages.length - 1) {
                        const pageBreak = document.createElement("div");
                        pageBreak.className = "html2pdf__page-break";
                        printContainer.appendChild(pageBreak);
                    }
                });

                const opt = {
                    margin: 0,
                    filename: `${selectedFileName}.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, letterRendering: true, windowWidth: 1024 },
                    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
                };

                await html2pdf().set(opt).from(printContainer).save();
                
                // Cleanup container setelah selesai
                document.body.removeChild(printContainer);
                
            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Gagal membuat PDF. Pastikan module html2pdf.js beroperasi dengan baik.");
            }
        } else if (type === "docx") {
            // Trik DOCX: bungkus seluruh innerHTML dalam kerangka Microsoft Word
            let htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'><title>GravityAI Export</title></head><body>
            `;

            pages.forEach((pageDom) => {
                htmlContent += pageDom.innerHTML;
                htmlContent += "<br clear=all style='mso-special-character:line-break;page-break-before:always'>";
            });
            htmlContent += "</body></html>";

            // Buat Blob dengan format ms-word
            const blob = new Blob(['\ufeff', htmlContent], {
                type: "application/msword",
            });

            // Eksekusi download file
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${selectedFileName}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    // Effect ini berjalan jika pengguna mengganti warna atau jenis kertas.
    // Ia akan mengatur "CSS variables" (lebar kertas & warnanya) di HTML.
    // Karena layout kertas di page.tsx menggunakan CSS variables ini, kertasnya akan berubah ukuran dan warna seketika!
    useEffect(() => {
        document.documentElement.style.setProperty('--paper-color', paperColor);
        const selectedPaper = paperTypes.find(p => p.value === paperType);
        if (selectedPaper) {
            document.documentElement.style.setProperty('--paper-max-width', selectedPaper.width);
        }
    }, [paperColor, paperType]);

    //fungsi upload image
    // File input ref for image upload
    const fileInputRef = useRef<HTMLInputElement>(null);

    //fungsi trigger file input
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result && onImageUpload) {
                    onImageUpload(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
        // Reset input value supaya gambar yang sama bisa dipilih lagi jika perlu
        if (event.target) {
            event.target.value = '';
        }
    };

    //efek untuk mengambil data user dari firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(Authentication, (user) => {
            if (user) {
                getusername(user.displayName || null);
                getemail(user.email || null);
                setPhotoURL(user.photoURL || null);
            } else {
                getusername(null);
                getemail(null);
                setPhotoURL(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <>
            <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                className="fixed right-0 top-16 h-[calc(100%-4rem)] w-72 bg-[#D9E4D1] dark:bg-[#0D0606] backdrop-blur-xl border-l border-[#0D0606]/20 dark:border-[#D9E4D1]/20 p-6 z-40 hidden md:block pt-6 overflow-y-auto scrollbar-hide"
            >

                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 flex items-center justify-center border border-[#0D0606]/20 dark:border-[#D9E4D1]/20">
                        <User className="w-4 h-4 text-[#0D0606] dark:text-[#D9E4D1]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#0D0606] dark:text-[#D9E4D1]">Account</h2>
                </div>

                <div className="w-full mb-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0D0606]/5 dark:from-[#D9E4D1]/5 to-transparent rounded-2xl pointer-events-none" />
                    <div className="relative w-full p-5 bg-white/50 dark:bg-[#0D0606]/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-2xl shadow-lg">
                        
                        {loading ? (
                            <div className="flex items-center gap-4 animate-pulse">
                                <div className="w-14 h-14 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 rounded w-2/3" />
                                    <div className="h-3 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 rounded w-1/2" />
                                </div>
                            </div>
                        ) : email ? (
                            <div className="flex flex-col">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#0D0606]/20 dark:border-[#D9E4D1]/20 shadow-md">
                                        {photoURL ? (
                                            <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 flex items-center justify-center">
                                                <User className="w-6 h-6 text-[#0D0606] dark:text-[#D9E4D1]" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[#0D0606] dark:text-[#D9E4D1] font-semibold truncate text-sm">
                                            {username || email.split('@')[0]}
                                        </h3>
                                        <p className="text-xs text-[#0D0606]/60 dark:text-[#D9E4D1]/60 truncate mt-0.5">
                                            {email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        await signOut(Authentication);
                                        window.location.reload();
                                    }}
                                    className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium text-xs transition-all border border-red-500/20 hover:border-red-500/30 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center py-2">
                                <div className="w-14 h-14 mb-3 rounded-full bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 flex items-center justify-center border border-[#0D0606]/10 dark:border-[#D9E4D1]/10">
                                    <User className="w-6 h-6 text-[#0D0606]/40 dark:text-[#D9E4D1]/40" />
                                </div>
                                <h3 className="text-[#0D0606] dark:text-[#D9E4D1] font-medium text-sm mb-1">Not Logged In</h3>
                                <p className="text-xs text-[#0D0606]/60 dark:text-[#D9E4D1]/60 mb-5 max-w-[180px]">
                                    Sign in to sync your documents and settings.
                                </p>
                                <button
                                    onClick={() => { setAuthModalType('login'); setIsAuthModalOpen(true); }}
                                    className="w-full py-2.5 rounded-xl bg-[#0D0606] hover:bg-[#0D0606]/80 text-[#D9E4D1] dark:bg-[#D9E4D1] dark:hover:bg-[#D9E4D1]/80 dark:text-[#0D0606] font-medium text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    Sign in with Google
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-[#0D0606]/70 dark:text-[#D9E4D1]/70" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#0D0606] dark:text-[#D9E4D1]">Paper Settings</h2>
                </div>

                <div className="space-y-8">
                    {/* Paper Size Settings */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Paper Size
                        </label>
                        <div className="relative">
                            <select
                                value={paperType}
                                onChange={(e) => setPaperType(e.target.value)}
                                className="w-full appearance-none bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 text-[#0D0606] dark:text-[#D9E4D1] text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0D0606] dark:focus:ring-[#D9E4D1] transition-all cursor-pointer"
                            >
                                {paperTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Color Settings */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5" /> Paper Color
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {["#ffffff", "#f8f9fa", "#fdf6e3", "#fcfcfc", "#f0f4f8", "#000000"].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setPaperColor(color)}
                                    className={`w-full aspect-square rounded-full border-2 transition-transform duration-200 ${paperColor === color
                                        ? "border-[#0D0606] dark:border-[#D9E4D1] scale-110 shadow-sm"
                                        : "border-transparent border-[#0D0606]/20 dark:border-[#D9E4D1]/20 hover:scale-105"
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Paper Texture/Style (Placeholder) */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" /> Texture
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="py-2.5 px-3 rounded-lg border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#D9E4D1] dark:bg-[#0D0606] text-sm font-medium hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/5 transition-colors">
                                Plain
                            </button>
                            <button className="py-2.5 px-3 rounded-lg border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 text-sm font-medium hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10 transition-colors text-zinc-500">
                                Grid
                            </button>
                        </div>
                    </div>

                    {/* Upload Image */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-2">
                            <Image className="w-3.5 h-3.5" /> Upload Image
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp, image/heic"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                onClick={handleUploadClick}
                                className="py-2.5 px-3 rounded-lg border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#D9E4D1] dark:bg-[#0D0606] text-sm font-medium hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/5 transition-colors"
                            >
                                Upload Image
                            </button>
                        </div>
                    </div>

                    {/* Download File Section */}
                    <div className="space-y-3">
                        <label className="text-xs uppercase tracking-wider font-semibold text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-2">
                            <Image className="w-3.5 h-3.5 opacity-70" />
                            Manajemen File
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => downloadPaper("docx")}
                                disabled={!isDownload} // Tombol otomatis tidak bisa diklik jika isDownload false
                                className={`
                py-2.5 px-3 rounded-lg border text-sm font-medium transition-all duration-200
                flex items-center justify-center gap-2
                ${isDownload
                                        ? "border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#D9E4D1] dark:bg-[#0D0606] hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/5 active:scale-95"
                                        : "border-transparent bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 text-zinc-400 cursor-pointer"}
            `}
                            >
                                <Image className="w-4 h-4" />
                                Download DOCX
                            </button>
                        </div>
                    </div>

                    {/* Print Action */}
                    <div className="pt-4 border-t border-[#0D0606]/20 dark:border-[#D9E4D1]/20">
                        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0D0606] hover:bg-[#0D0606]/80 text-[#D9E4D1] dark:bg-[#D9E4D1] dark:hover:bg-[#D9E4D1]/80 dark:text-[#0D0606] transition-all font-medium text-sm shadow-md hover:shadow-lg active:scale-95">
                            <Printer className="w-4 h-4" />
                            Print Paper
                        </button>
                    </div>
                </div>
            </motion.div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialType={authModalType}
            />
        </>
    );
}

