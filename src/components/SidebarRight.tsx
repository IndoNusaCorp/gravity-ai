"use client";

import { motion } from "framer-motion";
import { Settings, Printer, Palette, Layers, FileText, Image, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { AuthModal, AuthType } from "./AuthModal";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SidebarRightProps {
    onImageUpload?: (src: string) => void;
}

export function SidebarRight({ onImageUpload }: SidebarRightProps) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalType, setAuthModalType] = useState<AuthType>("login");

    //State untuk koneksikan Authentication ke SidebarRight
    const [username, getusername] = useState<string | null>(null);
    const [email, getemail] = useState<string | null>(null);
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

    //efek untuk mengambil data user dari supabase
    useEffect(() => {
        const fetchUser = async () => {
            const { data: user, error } = await supabase.auth.getUser();
            if (error) {
                console.error("Error fetching user:", error);
            } else {
                if (user?.user) {
                    getusername(user.user.user_metadata?.username || null);
                    getemail(user.user.email || null);
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    return (
        <>
            <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                className="fixed right-0 top-0 h-full w-72 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-l border-zinc-200 dark:border-zinc-800 p-6 z-40 hidden md:block pt-20 overflow-y-auto scrollbar-hide"
            >

                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Account Settings</h2>
                </div>

                <div className="flex flex-col items-center justify-center w-full mb-8">
                    <div className="flex w-24 h-24 bg-zinc-200 dark:bg-zinc-800 rounded-full items-center justify-center border-4 border-white dark:border-zinc-800 shadow-md overflow-hidden mb-4 relative">
                        <User className="w-12 h-12 text-zinc-400 dark:text-zinc-500" />
                        {loading && <div className="absolute inset-0 bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse rounded-full" />}
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center gap-3 w-full">
                            <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse"></div>
                            <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800/50 rounded animate-pulse mb-3"></div>
                        </div>
                    ) : email ? (
                        <div className="flex flex-col items-center">
                            <span className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">{username || email.split('@')[0]}</span>
                            <span className="text-zinc-500 dark:text-zinc-400 text-sm mb-3">{email}</span>
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    window.location.reload();
                                }}
                                className="text-xs bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 px-4 py-2 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            >
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Guest User</span>
                            <div className="flex gap-2">
                                <button onClick={() => { setAuthModalType('login'); setIsAuthModalOpen(true); }} className="text-sm bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">Login</button>
                                <button onClick={() => { setAuthModalType('register'); setIsAuthModalOpen(true); }} className="text-sm border border-zinc-200 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 px-4 py-2 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Register</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Paper Settings</h2>
                </div>

                <div className="space-y-8">
                    {/* Paper Size Settings */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Paper Size
                        </label>
                        <div className="relative">
                            <select
                                value={paperType}
                                onChange={(e) => setPaperType(e.target.value)}
                                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer"
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
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5" /> Paper Color
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {["#ffffff", "#f8f9fa", "#fdf6e3", "#fcfcfc", "#f0f4f8", "#000000"].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setPaperColor(color)}
                                    className={`w-full aspect-square rounded-full border-2 transition-transform duration-200 ${paperColor === color
                                        ? "border-zinc-900 dark:border-white scale-110 shadow-sm"
                                        : "border-transparent border-zinc-200 dark:border-zinc-700 hover:scale-105"
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Paper Texture/Style (Placeholder) */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" /> Texture
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                Plain
                            </button>
                            <button className="py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
                                Grid
                            </button>
                        </div>
                    </div>

                    {/* Upload Image */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
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
                                className="py-2.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                Upload Image
                            </button>
                        </div>
                    </div>

                    {/* Print Action */}
                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-all font-medium text-sm shadow-md hover:shadow-lg active:scale-95">
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

