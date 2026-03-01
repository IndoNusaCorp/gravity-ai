"use client";

import { motion } from "framer-motion";
import { Settings, Printer, Palette, Layers, FileText } from "lucide-react";
import { useEffect, useState } from "react";

export function SidebarRight() {
    // State untuk menyimpan warna kertas
    const [paperColor, setPaperColor] = useState("#ffffff");
    // State untuk menyimpan jenis/ukuran kertas (default A4)
    const [paperType, setPaperType] = useState("a4");

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

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            className="fixed right-0 top-0 h-full w-72 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-l border-zinc-200 dark:border-zinc-800 p-6 z-40 hidden md:block pt-20 overflow-y-auto scrollbar-hide"
        >
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

                {/* Print Action */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 transition-all font-medium text-sm shadow-md hover:shadow-lg active:scale-95">
                        <Printer className="w-4 h-4" />
                        Print Paper
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

