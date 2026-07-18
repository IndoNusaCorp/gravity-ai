"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Settings, Printer, Palette, Layers, FileText, Image, User, DockIcon, HardDrive, Server, X, CheckCircle, AlertCircle, Loader2, FolderOpen, Upload } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Authentication } from "../firebase/firebase.configuration";
import { AuthModal, AuthType } from "./AuthModal";

// Library untuk generate file DOCX & PDF yang valid
import { Document, Packer, Paragraph, TextRun, AlignmentType, SectionType, ShadingType, UnderlineType } from "docx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


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

    //state untuk save file ke libra drive
    const [SaveFileToLibraDrive, setSaveFileToLibraDrive] = useState(true);
    
    //state untuk delete file dari libra drive
    const [DeleteFileFromLibraDrive, setDeleteFileFromLibraDrive] = useState(true);

    // State untuk modal Save to LibraDrive
    const [isLibraDriveModalOpen, setIsLibraDriveModalOpen] = useState(false);
    const [libraDriveFolderName, setLibraDriveFolderName] = useState("");
    const [libraDriveFileName, setLibraDriveFileName] = useState("");
    const [libraDriveExtension, setLibraDriveExtension] = useState<"docx" | "pdf">("docx");
    const [libraDriveSaving, setLibraDriveSaving] = useState(false);
    const [libraDriveProgress, setLibraDriveProgress] = useState(0);
    const [libraDriveStatus, setLibraDriveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

    // State untuk menyimpan warna kertas
    const [paperColor, setPaperColor] = useState("#ffffff");
    // State untuk menyimpan jenis/ukuran kertas (default A4)
    const [paperType, setPaperType] = useState("a4");

    const [uploadImage, setUploadImage] = useState<string | null>(null);

    //Logika if else untuk simpan file ke libradrive (Front End)
    const handleSaveToLibraDrive = () => {
        // Reset modal state sebelum membuka
        setLibraDriveFolderName("");
        setLibraDriveFileName("");
        setLibraDriveExtension("docx");
        setLibraDriveProgress(0);
        setLibraDriveStatus("idle");
        setLibraDriveSaving(false);
        setIsLibraDriveModalOpen(true);
    }

    // Handler untuk proses simpan ke LibraDrive dari modal
    const handleConfirmSaveToLibraDrive = async () => {
        if (!libraDriveFileName.trim()) return;

        setLibraDriveSaving(true);
        setLibraDriveStatus("saving");
        setLibraDriveProgress(0);

        try {
            // Simulasi progress upload
            const progressInterval = setInterval(() => {
                setLibraDriveProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 15 + 5;
                });
            }, 300);

            // Kumpulkan konten dari editor untuk membuat file
            const pages: HTMLElement[] = [];
            let index = 0;
            let p = document.getElementById(`main-editor-${index}`);
            while (p) {
                pages.push(p);
                index++;
                p = document.getElementById(`main-editor-${index}`);
            }

            // Buat file DOCX atau PDF yang valid sesuai ekstensi yang dipilih
            const fullFileName = `${libraDriveFileName.trim()}.${libraDriveExtension}`;
            let fileBlob: Blob;

            if (libraDriveExtension === "docx") {
                // ============================================================
                // DOCX: Menggunakan library "docx" untuk membuat file .docx yang valid
                // File .docx asli adalah arsip ZIP berisi XML, bukan HTML biasa
                // ============================================================

                // Konversi warna CSS rgb/hex menjadi warna OOXML tanpa tanda "#".
                const cssColorToHex = (color: string): string | undefined => {
                    if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return undefined;
                    if (color.startsWith("#")) {
                        const hex = color.slice(1);
                        return hex.length === 3
                            ? hex.split("").map((char) => char + char).join("").toUpperCase()
                            : hex.slice(0, 6).toUpperCase();
                    }

                    const rgb = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
                    if (!rgb) return undefined;
                    return [rgb[1], rgb[2], rgb[3]]
                        .map((value) => Number(value).toString(16).padStart(2, "0"))
                        .join("")
                        .toUpperCase();
                };

                const getParagraphAlignment = (element: HTMLElement) => {
                    const alignment = window.getComputedStyle(element).textAlign;
                    if (alignment === "center") return AlignmentType.CENTER;
                    if (alignment === "right" || alignment === "end") return AlignmentType.RIGHT;
                    if (alignment === "justify") return AlignmentType.JUSTIFIED;
                    return AlignmentType.LEFT;
                };

                // Buat TextRun per text node agar format inline (font, size, warna,
                // highlight, bold, italic, underline) tidak hilang atau pecah baris.
                const textNodeToRun = (node: Node): TextRun | null => {
                    const text = node.textContent?.replace(/\u00a0/g, " ");
                    const parent = node.parentElement;
                    if (!text || !parent) return null;

                    const style = window.getComputedStyle(parent);
                    const fontSizePx = Number.parseFloat(style.fontSize) || 16;
                    const fontWeight = Number.parseInt(style.fontWeight, 10);
                    const color = cssColorToHex(style.color);
                    const background = cssColorToHex(style.backgroundColor);
                    const fontFamily = style.fontFamily
                        .split(",")[0]
                        .trim()
                        .replace(/^["']|["']$/g, "");

                    return new TextRun({
                        text,
                        font: fontFamily || "Arial",
                        // DOCX menggunakan half-point; 1 CSS px = 0,75 pt.
                        size: Math.max(1, Math.round(fontSizePx * 1.5)),
                        bold: Number.isNaN(fontWeight) ? style.fontWeight === "bold" : fontWeight >= 600,
                        italics: style.fontStyle === "italic",
                        underline: style.textDecorationLine.includes("underline")
                            ? { type: UnderlineType.SINGLE }
                            : undefined,
                        color,
                        shading: background
                            ? { type: ShadingType.CLEAR, fill: background, color: "auto" }
                            : undefined,
                    });
                };

                const blockTags = new Set([
                    "address", "article", "blockquote", "div", "h1", "h2", "h3",
                    "h4", "h5", "h6", "li", "ol", "p", "pre", "section", "ul",
                ]);

                // Fungsi helper: konversi HTML menjadi Paragraph tanpa menjadikan
                // setiap <span>/<font>/<b> sebagai paragraf baru.
                const htmlToParagraphs = (element: HTMLElement): Paragraph[] => {
                    const paragraphs: Paragraph[] = [];
                    let currentRuns: TextRun[] = [];

                    const flushParagraph = (sourceElement: HTMLElement = element) => {
                        if (currentRuns.length === 0) return;
                        paragraphs.push(new Paragraph({
                            children: currentRuns,
                            alignment: getParagraphAlignment(sourceElement),
                            spacing: { after: 0, line: 240 },
                        }));
                        currentRuns = [];
                    };

                    const collectInlineRuns = (node: Node) => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            const run = textNodeToRun(node);
                            if (run) currentRuns.push(run);
                            return;
                        }
                        if (!(node instanceof HTMLElement)) return;

                        if (node.tagName.toLowerCase() === "br") {
                            currentRuns.push(new TextRun({ break: 1 }));
                            return;
                        }

                        node.childNodes.forEach(collectInlineRuns);
                    };

                    element.childNodes.forEach((node) => {
                        if (node instanceof HTMLElement && blockTags.has(node.tagName.toLowerCase())) {
                            flushParagraph();

                            if (node.tagName.toLowerCase() === "ul" || node.tagName.toLowerCase() === "ol") {
                                Array.from(node.children).forEach((item, itemIndex) => {
                                    const prefix = node.tagName.toLowerCase() === "ol" ? `${itemIndex + 1}. ` : "• ";
                                    currentRuns.push(new TextRun({
                                        text: prefix,
                                        font: window.getComputedStyle(item).fontFamily.split(",")[0].replace(/["']/g, ""),
                                    }));
                                    collectInlineRuns(item);
                                    flushParagraph(item as HTMLElement);
                                });
                            } else if (Array.from(node.children).some((child) => blockTags.has(child.tagName.toLowerCase()))) {
                                paragraphs.push(...htmlToParagraphs(node));
                            } else {
                                collectInlineRuns(node);
                                flushParagraph(node);
                            }
                        } else {
                            collectInlineRuns(node);
                        }
                    });

                    flushParagraph();
                    return paragraphs;
                };

                const paragraphsPerPage = pages.map((pageDom) => {
                    const paragraphs = htmlToParagraphs(pageDom);
                    return paragraphs.length > 0
                        ? paragraphs
                        : [new Paragraph({ children: [] })];
                });

                // Satu editor menjadi satu section/halaman DOCX, dengan margin
                // yang mengikuti padding editor: 64px atas, 96px kiri, 48px kanan.
                const doc = new Document({
                    sections: paragraphsPerPage.map((paragraphs, pageIndex) => ({
                        properties: {
                            type: pageIndex === 0 ? SectionType.CONTINUOUS : SectionType.NEXT_PAGE,
                            page: {
                                size: { width: 11906, height: 16838 },
                                margin: {
                                    top: 960,
                                    right: 720,
                                    bottom: 960,
                                    left: 1440,
                                    header: 0,
                                    footer: 0,
                                    gutter: 0,
                                },
                            },
                        },
                        children: paragraphs,
                    })),
                });

                // Packer.toBlob() menghasilkan file .docx yang valid (ZIP berisi XML)
                fileBlob = await Packer.toBlob(doc);

            } else {
                // ============================================================
                // PDF: Menggunakan jsPDF + html2canvas untuk membuat file .pdf yang valid
                // html2canvas menangkap tampilan visual editor sebagai gambar,
                // lalu jsPDF memasukkannya ke dalam format PDF yang benar
                // ============================================================
                const pdf = new jsPDF("p", "mm", "a4");
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                for (let i = 0; i < pages.length; i++) {
                    // Tangkap editor secara langsung. Elemen kertas induk memiliki
                    // border, shadow, dan transform animasi yang dapat membuat
                    // html2canvas gagal pada beberapa browser.
                    const paperBackground =
                        window.getComputedStyle(pages[i].parentElement ?? pages[i]).backgroundColor ||
                        "#ffffff";
                    const canvas = await html2canvas(pages[i], {
                        scale: 2, // Resolusi 2x untuk kualitas lebih baik
                        useCORS: true, // Izinkan gambar cross-origin
                        backgroundColor: paperBackground,
                        logging: false,
                    });

                    // Konversi canvas ke gambar PNG
                    const imgData = canvas.toDataURL("image/png");

                    // Editor sudah mempunyai margin internal melalui padding.
                    // Gunakan lebar PDF penuh agar ukuran font/posisi tidak mengecil.
                    const imgRatio = canvas.height / canvas.width;
                    const imgWidth = pdfWidth;
                    let imgHeight = imgWidth * imgRatio;
                    imgHeight = Math.min(imgHeight, pdfHeight);

                    // Tambahkan halaman baru untuk halaman ke-2 dan seterusnya
                    if (i > 0) {
                        pdf.addPage();
                    }

                    // Masukkan gambar ke halaman PDF
                    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
                }

                // Output PDF sebagai Blob yang valid
                fileBlob = pdf.output("blob");
            }

            const file = new File([fileBlob], fullFileName, {
                type: libraDriveExtension === "docx"
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : "application/pdf"
            });
            const folderName = libraDriveFolderName.trim() || "Recent Documents";

            // Panggil fungsi SaveFileToLibraDrive dari firebase
            const { SaveFileToLibraDrive: SaveFn } = await import("@/firebase/storage.firebase");
            await SaveFn(file, folderName);

            clearInterval(progressInterval);
            setLibraDriveProgress(100);
            setLibraDriveStatus("success");
            setLibraDriveSaving(false);

            // Auto close modal setelah 2 detik jika sukses
            setTimeout(() => {
                setIsLibraDriveModalOpen(false);
                setLibraDriveStatus("idle");
            }, 2500);
        } catch (error) {
            console.error("Error saving to LibraDrive:", error);
            setLibraDriveProgress(0);
            setLibraDriveStatus("error");
            setLibraDriveSaving(false);
        }
    }

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
            {/* Account - Navbar Top Right */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-20 md:top-6 right-2 md:right-8 z-50 block"
            >
                <div className="relative p-2 bg-white/40 dark:bg-[#0D0606]/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex items-center gap-4">
                    {loading ? (
                        <div className="flex items-center gap-3 animate-pulse px-2">
                            <div className="w-10 h-10 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 rounded-full" />
                            <div className="space-y-2">
                                <div className="h-3 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 rounded w-20" />
                            </div>
                        </div>
                    ) : email ? (
                        <>
                            <div className="flex items-center gap-3 pl-2">
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#0D0606]/20 dark:border-[#D9E4D1]/20 shadow-sm">
                                    {photoURL ? (
                                        <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 flex items-center justify-center">
                                            <User className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />
                                        </div>
                                    )}
                                </div>
                                <div className="hidden md:flex flex-col pr-2">
                                    <h3 className="text-[#0D0606] dark:text-[#D9E4D1] font-semibold text-sm max-w-[120px] truncate">
                                        {username || email.split('@')[0]}
                                    </h3>
                                    <p className="text-xs text-[#0D0606]/60 dark:text-[#D9E4D1]/60 max-w-[120px] truncate mt-0.5">
                                        {email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={async () => {
                                    await signOut(Authentication);
                                    window.location.reload();
                                }}
                                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium text-xs transition-all border border-red-500/20 hover:border-red-500/30 active:scale-95"
                            >
                                Log Out
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-3 pl-2">
                            <div className="w-10 h-10 rounded-full bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 flex items-center justify-center border border-[#0D0606]/10 dark:border-[#D9E4D1]/10">
                                <User className="w-5 h-5 text-[#0D0606]/40 dark:text-[#D9E4D1]/40" />
                            </div>
                            <div className="hidden md:flex flex-col mr-2">
                                <h3 className="text-[#0D0606] dark:text-[#D9E4D1] font-medium text-sm">Not Logged In</h3>
                            </div>
                            <button
                                onClick={() => { setAuthModalType('login'); setIsAuthModalOpen(true); }}
                                className="px-5 py-2.5 rounded-xl bg-[#0D0606] hover:bg-[#0D0606]/80 text-[#D9E4D1] dark:bg-[#D9E4D1] dark:hover:bg-[#D9E4D1]/80 dark:text-[#0D0606] font-medium text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                Sign in with Google
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Bottom Bar - Paper Settings */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] max-w-6xl bg-white/40 dark:bg-[#0D0606]/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl px-4 md:px-6 py-3 z-40 flex items-center md:justify-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]"
            >
                {/* 1. Paper Size */}
                <div className="flex flex-col gap-1 min-w-[140px]">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> Size
                    </label>
                    <div className="relative">
                        <select
                            value={paperType}
                            onChange={(e) => setPaperType(e.target.value)}
                            className="w-full appearance-none bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 text-[#0D0606] dark:text-[#D9E4D1] text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#0D0606] dark:focus:ring-[#D9E4D1] transition-all cursor-pointer"
                        >
                            {paperTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                            <Layers className="w-3 h-3" />
                        </div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-10 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 shrink-0"></div>

                {/* 2. Paper Color */}
                <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-1.5">
                        <Palette className="w-3 h-3" /> Color
                    </label>
                    <div className="flex items-center gap-1.5">
                        {["#ffffff", "#f8f9fa", "#fdf6e3", "#fcfcfc", "#f0f4f8", "#000000"].map((color) => (
                            <button
                                key={color}
                                onClick={() => setPaperColor(color)}
                                className={`w-7 h-7 rounded-full border-2 transition-transform duration-200 ${paperColor === color
                                    ? "border-[#0D0606] dark:border-[#D9E4D1] scale-110 shadow-sm"
                                    : "border-[#0D0606]/20 dark:border-[#D9E4D1]/20 hover:scale-105"
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-10 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 shrink-0"></div>

                {/* 3. Texture */}
                <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-1.5">
                        <Layers className="w-3 h-3" /> Texture
                    </label>
                    <div className="flex items-center gap-1.5">
                        <button className="py-2 px-3 rounded-lg border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#D9E4D1] dark:bg-[#0D0606] text-xs font-medium hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/5 transition-colors">
                            Plain
                        </button>
                        <button className="py-2 px-3 rounded-lg border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 text-xs font-medium hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10 transition-colors text-zinc-500">
                            Grid
                        </button>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-10 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 shrink-0"></div>

                {/* 4. Upload Image */}
                <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-1.5">
                        <Image className="w-3 h-3" /> Image
                    </label>
                    <div className="flex items-center gap-1.5">
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp, image/heic"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            onClick={handleUploadClick}
                            className="py-2 px-3 rounded-lg border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#D9E4D1] dark:bg-[#0D0606] text-xs font-medium hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/5 transition-colors flex items-center gap-2"
                        >
                            <Upload className="w-3 h-3" /> Upload
                        </button>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-10 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 shrink-0"></div>

                {/* 5. File Management */}
                <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-1.5">
                        <HardDrive className="w-3 h-3" /> Export
                    </label>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => downloadPaper("docx")}
                            disabled={!isDownload}
                            className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all duration-200 flex items-center gap-2 ${isDownload ? "border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#D9E4D1] dark:bg-[#0D0606] hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/5 active:scale-95" : "border-transparent bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 text-zinc-400 cursor-pointer"}`}
                        >
                            <DockIcon className="w-3 h-3" /> DOCX
                        </button>
                        <button
                            onClick={handleSaveToLibraDrive}
                            disabled={!isDownload}
                            className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all duration-200 flex items-center gap-2 ${isDownload ? "border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#D9E4D1] dark:bg-[#0D0606] hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/5 active:scale-95" : "border-transparent bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 text-zinc-400 cursor-pointer"}`}
                        >
                            <Server className="w-3 h-3" /> Drive
                        </button>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-10 bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 shrink-0"></div>

                {/* 6. Print Action */}
                <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-[10px] uppercase tracking-wider font-semibold transparent opacity-0">Action</label>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0D0606] hover:bg-[#0D0606]/80 text-[#D9E4D1] dark:bg-[#D9E4D1] dark:hover:bg-[#D9E4D1]/80 dark:text-[#0D0606] transition-all font-medium text-xs shadow-md hover:shadow-lg active:scale-95">
                        <Printer className="w-3.5 h-3.5" />
                        Print
                    </button>
                </div>
            </motion.div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialType={authModalType}
            />

            {/* Modal Save to LibraDrive */}
            <AnimatePresence>
                {isLibraDriveModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && !libraDriveSaving) {
                                setIsLibraDriveModalOpen(false);
                                setLibraDriveStatus("idle");
                            }
                        }}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="relative w-full max-w-md mx-4 bg-[#D9E4D1] dark:bg-[#0D0606] border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 flex items-center justify-center border border-[#0D0606]/20 dark:border-[#D9E4D1]/20">
                                        <Server className="w-5 h-5 text-[#0D0606] dark:text-[#D9E4D1]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#0D0606] dark:text-[#D9E4D1]">Save to LibraDrive</h3>
                                        <p className="text-xs text-[#0D0606]/60 dark:text-[#D9E4D1]/60">Simpan dokumen ke cloud storage</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!libraDriveSaving) {
                                            setIsLibraDriveModalOpen(false);
                                            setLibraDriveStatus("idle");
                                        }
                                    }}
                                    disabled={libraDriveSaving}
                                    className="w-8 h-8 rounded-lg hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/10 flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                    <X className="w-4 h-4 text-[#0D0606] dark:text-[#D9E4D1]" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 pb-6 space-y-5">
                                {/* Status: Saving / Success / Error */}
                                {libraDriveStatus === "saving" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Menyimpan ke LibraDrive...</span>
                                        </div>
                                        <div className="w-full h-2 bg-blue-500/20 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                                                initial={{ width: "0%" }}
                                                animate={{ width: `${Math.min(libraDriveProgress, 100)}%` }}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                            />
                                        </div>
                                        <p className="text-xs text-blue-500/70 mt-2">{Math.round(Math.min(libraDriveProgress, 100))}% selesai</p>
                                    </motion.div>
                                )}

                                {libraDriveStatus === "success" && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3"
                                    >
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        <div>
                                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Berhasil disimpan!</p>
                                            <p className="text-xs text-emerald-500/70 mt-0.5">File telah tersimpan di LibraDrive</p>
                                        </div>
                                    </motion.div>
                                )}

                                {libraDriveStatus === "error" && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3"
                                    >
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        <div>
                                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Gagal menyimpan!</p>
                                            <p className="text-xs text-red-500/70 mt-0.5">Terjadi kesalahan, silakan coba lagi</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Form Fields (hidden during saving/success) */}
                                {libraDriveStatus !== "saving" && libraDriveStatus !== "success" && (
                                    <>
                                        {/* Nama Folder */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-2">
                                                <FolderOpen className="w-3.5 h-3.5" />
                                                Nama Folder
                                            </label>
                                            <input
                                                type="text"
                                                value={libraDriveFolderName}
                                                onChange={(e) => setLibraDriveFolderName(e.target.value)}
                                                placeholder="Recent Documents"
                                                className="w-full bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 text-[#0D0606] dark:text-[#D9E4D1] text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0D0606]/30 dark:focus:ring-[#D9E4D1]/30 transition-all placeholder:text-[#0D0606]/30 dark:placeholder:text-[#D9E4D1]/30"
                                            />
                                            <p className="text-xs text-[#0D0606]/40 dark:text-[#D9E4D1]/40">Kosongkan untuk menyimpan di "Recent Documents"</p>
                                        </div>

                                        {/* Nama File */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-2">
                                                <FileText className="w-3.5 h-3.5" />
                                                Nama File
                                            </label>
                                            <input
                                                type="text"
                                                value={libraDriveFileName}
                                                onChange={(e) => setLibraDriveFileName(e.target.value)}
                                                placeholder="Masukkan nama file..."
                                                className="w-full bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 text-[#0D0606] dark:text-[#D9E4D1] text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0D0606]/30 dark:focus:ring-[#D9E4D1]/30 transition-all placeholder:text-[#0D0606]/30 dark:placeholder:text-[#D9E4D1]/30"
                                            />
                                        </div>

                                        {/* Ekstensi File */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 flex items-center gap-2">
                                                <Layers className="w-3.5 h-3.5" />
                                                Ekstensi File
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setLibraDriveExtension("docx")}
                                                    className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                                        libraDriveExtension === "docx"
                                                            ? "border-[#0D0606] dark:border-[#D9E4D1] bg-[#0D0606] dark:bg-[#D9E4D1] text-[#D9E4D1] dark:text-[#0D0606] shadow-md"
                                                            : "border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 text-[#0D0606]/70 dark:text-[#D9E4D1]/70 hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/15"
                                                    }`}
                                                >
                                                    <DockIcon className="w-4 h-4" />
                                                    .docx
                                                </button>
                                                <button
                                                    onClick={() => setLibraDriveExtension("pdf")}
                                                    className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                                        libraDriveExtension === "pdf"
                                                            ? "border-[#0D0606] dark:border-[#D9E4D1] bg-[#0D0606] dark:bg-[#D9E4D1] text-[#D9E4D1] dark:text-[#0D0606] shadow-md"
                                                            : "border-[#0D0606]/20 dark:border-[#D9E4D1]/20 bg-[#0D0606]/5 dark:bg-[#D9E4D1]/10 text-[#0D0606]/70 dark:text-[#D9E4D1]/70 hover:bg-[#0D0606]/10 dark:hover:bg-[#D9E4D1]/15"
                                                    }`}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    .pdf
                                                </button>
                                            </div>
                                        </div>

                                        {/* Preview nama file */}
                                        {libraDriveFileName.trim() && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="rounded-xl bg-[#0D0606]/5 dark:bg-[#D9E4D1]/5 border border-[#0D0606]/10 dark:border-[#D9E4D1]/10 px-4 py-3"
                                            >
                                                <p className="text-xs text-[#0D0606]/50 dark:text-[#D9E4D1]/50 mb-1">Preview</p>
                                                <p className="text-sm font-mono text-[#0D0606] dark:text-[#D9E4D1] truncate">
                                                    📁 {libraDriveFolderName.trim() || "Recent Documents"} / {libraDriveFileName.trim()}.{libraDriveExtension}
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    setIsLibraDriveModalOpen(false);
                                                    setLibraDriveStatus("idle");
                                                }}
                                                className="flex-1 py-3 rounded-xl border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/5 transition-all active:scale-95"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={handleConfirmSaveToLibraDrive}
                                                disabled={!libraDriveFileName.trim()}
                                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                                    libraDriveFileName.trim()
                                                        ? "bg-[#0D0606] dark:bg-[#D9E4D1] text-[#D9E4D1] dark:text-[#0D0606] hover:opacity-90 shadow-md hover:shadow-lg"
                                                        : "bg-[#0D0606]/20 dark:bg-[#D9E4D1]/20 text-[#0D0606]/40 dark:text-[#D9E4D1]/40 cursor-not-allowed"
                                                }`}
                                            >
                                                <Server className="w-4 h-4" />
                                                Simpan
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Tombol tutup saat error */}
                                {libraDriveStatus === "error" && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setLibraDriveStatus("idle")}
                                            className="flex-1 py-3 rounded-xl border border-[#0D0606]/20 dark:border-[#D9E4D1]/20 text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 hover:bg-[#0D0606]/5 dark:hover:bg-[#D9E4D1]/5 transition-all active:scale-95"
                                        >
                                            Coba Lagi
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsLibraDriveModalOpen(false);
                                                setLibraDriveStatus("idle");
                                            }}
                                            className="flex-1 py-3 rounded-xl bg-[#0D0606]/10 dark:bg-[#D9E4D1]/10 text-sm font-medium text-[#0D0606]/70 dark:text-[#D9E4D1]/70 hover:bg-[#0D0606]/15 dark:hover:bg-[#D9E4D1]/15 transition-all active:scale-95"
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
